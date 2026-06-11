import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DISCOUNT_RATE = 0.25; // 25% diskon untuk buyer

const CHALLENGE_PRICES = {
  CHALLENGE_2STEP:  { 5000: 2500, 10000: 4500, 25000: 10900, 50000: 17900, 100000: 32900, 200000: 64900 },
  CHALLENGE_1STEP:  { 5000: 3500, 10000: 6500, 25000: 14900, 50000: 24900, 100000: 44900, 200000: 87900 },
  INSTANT_FUNDING:  { 5000: 4500, 10000: 8500, 25000: 18900, 50000: 31900, 100000: 57900, 200000: 109900 },
};

function getAccountLimits(type, size) {
  const dailyLossLimit   = size * 0.05;
  const maxDrawdownLimit = size * 0.10;
  const profitTarget     = type === 'CHALLENGE_1STEP' ? size * 0.10 : size * 0.08;
  return { dailyLossLimit, maxDrawdownLimit, profitTarget };
}

router.post('/', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const { challengeType, accountSize, refCode } = req.body;

    if (!challengeType || !accountSize) {
      return res.status(400).json({ error: 'challengeType dan accountSize wajib diisi.' });
    }

    const basePriceInCents = CHALLENGE_PRICES[challengeType]?.[accountSize];
    if (!basePriceInCents) {
      return res.status(400).json({ error: 'Kombinasi tipe dan ukuran akun tidak valid.' });
    }

    // Cek jumlah akun aktif (maks 6)
    const activeAccounts = await prisma.tradingAccount.count({
      where: { traderId, status: { in: ['ACTIVE', 'PASSED', 'FUNDED'] } },
    });
    if (activeAccounts >= 6) {
      return res.status(400).json({ error: 'Maksimal 6 akun aktif.' });
    }

    // Validasi refCode — cek affiliate dulu, lalu promo code
    let validRefCode = null;
    let discountAmount = 0;
    let finalPriceInCents = basePriceInCents;
    let codeType = null;

    if (refCode) {
      const codeUpper = refCode.trim().toUpperCase();
      const referrer = await prisma.trader.findUnique({
        where: { affiliateRefCode: codeUpper }, select: { id: true }
      });
      if (referrer) {
        if (referrer.id === traderId) return res.status(400).json({ error: 'Tidak bisa pakai refcode sendiri.' });
        const alreadyUsed = await prisma.affiliateConversion.findFirst({ where: { referredId: traderId } });
        if (alreadyUsed) return res.status(400).json({ error: 'Kamu sudah pernah menggunakan refcode sebelumnya.' });
        validRefCode = codeUpper; codeType = 'affiliate';
        discountAmount = Math.round(basePriceInCents * DISCOUNT_RATE);
        finalPriceInCents = basePriceInCents - discountAmount;
      } else {
        const now = new Date();
        const promo = await prisma.promoCode.findUnique({ where: { code: codeUpper } });
        if (!promo) return res.status(400).json({ error: 'Kode tidak valid.' });
        if (!promo.isActive) return res.status(400).json({ error: 'Kode promo sudah tidak aktif.' });
        if (promo.validUntil && promo.validUntil < now) return res.status(400).json({ error: 'Kode promo sudah expired.' });
        if (promo.validFrom > now) return res.status(400).json({ error: 'Kode promo belum berlaku.' });
        if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Kode promo sudah habis.' });
        validRefCode = codeUpper; codeType = 'promo';
        discountAmount = Math.round(basePriceInCents * (promo.discount / 100));
        finalPriceInCents = basePriceInCents - discountAmount;
        await prisma.promoCode.update({ where: { code: codeUpper }, data: { usedCount: { increment: 1 } } });
      }
    }

        const order = await prisma.order.create({
      data: {
        traderId,
        challengeType,
        accountSize,
        pricePaid:      finalPriceInCents / 100,
        currency:       'USD',
        paymentMethod:  'CARD',
        paymentProvider:'stripe',
        paymentStatus:  'PENDING',
        promoCode:      validRefCode,
        discountAmount: discountAmount / 100,
      },
    });

    const productName = `Koro Funding — ${challengeType.replace(/_/g, ' ')} $${accountSize.toLocaleString()}`;
    const productDesc = validRefCode
      ? `Diskon 25% dengan refcode ${validRefCode}`
      : `Akun trading challenge $${accountSize.toLocaleString()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: { card: { request_three_d_secure: "automatic" } },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName, description: productDesc },
          unit_amount: finalPriceInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/checkout/success?order_id=${order.id}`,
      cancel_url:  `${process.env.APP_URL}/checkout/cancel?order_id=${order.id}`,
      metadata: { orderId: order.id, traderId },
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId:       order.id,
        paymentUrl:    session.url,
        originalPrice: basePriceInCents / 100,
        finalPrice:    finalPriceInCents / 100,
        discount:      discountAmount / 100,
        refCode:       validRefCode,
      },
    });
  } catch (err) {
    next(err);
  }
});


// POST /api/v1/orders/create-payment-intent — untuk Stripe Elements (inline payment)
router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const traderId = req.trader.id;
    const { challengeType, accountSize, refCode } = req.body;

    if (!challengeType || !accountSize) {
      return res.status(400).json({ error: 'challengeType dan accountSize wajib diisi.' });
    }

    const basePriceInCents = CHALLENGE_PRICES[challengeType]?.[accountSize];
    if (!basePriceInCents) {
      return res.status(400).json({ error: 'Kombinasi tipe dan ukuran akun tidak valid.' });
    }

    // Validasi refCode — sama seperti endpoint utama
    let validRefCode = null;
    let discountAmount = 0;
    let finalPriceInCents = basePriceInCents;
    let codeType = null;

    if (refCode) {
      const codeUpper = refCode.trim().toUpperCase();
      const referrer = await prisma.trader.findUnique({
        where: { affiliateRefCode: codeUpper }, select: { id: true }
      });
      if (referrer) {
        if (referrer.id === traderId) return res.status(400).json({ error: 'Tidak bisa pakai refcode sendiri.' });
        const alreadyUsed = await prisma.affiliateConversion.findFirst({ where: { referredId: traderId } });
        if (alreadyUsed) return res.status(400).json({ error: 'Kamu sudah pernah menggunakan refcode.' });
        validRefCode = codeUpper; codeType = 'affiliate';
        discountAmount = Math.round(basePriceInCents * DISCOUNT_RATE);
        finalPriceInCents = basePriceInCents - discountAmount;
      } else {
        const now = new Date();
        const promo = await prisma.promoCode.findUnique({ where: { code: codeUpper } });
        if (!promo || !promo.isActive) return res.status(400).json({ error: 'Kode tidak valid atau tidak aktif.' });
        if (promo.validUntil && promo.validUntil < now) return res.status(400).json({ error: 'Kode promo expired.' });
        if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Kode promo habis.' });
        validRefCode = codeUpper; codeType = 'promo';
        discountAmount = Math.round(basePriceInCents * (promo.discount / 100));
        finalPriceInCents = basePriceInCents - discountAmount;
        await prisma.promoCode.update({ where: { code: codeUpper }, data: { usedCount: { increment: 1 } } });
      }
    }

    // Buat order dulu
    const order = await prisma.order.create({
      data: {
        traderId,
        challengeType,
        accountSize,
        pricePaid:      finalPriceInCents / 100,
        currency:       'USD',
        paymentMethod:  'CARD',
        paymentProvider:'stripe',
        paymentStatus:  'PENDING',
        promoCode:      validRefCode,
        discountAmount: discountAmount / 100,
      },
    });

    // Buat PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   finalPriceInCents,
      currency: 'usd',
      metadata: { orderId: order.id, traderId, codeType: codeType ?? '', refCode: validRefCode ?? '' },
    });

    return res.status(201).json({
      success:      true,
      clientSecret: paymentIntent.client_secret,
      orderId:      order.id,
      originalPrice: basePriceInCents / 100,
      finalPrice:    finalPriceInCents / 100,
      discount:      discountAmount / 100,
    });
  } catch (err) { next(err); }
});

export default router;
