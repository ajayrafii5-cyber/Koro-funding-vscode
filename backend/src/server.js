/**
 * Koro Funding — Backend API Server
 * Port: 4000 (development)
 *
 * Stack: Express + Prisma + Socket.io
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Routes
import authRoutes       from './routes/auth.js';
import dashboardRoutes  from './routes/dashboard.js';
import accountRoutes    from './routes/accounts.js';
import payoutRoutes     from './routes/payouts.js';
import challengeRoutes  from './routes/challenges.js';
import kycRoutes        from './routes/kyc.js';
import affiliateRoutes  from './routes/affiliate.js';
import webhookRoutes    from './routes/webhooks.js';
import adminRoutes      from './routes/admin.js';
import { PrismaClient } from '@prisma/client';
const prismaPublic = new PrismaClient();
import orderRoutes from './routes/orders.js';
import ctraderRoutes from './routes/ctrader.js';

import { logger }           from './lib/logger.js';
import { errorHandler }     from './middleware/error.js';
import { authenticateJWT }  from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

// ─── SOCKET.IO for real-time dashboard ───────────────────
export const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'] }
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('subscribe_account', (accountId) => socket.join(`account:${accountId}`));
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

// ─── MIDDLEWARE ───────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Raw body for Stripe webhook signature validation
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
}));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── LOGIN RATE LIMIT ─────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── PUBLIC ROUTES ───────────────────────────────────────────
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth',       authRoutes);
app.use("/api/v1/challenges", challengeRoutes);
app.get("/api/v1/affiliate/validate/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const trader = await prismaPublic.trader.findUnique({ where: { affiliateRefCode: code }, select: { id: true } });
    if (trader) return res.json({ valid: true, type: "affiliate", discount: 0.25 });
    const now = new Date();
    const promo = await prismaPublic.promoCode.findUnique({ where: { code } });
    if (promo && promo.isActive && (!promo.validUntil || promo.validUntil > now) && promo.validFrom <= now && (promo.maxUses === null || promo.usedCount < promo.maxUses)) {
      return res.json({ valid: true, type: "promo", discount: promo.discount / 100, description: promo.description });
    }
    res.status(404).json({ valid: false, error: "Kode tidak valid" });
  } catch(e) { res.status(500).json({ valid: false }); }
});
app.use("/api/v1/affiliate/validate", affiliateRoutes);
app.use('/api/webhooks',      webhookRoutes);      // payment & KYC webhooks

// ─── PROTECTED ROUTES ─────────────────────────────────────
app.use('/api/v1/dashboard',  authenticateJWT, dashboardRoutes);
app.use('/api/v1/accounts',   authenticateJWT, accountRoutes);
app.use('/api/v1/payouts',    authenticateJWT, payoutRoutes);
app.use('/api/v1/kyc',        authenticateJWT, kycRoutes);
app.use("/api/v1/affiliate",  authenticateJWT, affiliateRoutes);
app.use('/api/v1/orders',     authenticateJWT, orderRoutes);

// ─── ADMIN ROUTES ─────────────────────────────────────────
app.use('/api/v1/ctrader', ctraderRoutes);
app.use('/api/v1/admin',      authenticateJWT, adminRoutes);

// ─── ERROR HANDLER ────────────────────────────────────────
app.use(errorHandler);

// ─── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Koro Funding API running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔌 Socket.io enabled`);
  logger.info(`🌍 CORS: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
});

export default app;
