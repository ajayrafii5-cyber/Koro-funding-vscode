import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const router = Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await prisma.affiliateStats.findUnique({
      where: { traderId: req.user.id }
    });
    const trader = await prisma.trader.findUnique({
      where: { id: req.user.id },
      select: { affiliateRefCode: true }
    });
    res.json({ stats, refCode: trader?.affiliateRefCode });
  } catch (err) { next(err); }
});

export default router;
