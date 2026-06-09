import 'dotenv/config';
/**
 * Koro Funding — Risk Management Engine
 * Background service: polls trading platform every 5–30s
 * Detects breaches, disables accounts, triggers automations
 *
 * Usage: node risk-engine.js
 * Deploy: PM2 or Docker container alongside main API
 */

import axios from 'axios';
import pkg from '@prisma/client';
const { PrismaClient, AccountStatus, BreachType } = pkg;
import { sendEmail } from './lib/email.js';
import { disablePlatformAccount } from './lib/platform-api.js';
import { notifyAdmin } from './lib/slack.js';
import { logger } from './lib/logger.js';

const prisma = new PrismaClient();

// ─── CONFIG ───────────────────────────────────────────────
const BREACH_POLL_INTERVAL_MS  = 5  * 60 * 1000; // 5 minutes
const METRICS_POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes (snapshot)
const PHASE_CHECK_INTERVAL_MS  = 15 * 60 * 1000; // 15 minutes

// ─── MAIN LOOPS ───────────────────────────────────────────
async function startRiskEngine() {
  logger.info('🚀 Koro Funding Risk Engine starting...');

  // Run immediately, then on interval
  await runBreachCheck();
  await runPhaseCheck();

  setInterval(runBreachCheck,   BREACH_POLL_INTERVAL_MS);
  setInterval(runMetricsSnapshot, METRICS_POLL_INTERVAL_MS);
  setInterval(runPhaseCheck,    PHASE_CHECK_INTERVAL_MS);
  setInterval(runExpiryCheck,   24 * 60 * 60 * 1000); // daily

  logger.info('✅ Risk Engine running. Intervals: breach=5m, snapshot=30m, phase=15m, expiry=24h');
}

// ─── BREACH DETECTION ─────────────────────────────────────
async function runBreachCheck() {
  logger.info('🔍 Running breach check...');

  const activeAccounts = await prisma.tradingAccount.findMany({
    where: { status: AccountStatus.ACTIVE },
    select: {
      id: true, traderId: true, platformLogin: true,
      platform: true, type: true, size: true,
      dailyLossLimit: true, maxDrawdownLimit: true, profitTarget: true,
      phase: true, payoutSplit: true,
      trader: { select: { email: true, fullName: true } }
    }
  });

  logger.info(`Checking ${activeAccounts.length} active accounts...`);

  for (const account of activeAccounts) {
    try {
      await checkAccountBreach(account);
    } catch (err) {
      logger.error(`Error checking account ${account.id}: ${err.message}`);
    }
  }
}

async function checkAccountBreach(account) {
  // Fetch live metrics from trading platform
  const metrics = await fetchLiveMetrics(account.platformLogin, account.platform);
  if (!metrics) return;

  const { balance, equity, dailyLoss, maxDrawdown } = metrics;

  // Update account metrics in DB
  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: {
      balance,
      equity,
      dailyLossUsed: Math.abs(dailyLoss),
      maxDrawdownUsed: Math.abs(maxDrawdown),
    }
  });

  // ── CHECK 1: Daily Loss Limit ──
  const dailyLossAbs = Math.abs(dailyLoss);
  if (dailyLossAbs >= Number(account.dailyLossLimit)) {
    await triggerBreach(account, BreachType.DAILY_LOSS, dailyLossAbs, account.dailyLossLimit);
    return; // Don't check further if already breached
  }

  // ── CHECK 2: Max Drawdown Limit ──
  const maxDrawdownAbs = Math.abs(maxDrawdown);
  if (maxDrawdownAbs >= Number(account.maxDrawdownLimit)) {
    await triggerBreach(account, BreachType.MAX_DRAWDOWN, maxDrawdownAbs, account.maxDrawdownLimit);
    return;
  }

  // ── WARN if approaching limits (80%) ──
  const dailyLossRatio = dailyLossAbs / Number(account.dailyLossLimit);
  const maxDDRatio     = maxDrawdownAbs / Number(account.maxDrawdownLimit);

  if (dailyLossRatio >= 0.8) {
    logger.warn(`⚠️ Account ${account.id} at ${Math.round(dailyLossRatio * 100)}% daily loss limit`);
    // TODO: send approaching-limit notification (debounced, once per day)
  }
}

async function triggerBreach(account, type, valueAtBreach, limitValue) {
  logger.warn(`🚨 BREACH: account ${account.id} — ${type} (${valueAtBreach} >= ${limitValue})`);

  // 1. Disable on trading platform
  await disablePlatformAccount(account.platformLogin, account.platform);

  // 2. Update DB status
  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { status: AccountStatus.BREACHED }
  });

  // 3. Log breach event
  await prisma.breachEvent.create({
    data: {
      accountId:    account.id,
      type,
      valueAtBreach,
      limitValue,
    }
  });

  // 4. Send email to trader
  const emailType = type === BreachType.DAILY_LOSS ? 'breach_daily' : 'breach_max';
  await sendEmail({
    to:       account.trader.email,
    template: emailType,
    data: {
      firstName:   account.trader.fullName.split(' ')[0],
      accountId:   account.platformLogin,
      accountSize: formatUSD(account.size),
      breachType:  type === BreachType.DAILY_LOSS ? 'Daily Loss Limit' : 'Max Drawdown',
      valueHit:    formatUSD(valueAtBreach),
      limitValue:  formatUSD(limitValue),
      retryLink:   `${process.env.APP_URL}/challenge?retry=${account.id}`,
      discountCode: 'RETRY20',
    }
  });

  // 5. Notify admin on Slack
  await notifyAdmin({
    text: `🚨 BREACH: ${account.trader.email} | Account ${account.platformLogin} | ${type} | Hit: $${valueAtBreach}`,
    color: 'danger'
  });

  logger.info(`✅ Breach handled for account ${account.id}`);
}

// ─── PHASE PROGRESSION CHECK ──────────────────────────────
async function runPhaseCheck() {
  logger.info('📊 Running phase check...');

  // Check Phase 1 accounts that may have passed
  const phase1Accounts = await prisma.tradingAccount.findMany({
    where: {
      status: AccountStatus.ACTIVE,
      phase: 1,
      type: 'CHALLENGE_2STEP'
    },
    include: { trader: { select: { email: true, fullName: true } } }
  });

  for (const account of phase1Accounts) {
    const metrics = await fetchLiveMetrics(account.platformLogin, account.platform);
    if (!metrics) continue;

    const profitPct = (metrics.profit / account.size) * 100;
    const meetsTarget = profitPct >= (Number(account.profitTarget) / account.size * 100);
    const meetsTradingDays = metrics.tradingDays >= 5;

    if (meetsTarget && meetsTradingDays) {
      await advanceToPhase2(account, metrics);
    }
  }

  // Check Phase 2 or 1-Step accounts ready for funding
  const finalPhaseAccounts = await prisma.tradingAccount.findMany({
    where: {
      status: AccountStatus.ACTIVE,
      OR: [
        { phase: 2, type: 'CHALLENGE_2STEP' },
        { phase: 1, type: 'CHALLENGE_1STEP' },
        { phase: 1, type: 'INSTANT_FUNDING' }
      ]
    },
    include: { trader: { select: { email: true, fullName: true } } }
  });

  for (const account of finalPhaseAccounts) {
    const metrics = await fetchLiveMetrics(account.platformLogin, account.platform);
    if (!metrics) continue;

    const profitPct = (metrics.profit / account.size) * 100;
    const meetsTarget = profitPct >= (Number(account.profitTarget) / account.size * 100);
    const meetsTradingDays = account.type === 'INSTANT_FUNDING' || metrics.tradingDays >= 5;

    if (meetsTarget && meetsTradingDays) {
      await markAsPassed(account, metrics);
    }
  }
}

async function advanceToPhase2(account, metrics) {
  logger.info(`🎯 Account ${account.id} passed Phase 1 → advancing to Phase 2`);

  // Create Phase 2 credentials on platform
  const phase2Account = await createPlatformAccount({
    size: account.size,
    type: account.type,
    phase: 2
  });

  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: {
      status: AccountStatus.PASSED,
      passedPhaseAt: new Date()
    }
  });

  // Create new Phase 2 account
  await prisma.tradingAccount.create({
    data: {
      traderId:         account.traderId,
      platformLogin:    phase2Account.login,
      platformPassword: phase2Account.password,
      platformServer:   phase2Account.server,
      platform:         account.platform,
      type:             account.type,
      size:             account.size,
      phase:            2,
      status:           AccountStatus.ACTIVE,
      dailyLossLimit:   account.dailyLossLimit,
      maxDrawdownLimit: account.maxDrawdownLimit,
      profitTarget:     account.size * 0.05, // Phase 2: 5% target
      payoutSplit:      account.payoutSplit,
      expiresAt:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  await sendEmail({
    to:       account.trader.email,
    template: 'phase_passed',
    data: {
      firstName:    account.trader.fullName.split(' ')[0],
      phase:        1,
      nextPhase:    2,
      newTarget:    '5%',
      accountSize:  formatUSD(account.size),
      login:        phase2Account.login,
      password:     phase2Account.password,
      server:       phase2Account.server,
      dashboardUrl: `${process.env.APP_URL}/dashboard`
    }
  });
}

async function markAsPassed(account, metrics) {
  logger.info(`🏆 Account ${account.id} passed all phases → pending KYC`);

  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: {
      status: AccountStatus.PASSED,
      passedPhaseAt: new Date()
    }
  });

  // Generate and send certificate
  const certUrl = await generateCertificate(account);

  await sendEmail({
    to:       account.trader.email,
    template: 'challenge_passed',
    data: {
      firstName:    account.trader.fullName.split(' ')[0],
      accountSize:  formatUSD(account.size),
      challengeType: formatChallengeType(account.type),
      profit:       formatUSD(metrics.profit),
      certUrl,
      kycLink:      `${process.env.APP_URL}/dashboard/kyc`,
      dashboardUrl: `${process.env.APP_URL}/dashboard`
    }
  });
}

// ─── METRICS SNAPSHOT ─────────────────────────────────────
async function runMetricsSnapshot() {
  const activeAccounts = await prisma.tradingAccount.findMany({
    where: { status: AccountStatus.ACTIVE },
    select: { id: true, platformLogin: true, platform: true }
  });

  for (const account of activeAccounts) {
    const metrics = await fetchLiveMetrics(account.platformLogin, account.platform);
    if (!metrics) continue;

    await prisma.metricsSnapshot.create({
      data: {
        accountId: account.id,
        balance:   metrics.balance,
        equity:    metrics.equity,
        dailyPnl:  metrics.dailyPnl || 0,
        openLots:  metrics.openLots || 0,
      }
    });
  }
}

// ─── EXPIRY CHECK ─────────────────────────────────────────
async function runExpiryCheck() {
  const now = new Date();

  // Warn: 3 days before expiry
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringSoon = await prisma.tradingAccount.findMany({
    where: {
      status: AccountStatus.ACTIVE,
      expiresAt: { lte: threeDaysFromNow, gt: now }
    },
    include: { trader: { select: { email: true, fullName: true } } }
  });

  for (const account of expiringSoon) {
    const daysLeft = Math.ceil((account.expiresAt - now) / (1000 * 60 * 60 * 24));
    await sendEmail({
      to:       account.trader.email,
      template: 'expiry_warning',
      data: {
        firstName: account.trader.fullName.split(' ')[0],
        daysLeft,
        expiresAt: account.expiresAt.toLocaleDateString(),
        dashboardUrl: `${process.env.APP_URL}/dashboard`
      }
    });
  }

  // Expire: mark expired accounts
  const expired = await prisma.tradingAccount.updateMany({
    where: {
      status: AccountStatus.ACTIVE,
      expiresAt: { lt: now }
    },
    data: { status: AccountStatus.EXPIRED }
  });

  if (expired.count > 0) {
    logger.info(`⏰ Expired ${expired.count} accounts`);
  }
}

// ─── PLATFORM API HELPERS ──────────────────────────────────
async function fetchLiveMetrics(platformLogin, platform) {
  try {
    // Replace with actual platform API (MT5 Manager API, MatchTrader API, etc.)
    const baseUrl = process.env.PLATFORM_API_URL;
    const apiKey  = process.env.PLATFORM_API_KEY;

    const response = await axios.get(`${baseUrl}/accounts/${platformLogin}/summary`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000
    });

    return {
      balance:     response.data.balance     ?? 0,
      equity:      response.data.equity      ?? 0,
      dailyLoss:   response.data.daily_loss  ?? 0,
      maxDrawdown: response.data.max_dd      ?? 0,
      profit:      response.data.profit      ?? 0,
      tradingDays: response.data.trading_days ?? 0,
      openLots:    response.data.open_lots   ?? 0,
      dailyPnl:    response.data.daily_pnl   ?? 0,
    };
  } catch (err) {
    logger.error(`Failed to fetch metrics for ${platformLogin}: ${err.message}`);
    return null;
  }
}

async function createPlatformAccount({ size, type, phase }) {
  const baseUrl = process.env.PLATFORM_API_URL;
  const apiKey  = process.env.PLATFORM_API_KEY;

  const response = await axios.post(`${baseUrl}/accounts`, {
    group:    `koro_${type.toLowerCase()}_phase${phase}`,
    balance:  size,
    leverage: getLeverage(type),
  }, {
    headers: { 'X-API-Key': apiKey }
  });

  return {
    login:    response.data.login,
    password: response.data.password,
    server:   process.env.PLATFORM_SERVER
  };
}

// ─── CERTIFICATE GENERATION ───────────────────────────────
async function generateCertificate(account) {
  // Uses Puppeteer to render HTML → PDF
  // See certificate-generator.js for full implementation
  try {
    const response = await axios.post(`${process.env.API_URL}/internal/certificates/generate`, {
      accountId: account.id
    }, {
      headers: { 'X-Internal-Key': process.env.INTERNAL_API_KEY }
    });
    return response.data.certUrl;
  } catch (err) {
    logger.error(`Certificate generation failed: ${err.message}`);
    return `${process.env.APP_URL}/dashboard/certificate/${account.id}`;
  }
}

// ─── UTILS ────────────────────────────────────────────────
function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getLeverage(type) {
  const leverageMap = {
    CHALLENGE_2STEP: 100,
    CHALLENGE_1STEP: 50,
    INSTANT_FUNDING: 30,
    FUNDED: 100
  };
  return leverageMap[type] || 100;
}

function formatChallengeType(type) {
  const map = {
    CHALLENGE_2STEP: '2-Step Challenge',
    CHALLENGE_1STEP: '1-Step Challenge',
    INSTANT_FUNDING: 'Instant Funding'
  };
  return map[type] || type;
}

// ─── START ────────────────────────────────────────────────
startRiskEngine().catch(err => {
  logger.error('Risk engine failed to start:', err);
  process.exit(1);
});
