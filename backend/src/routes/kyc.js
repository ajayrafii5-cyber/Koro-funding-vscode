import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const router = Router();
const prisma = new PrismaClient();

router.get('/status', async (req, res, next) => {
  try {
    const trader = await prisma.trader.findUnique({
      where: { id: req.user.id },
      select: { kycStatus: true, kycDocuments: true }
    });
    res.json(trader);
  } catch (err) { next(err); }
});

export default router;
