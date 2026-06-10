import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../lib/email.js';

const router = Router();
const prisma = new PrismaClient();

// Semua route admin wajib role ADMIN
router.use(requireAdmin);

// ─── OVERVIEW ─────────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
  try {
    const [totalTraders, totalOrders, pendingOrders, totalRevenue] = await Promise.all([
      prisma.trader.count(),
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { pricePaid: true }
      })
    ]);
    res.json({
      totalTraders,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.pricePaid || 0
    });
  } catch (err) { next(err); }
});

// ─── TRADERS ──────────────────────────────────────────────
router.get('/traders', async (req, res, next) => {
  try {
    const traders = await prisma.trader.findMany({
      select: {
        id: true, email: true, fullName: true, phone: true,
        country: true, kycStatus: true, role: true,
        createdAt: true, lastLoginAt: true,
        accounts: { select: { id: true, status: true, size: true, type: true, phase: true } },
        _count: { select: { accounts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ traders });
  } catch (err) { next(err); }
});

router.get('/traders/:id', async (req, res, next) => {
  try {
    const trader = await prisma.trader.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, fullName: true, phone: true,
        country: true, kycStatus: true, role: true,
        createdAt: true, lastLoginAt: true,
        accounts: true,
        payouts: true,
        _count: { select: { accounts: true } }
      }
    });
    if (!trader) return res.status(404).json({ error: 'Trader tidak ditemukan.' });
    res.json({ trader });
  } catch (err) { next(err); }
});

router.patch('/traders/:id/suspend', async (req, res, next) => {
  try {
    // Suspend semua akun trading trader
    await prisma.tradingAccount.updateMany({
      where: { traderId: req.params.id },
      data: { status: 'SUSPENDED' }
    });
    res.json({ message: 'Trader berhasil disuspend.' });
  } catch (err) { next(err); }
});

router.patch('/traders/:id/unsuspend', async (req, res, next) => {
  try {
    await prisma.tradingAccount.updateMany({
      where: { traderId: req.params.id, status: 'SUSPENDED' },
      data: { status: 'ACTIVE' }
    });
    res.json({ message: 'Trader berhasil diaktifkan.' });
  } catch (err) { next(err); }
});

// ─── ORDERS ───────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { paymentStatus: status } : {};
    const orders = await prisma.order.findMany({
      where,
      include: {
        accounts: { select: { id: true, platformLogin: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Ambil info trader manual karena tidak ada relasi langsung
    const traderIds = [...new Set(orders.map(o => o.traderId))];
    const traders = await prisma.trader.findMany({
      where: { id: { in: traderIds } },
      select: { id: true, email: true, fullName: true }
    });
    const traderMap = Object.fromEntries(traders.map(t => [t.id, t]));
    const result = orders.map(o => ({ ...o, trader: traderMap[o.traderId] || null }));
    res.json({ orders: result });
  } catch (err) { next(err); }
});

router.patch('/orders/:id/approve', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan.' });
    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Order sudah diapprove.' });
    }
    const dailyLossLimit   = order.accountSize * 0.05;
    const maxDrawdownLimit = order.accountSize * 0.10;
    const profitTarget     = order.challengeType === 'CHALLENGE_1STEP' ? order.accountSize * 0.10 : order.accountSize * 0.08;
    const platformLogin    = 'KF-' + Math.floor(10000 + Math.random() * 90000);
    const platformPassword = Math.random().toString(36).slice(2, 10);
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID', paidAt: new Date() } });
      await tx.tradingAccount.create({ data: { traderId: order.traderId, orderId: order.id, platformLogin, platformPassword, platformServer: 'KoroFunding-Demo', platform: 'MT5', type: order.challengeType, size: order.accountSize, phase: 1, status: 'ACTIVE', balance: order.accountSize, equity: order.accountSize, dailyLossLimit, maxDrawdownLimit, profitTarget, payoutSplit: 80, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    });
    res.json({ message: 'Order berhasil diapprove dan akun trading telah dibuat.' });
  } catch (err) { next(err); }
});

router.patch('/orders/:id/reject', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan.' });
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'FAILED' }
    });
    res.json({ message: 'Order berhasil direject.', order: updated });
  } catch (err) { next(err); }
});


router.delete('/traders/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const trader = await prisma.trader.findUnique({ where: { id } });
    if (!trader) return res.status(404).json({ error: 'Trader tidak ditemukan' });
    if (trader.role === 'ADMIN') return res.status(403).json({ error: 'Tidak bisa hapus admin' });
    await prisma.breachEvent.deleteMany({ where: { account: { traderId: id } } });
    await prisma.metricsSnapshot.deleteMany({ where: { account: { traderId: id } } });
    await prisma.trade.deleteMany({ where: { account: { traderId: id } } });
    await prisma.tradingAccount.deleteMany({ where: { traderId: id } });
    await prisma.affiliateConversion.deleteMany({ where: { OR: [{ referrerId: id }, { referredId: id }] } });
    await prisma.affiliateStats.deleteMany({ where: { traderId: id } });
    await prisma.order.deleteMany({ where: { traderId: id } });
    await prisma.trader.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});


// ─── DEV ONLY: Manual breach trigger untuk testing ───────
router.post('/test/breach/:accountId', async (req, res, next) => {
  try {
    const account = await prisma.tradingAccount.findUnique({
      where: { id: req.params.accountId },
      include: { trader: { select: { email: true, fullName: true } } }
    });
    if (!account) return res.status(404).json({ error: 'Akun tidak ditemukan' });

    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: { status: 'BREACHED', dailyLossUsed: account.dailyLossLimit }
    });

    await prisma.breachEvent.create({
      data: {
        accountId: account.id,
        type: 'DAILY_LOSS',
        valueAtBreach: Number(account.dailyLossLimit),
        limitValue: Number(account.dailyLossLimit),
      }
    });

    await sendEmail({
      to: account.trader.email,
      template: 'breach_daily',
      data: {
        firstName: account.trader.fullName?.split(' ')[0] || 'Trader',
        accountId: account.platformLogin,
        limitValue: String(account.dailyLossLimit),
        valueHit: String(account.dailyLossLimit),
      }
    }).catch(console.error);
    res.json({ success: true, message: `Akun ${account.platformLogin} di-breach` });
  } catch (err) { next(err); }
});

// ─── PROMO CODE CRUD ─────────────────────────────────────────

// GET /api/v1/admin/promo — list semua promo code
router.get('/promo', async (req, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ promos });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/promo — buat promo code baru
router.post('/promo', async (req, res, next) => {
  try {
    const { code, discount, maxUses, validFrom, validUntil, description } = req.body;
    if (!code || !discount) return res.status(400).json({ error: 'code dan discount wajib diisi.' });
    if (discount < 1 || discount > 100) return res.status(400).json({ error: 'Diskon harus antara 1-100%.' });
    const existing = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return res.status(409).json({ error: 'Kode sudah ada.' });
    const promo = await prisma.promoCode.create({
      data: {
        code:        code.toUpperCase(),
        discount:    Number(discount),
        maxUses:     maxUses ? Number(maxUses) : null,
        validFrom:   validFrom ? new Date(validFrom) : new Date(),
        validUntil:  validUntil ? new Date(validUntil) : null,
        description: description ?? null,
        createdBy:   req.trader.id,
      }
    });
    res.status(201).json({ success: true, promo });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/promo/:id — update promo code
router.patch('/promo/:id', async (req, res, next) => {
  try {
    const { discount, maxUses, validFrom, validUntil, description, isActive } = req.body;
    const promo = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...(discount    !== undefined && { discount: Number(discount) }),
        ...(maxUses     !== undefined && { maxUses: maxUses ? Number(maxUses) : null }),
        ...(validFrom   !== undefined && { validFrom: new Date(validFrom) }),
        ...(validUntil  !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(description !== undefined && { description }),
        ...(isActive    !== undefined && { isActive }),
      }
    });
    res.json({ success: true, promo });
  } catch (err) { next(err); }
});

// DELETE /api/v1/admin/promo/:id — hapus promo code
router.delete('/promo/:id', async (req, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── AFFILIATE COMMISSION MANAGEMENT ─────────────────────────────────────────

// GET /api/v1/admin/affiliate/commissions
router.get('/affiliate/commissions', async (req, res, next) => {
  try {
    const { status } = req.query;
    const conversions = await prisma.affiliateConversion.findMany({
      where: status ? { status } : {},
      orderBy: { convertedAt: 'desc' },
    });
    const enriched = await Promise.all(conversions.map(async (c) => {
      const [referrer, referred, order] = await Promise.all([
        prisma.trader.findUnique({ where: { id: c.referrerId }, select: { id: true, fullName: true, email: true, affiliateRefCode: true } }),
        prisma.trader.findUnique({ where: { id: c.referredId }, select: { id: true, fullName: true, email: true } }),
        prisma.order.findUnique({ where: { id: c.orderId }, select: { id: true, pricePaid: true, accountSize: true, challengeType: true } }),
      ]);
      return { ...c, referrer, referred, order };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/affiliate/commissions/:id/approve
router.post('/affiliate/commissions/:id/approve', async (req, res, next) => {
  try {
    const conversion = await prisma.affiliateConversion.findUnique({ where: { id: req.params.id } });
    if (!conversion) return res.status(404).json({ error: 'Konversi tidak ditemukan' });
    if (conversion.status !== 'PENDING') return res.status(400).json({ error: 'Hanya PENDING yang bisa di-approve' });
    const [updated] = await prisma.$transaction([
      prisma.affiliateConversion.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED', approvedAt: new Date() },
      }),
      prisma.affiliateStats.update({
        where: { traderId: conversion.referrerId },
        data: { pendingBalance: { increment: conversion.commissionAmount } },
      }),
    ]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/affiliate/commissions/:id/reject
router.post('/affiliate/commissions/:id/reject', async (req, res, next) => {
  try {
    const conversion = await prisma.affiliateConversion.findUnique({ where: { id: req.params.id } });
    if (!conversion) return res.status(404).json({ error: 'Konversi tidak ditemukan' });
    if (conversion.status !== 'PENDING') return res.status(400).json({ error: 'Hanya PENDING yang bisa di-reject' });
    const updated = await prisma.affiliateConversion.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
