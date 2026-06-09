import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const accounts = await prisma.tradingAccount.findMany({
      where: { traderId: req.trader.id },
    });
    res.json({ accounts });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const account = await prisma.tradingAccount.findFirst({
      where: { id: req.params.id, traderId: req.trader.id },
      include: { trades: { take: 20, orderBy: { openTime: 'desc' } } }
    });
    if (!account) return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    res.json({ account });
  } catch (err) { next(err); }
});

export default router;
