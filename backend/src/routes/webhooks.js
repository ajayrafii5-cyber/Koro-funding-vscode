import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { sendEmail } from "../lib/email.js";

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getAccountLimits(type, size) {
  const dailyLossLimit   = size * 0.05;
  const maxDrawdownLimit = size * 0.10;
  const profitTarget     = type === "CHALLENGE_1STEP" ? size * 0.10 : size * 0.08;
  return { dailyLossLimit, maxDrawdownLimit, profitTarget };
}

router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature invalid:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object;
    const orderId  = session.metadata.orderId;
    const traderId = session.metadata.traderId;

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentStatus === "PAID") return res.json({ received: true });

      const limits = getAccountLimits(order.challengeType, order.accountSize);
      const platformLogin    = `KF-${Math.floor(10000 + Math.random() * 90000)}`;
      const platformPassword = Math.random().toString(36).slice(2, 10);

      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paidAt: new Date() } });
        await tx.tradingAccount.create({ data: { traderId, orderId, platformLogin, platformPassword, platformServer: "KoroFunding-Demo", platform: "MT5", type: order.challengeType, size: order.accountSize, phase: 1, status: "ACTIVE", balance: order.accountSize, equity: order.accountSize, dailyLossLimit: limits.dailyLossLimit, maxDrawdownLimit: limits.maxDrawdownLimit, profitTarget: limits.profitTarget, payoutSplit: 80, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      });

      const trader = await prisma.trader.findUnique({ where: { id: traderId } });
      if (trader) {
        await sendEmail({
          to: trader.email,
          template: "credentials",
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
          },
        }).catch(console.error);
      }
      console.log(`Order ${orderId} berhasil diproses`);
    } catch (err) {
      console.error("Error proses webhook:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  }
  res.json({ received: true });
});

export default router;
