import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
const hash = await bcrypt.hash('Admin123!', 10);
const u = await p.trader.update({where:{email:'admin@korofunding.com'},data:{passwordHash:hash}});
console.log('Password updated:', u.email);
await p.$disconnect();
