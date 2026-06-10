import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Hapus semua data relasi dulu, baru trader
await p.webhookEvent.deleteMany();
await p.metricsSnapshot.deleteMany();
await p.breachEvent.deleteMany();
await p.trade.deleteMany();
await p.payout.deleteMany();
await p.kycDocument.deleteMany();
await p.affiliateStats.deleteMany();
await p.affiliateConversion.deleteMany();
await p.passwordResetToken.deleteMany();
await p.tradingAccount.deleteMany();
await p.order.deleteMany();
await p.trader.deleteMany({where:{role:'TRADER'}});

console.log('Semua trader berhasil dihapus ✅');
await p.$disconnect();
