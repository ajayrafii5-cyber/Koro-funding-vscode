import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';

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
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'PAID', paidAt: new Date() }
    });
    res.json({ message: 'Order berhasil diapprove.', order: updated });
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
    await prisma.tradingAccount.deleteMany({ where: { traderId: id } });
    await prisma.order.deleteMany({ where: { traderId: id } });
    await prisma.trader.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
