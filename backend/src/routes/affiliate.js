import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const router = Router();
const prisma = new PrismaClient();

export const COMMISSION_RATE = 0.10;  // 10% untuk referrer
export const DISCOUNT_RATE   = 0.25;  // 25% diskon untuk buyer

const TIER_THRESHOLDS = {
  BRONZE:  0,
  SILVER:  3,
  GOLD:    10,
  DIAMOND: 25,
};

function getTier(totalConversions) {
  if (totalConversions >= TIER_THRESHOLDS.DIAMOND) return 'DIAMOND';
  if (totalConversions >= TIER_THRESHOLDS.GOLD)    return 'GOLD';
  if (totalConversions >= TIER_THRESHOLDS.SILVER)  return 'SILVER';
  return 'BRONZE';
}

// GET /api/v1/affiliate/stats
router.get('/stats', async (req, res, next) => {
  try {
    const trader = await prisma.trader.findUnique({
      where: { id: req.trader.id },
      select: { affiliateRefCode: true }
    });

    let stats = await prisma.affiliateStats.findUnique({
      where: { traderId: req.trader.id }
    });

    // Auto-create stats jika belum ada
    if (!stats) {
      stats = await prisma.affiliateStats.create({
        data: { traderId: req.trader.id }
      });
    }

    // Auto-update tier
    const correctTier = getTier(stats.totalConversions);
    if (stats.tier !== correctTier) {
      stats = await prisma.affiliateStats.update({
        where: { traderId: req.trader.id },
        data: { tier: correctTier }
      });
    }

    // Ambil history konversi
    const conversions = await prisma.affiliateConversion.findMany({
      where: { referrerId: req.trader.id },
      orderBy: { convertedAt: 'desc' },
      take: 20,
    });

    const refLink = `${process.env.APP_URL ?? 'http://localhost:3000'}/challenge?ref=${trader?.affiliateRefCode}`;

    res.json({
      stats,
      refCode: trader?.affiliateRefCode,
      refLink,
      commissionRate: COMMISSION_RATE,
      discountRate: DISCOUNT_RATE,
      conversions,
      tierThresholds: TIER_THRESHOLDS,
    });
  } catch (err) { next(err); }
});

// GET /api/v1/affiliate/validate/:code — cek refcode atau promo code
router.get("/validate/:code", async (req, res, next) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const now  = new Date();

    // Cek affiliate refcode dulu
    const trader = await prisma.trader.findUnique({
      where: { affiliateRefCode: code },
      select: { id: true, fullName: true }
    });
    if (trader) {
      return res.json({ valid: true, discount: DISCOUNT_RATE, type: 'affiliate' });
    }

    // Cek promo code
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo)                                              return res.status(404).json({ valid: false, error: 'Kode tidak ditemukan' });
    if (!promo.isActive)                                     return res.status(400).json({ valid: false, error: 'Kode promo tidak aktif' });
    if (promo.validUntil && promo.validUntil < now)          return res.status(400).json({ valid: false, error: 'Kode promo sudah expired' });
    if (promo.validFrom > now)                               return res.status(400).json({ valid: false, error: 'Kode promo belum berlaku' });
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return res.status(400).json({ valid: false, error: 'Kode promo sudah habis' });

    return res.json({ valid: true, discount: promo.discount / 100, type: 'promo' });
  } catch (err) { next(err); }
});
export default router;
