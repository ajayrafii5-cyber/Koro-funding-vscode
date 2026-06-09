/**
 * Koro Funding — Dashboard Routes
 * GET /api/v1/dashboard/overview
 * GET /api/v1/dashboard/accounts
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/dashboard/overview
router.get('/overview', async (req, res, next) => {
  try {
    const traderId = req.trader.id;

    const accounts = await prisma.tradingAccount.findMany({
      where: { traderId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, platformLogin: true, type: true, size: true, phase: true,
        status: true, balance: true, equity: true, dailyLossUsed: true,
        dailyLossLimit: true, maxDrawdownUsed: true, maxDrawdownLimit: true,
        profitToDate: true, profitTarget: true, tradingDays: true,
        payoutSplit: true, platform: true, platformServer: true,
        createdAt: true, expiresAt: true, passedPhaseAt: true, fundedAt: true,
      }
    });

    // Aggregate stats
    const totalPayout = await prisma.payout.aggregate({
      where: { traderId, status: 'PAID' },
      _sum: { amountNet: true }
    });

    const pendingPayout = await prisma.payout.aggregate({
      where: { traderId, status: { in: ['PENDING', 'UNDER_REVIEW', 'PROCESSING'] } },
      _sum: { amountNet: true }
    });

    return res.json({
      accounts,
      stats: {
        totalAccounts:   accounts.length,
        activeAccounts:  accounts.filter(a => a.status === 'ACTIVE').length,
        fundedAccounts:  accounts.filter(a => a.status === 'FUNDED').length,
        passedAccounts:  accounts.filter(a => a.status === 'PASSED').length,
        totalPayout:     Number(totalPayout._sum.amountNet) || 0,
        pendingPayout:   Number(pendingPayout._sum.amountNet) || 0,
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/accounts/:id/metrics
router.get('/accounts/:id/metrics', async (req, res, next) => {
  try {
    const { id } = req.params;
    const traderId = req.trader.id;

    const account = await prisma.tradingAccount.findFirst({
      where: { id, traderId },
      include: {
        metricsSnapshots: {
          orderBy: { snapshotAt: 'desc' },
          take: 30,
          select: { balance: true, equity: true, dailyPnl: true, snapshotAt: true }
        },
        trades: {
          where: { isOpen: false },
          orderBy: { closeTime: 'desc' },
          take: 20,
        },
        breachEvents: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!account) return res.status(404).json({ error: 'Akun tidak ditemukan.' });

    return res.json({ account });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/payouts
router.get('/payouts', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const payouts  = await prisma.payout.findMany({
      where: { traderId },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });
    return res.json({ payouts });
  } catch (err) {
    next(err);
  }
});

export default router;
