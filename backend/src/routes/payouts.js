/**
 * Koro Funding — Payout Routes
 * POST /api/v1/payouts/request
 * GET  /api/v1/payouts/history
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { notifyAdmin } from '../lib/slack.js';
import { sendEmail } from '../lib/email.js';

const router = Router();
const prisma = new PrismaClient();

const MIN_PAYOUT = 50;

// POST /api/v1/payouts/request
router.post('/request', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const { accountId, amount, method, bankDetails } = req.body;

    if (!accountId || !amount || !method) {
      return res.status(400).json({ error: 'accountId, amount, dan method wajib diisi.' });
    }

    if (Number(amount) < MIN_PAYOUT) {
      return res.status(400).json({ error: `Minimum payout adalah $${MIN_PAYOUT}.` });
    }

    // Validate account ownership & status
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, traderId, status: 'FUNDED' },
      include: { trader: true }
    });

    if (!account) {
      return res.status(404).json({ error: 'Akun funded tidak ditemukan atau tidak eligible.' });
    }

    // Check available profit
    const profitAvailable = Number(account.profitToDate);
    if (Number(amount) > profitAvailable) {
      return res.status(400).json({ error: `Jumlah melebihi profit tersedia ($${profitAvailable}).` });
    }

    // Calculate split
    const splitPct   = Number(account.payoutSplit);
    const amountNet  = Number(amount) * (splitPct / 100);
    const fee        = Number(amount) - amountNet;

    const payout = await prisma.payout.create({
      data: {
        traderId,
        accountId,
        amountGross:    Number(amount),
        splitPercentage: splitPct,
        amountNet,
        fee,
        method,
        bankDetails:    bankDetails || null,
        status:         'PENDING',
      }
    });

    // Notify admin
    await notifyAdmin({
      text: `💸 Payout Request: ${account.trader.email} | $${amountNet.toFixed(2)} via ${method} | Account #${account.platformLogin}`,
      color: 'warning'
    });

    // Email confirmation
    await sendEmail({
      to:       account.trader.email,
      template: 'payout_processing',
      data: {
        firstName: account.trader.fullName.split(' ')[0],
        amount:    `$${amountNet.toFixed(2)}`,
        method,
        payoutId:  payout.id,
        dashboardUrl: `${process.env.APP_URL}/dashboard`
      }
    });

    return res.status(201).json({ message: 'Payout request berhasil diajukan!', payout });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payouts/history
router.get('/history', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const payouts  = await prisma.payout.findMany({
      where: { traderId },
      orderBy: { requestedAt: 'desc' },
    });
    return res.json({ payouts });
  } catch (err) {
    next(err);
  }
});

export default router;
