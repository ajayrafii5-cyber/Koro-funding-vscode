import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Harga challenge dalam USD cents (Stripe pakai cents)
const CHALLENGE_PRICES = {
  CHALLENGE_2STEP: {
    10000:  14900,  // $149
    25000:  29900,  // $299
    50000:  49900,  // $499
    100000: 89900,  // $899
    200000: 149900, // $1499
  },
  CHALLENGE_1STEP: {
    10000:  19900,
    25000:  39900,
    50000:  69900,
    100000: 119900,
    200000: 199900,
  },
  INSTANT_FUNDING: {
    10000:  24900,
    25000:  49900,
    50000:  89900,
    100000: 149900,
    200000: 249900,
  },
};

function getAccountLimits(type, size) {
  const dailyLossLimit   = size * 0.05;
  const maxDrawdownLimit = size * 0.10;
  const profitTarget     = type === 'CHALLENGE_1STEP' ? size * 0.10 : size * 0.08;
  return { dailyLossLimit, maxDrawdownLimit, profitTarget };
}

// POST /api/v1/orders — buat order PENDING + Stripe Checkout Session
router.post('/', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const { challengeType, accountSize } = req.body;

    if (!challengeType || !accountSize) {
      return res.status(400).json({ error: 'challengeType dan accountSize wajib diisi.' });
    }

    const priceInCents = CHALLENGE_PRICES[challengeType]?.[accountSize];
    if (!priceInCents) {
      return res.status(400).json({ error: 'Kombinasi tipe dan ukuran akun tidak valid.' });
    }

    // Buat order PENDING di DB
    const order = await prisma.order.create({
      data: {
        traderId,
        challengeType,
        accountSize,
        pricePaid:       priceInCents / 100,
        currency:        'USD',
        paymentMethod:   'CARD',
        paymentProvider: 'stripe',
        paymentStatus:   'PENDING',
      },
    });

    // Buat Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Koro Funding — ${challengeType.replace('_', ' ')} $${accountSize.toLocaleString()}`,
            description: `Akun trading challenge ukuran $${accountSize.toLocaleString()}`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/checkout/success?order_id=${order.id}`,
      cancel_url:  `${process.env.APP_URL}/checkout/cancel?order_id=${order.id}`,
      metadata: {
        orderId:   order.id,
        traderId:  traderId,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId:    order.id,
        paymentUrl: session.url,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
