/**
 * Koro Funding — Database Seed
 * Creates demo trader + admin + sample accounts
 * Run: node src/lib/seed.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin ────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  await prisma.trader.upsert({
    where: { email: 'admin@korofunding.com' },
    update: {},
    create: {
      email:        'admin@korofunding.com',
      passwordHash: adminHash,
      fullName:     'Admin Koro',
      country:      'ID',
      kycStatus:    'VERIFIED',
    }
  });
  console.log('✅ Admin created: admin@korofunding.com / Admin1234!');

  // ─── Demo Trader ──────────────────────────────────────
  const traderHash = await bcrypt.hash('Demo1234!', 12);
  const trader = await prisma.trader.upsert({
    where: { email: 'trader@demo.com' },
    update: {},
    create: {
      email:        'trader@demo.com',
      passwordHash: traderHash,
      fullName:     'Andi Rizky Demo',
      country:      'ID',
      kycStatus:    'VERIFIED',
    }
  });
  console.log('✅ Demo trader created: trader@demo.com / Demo1234!');

  // ─── Demo Trading Account ─────────────────────────────
  await prisma.tradingAccount.upsert({
    where: { platformLogin: '8284710' },
    update: {},
    create: {
      traderId:         trader.id,
      platformLogin:    '8284710',
      platformPassword: 'DemoPass123!',
      platformServer:   'KoroFunding-Demo',
      platform:         'MT5',
      type:             'CHALLENGE_2STEP',
      size:             25000,
      phase:            2,
      status:           'ACTIVE',
      balance:          25840,
      equity:           25610,
      dailyLossUsed:    210,
      dailyLossLimit:   1250,
      maxDrawdownUsed:  540,
      maxDrawdownLimit: 2500,
      profitToDate:     840,
      profitTarget:     1250,
      tradingDays:      7,
      payoutSplit:      85,
      expiresAt:        new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
    }
  });
  console.log('✅ Demo trading account created');

  // ─── Demo Metrics Snapshots ───────────────────────────
  const account = await prisma.tradingAccount.findUnique({ where: { platformLogin: '8284710' } });
  const equitySeries = [25000, 25180, 25090, 25320, 25260, 25480, 25610];
  for (let i = 0; i < equitySeries.length; i++) {
    await prisma.metricsSnapshot.create({
      data: {
        accountId: account.id,
        balance:   equitySeries[i],
        equity:    equitySeries[i],
        dailyPnl:  i > 0 ? equitySeries[i] - equitySeries[i-1] : 0,
        openLots:  0.10,
        snapshotAt: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      }
    });
  }
  console.log('✅ Demo metrics snapshots created');

  // ─── Demo Trades ──────────────────────────────────────
  const trades = [
    { ticket:'88421', symbol:'XAUUSD', type:'BUY',  lots:0.10, openPrice:2318.40, closePrice:2325.80, profit:74 },
    { ticket:'88398', symbol:'EURUSD', type:'SELL', lots:0.20, openPrice:1.0872,  closePrice:1.0845,  profit:54 },
    { ticket:'88341', symbol:'GBPJPY', type:'BUY',  lots:0.05, openPrice:196.12,  closePrice:195.88,  profit:-12 },
    { ticket:'88290', symbol:'BTCUSD', type:'SELL', lots:0.01, openPrice:61200,   closePrice:60850,   profit:35 },
    { ticket:'88250', symbol:'XAUUSD', type:'BUY',  lots:0.15, openPrice:2310.20, closePrice:2318.40, profit:123 },
  ];
  for (const t of trades) {
    await prisma.trade.upsert({
      where: { accountId_platformTicket: { accountId: account.id, platformTicket: `#${t.ticket}` } },
      update: {},
      create: {
        accountId:      account.id,
        platformTicket: `#${t.ticket}`,
        symbol: t.symbol, type: t.type, lots: t.lots,
        openPrice: t.openPrice, closePrice: t.closePrice,
        openTime: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000),
        closeTime: new Date(),
        profit: t.profit, swap: 0, commission: -2,
        isOpen: false,
      }
    });
  }
  console.log('✅ Demo trades created');

  console.log('\n🎉 Seed selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:  admin@korofunding.com / Admin1234!');
  console.log('Trader: trader@demo.com / Demo1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
