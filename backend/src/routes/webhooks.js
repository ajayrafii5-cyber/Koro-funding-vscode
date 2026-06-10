import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../lib/email.js";

const prisma = new PrismaClient();
function getAccountLimits(challengeType, accountSize) {
  const size = Number(accountSize);
  const dailyLossLimit   = size * 0.05;
  const maxDrawdownLimit = size * 0.10;
  const profitTarget     = challengeType === "CHALLENGE_1STEP" ? size * 0.10 : size * 0.08;
  return { dailyLossLimit, maxDrawdownLimit, profitTarget };
}

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COMMISSION_RATE = 0.1;

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object;
    const orderId  = session.metadata?.orderId;
    const traderId = session.metadata?.traderId;

    if (!orderId || !traderId) return res.json({ received: true });

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentStatus === "PAID") return res.json({ received: true });

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", paidAt: new Date(), stripeSessionId: session.id }
      });

      console.log(`Checkout session order ${orderId} berhasil diproses`);
    } catch (err) {
      console.error("Error checkout.session webhook:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const intent   = event.data.object;
    const orderId  = intent.metadata?.orderId;
    const traderId = intent.metadata?.traderId;

    if (!orderId || !traderId) return res.json({ received: true });

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentStatus === "PAID") return res.json({ received: true });

      const limits           = getAccountLimits(order.challengeType, order.accountSize);
      const platformLogin    = `KF-${Math.floor(10000 + Math.random() * 90000)}`;
      const platformPassword = Math.random().toString(36).slice(2, 10);

      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paidAt: new Date() } });
        await tx.tradingAccount.create({
          data: {
            traderId, orderId, platformLogin, platformPassword,
            platformServer: "KoroFunding-Demo", platform: "MT5",
            type: order.challengeType, size: order.accountSize,
            phase: 1, status: "ACTIVE",
            balance: order.accountSize, equity: order.accountSize,
            dailyLossLimit: limits.dailyLossLimit,
            maxDrawdownLimit: limits.maxDrawdownLimit,
            profitTarget: limits.profitTarget,
            payoutSplit: 80,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        if (order.promoCode) {
          const referrer = await prisma.trader.findUnique({
            where: { affiliateRefCode: order.promoCode }, select: { id: true }
          });
          if (referrer && referrer.id !== traderId) {
            const grossPrice = Number(order.pricePaid) + Number(order.discountAmount);
            const commission = grossPrice * COMMISSION_RATE;
            await tx.affiliateConversion.create({
              data: { referrerId: referrer.id, referredId: traderId, orderId, commissionRate: COMMISSION_RATE, commissionAmount: commission, status: "PENDING" }
            });
            await tx.affiliateStats.upsert({
              where:  { traderId: referrer.id },
              create: { traderId: referrer.id, totalConversions: 1, totalEarned: commission, pendingBalance: commission },
              update: { totalConversions: { increment: 1 }, totalEarned: { increment: commission } }
            });
          }
        }
      });

      const trader = await prisma.trader.findUnique({ where: { id: traderId } });
      if (trader) {
        await sendEmail({
          to: trader.email, template: "credentials",
          data: {
            firstName:      trader.fullName?.split(" ")[0] || trader.email,
            challengeType:  order.challengeType.replace(/_/g, " "),
            accountSize:    `$${order.accountSize.toLocaleString()}`,
            accountId:      platformLogin,
            password:       platformPassword,
            server:         "KoroFunding-Demo",
            platform:       "MT5",
            phase1Target:   `$${limits.profitTarget.toLocaleString()}`,
            dailyLossLimit: `$${limits.dailyLossLimit.toLocaleString()}`,
            maxDrawdown:    `$${limits.maxDrawdownLimit.toLocaleString()}`,
            downloadUrl:    "https://www.metatrader5.com/en/download",
            dashboardUrl:   `${process.env.APP_URL}/dashboard`,
          }
        }).catch(console.error);
      }
      console.log(`PaymentIntent order ${orderId} berhasil diproses`);
    } catch (err) {
      console.error("Error payment_intent webhook:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  }

  res.json({ received: true });
});

export default router;
