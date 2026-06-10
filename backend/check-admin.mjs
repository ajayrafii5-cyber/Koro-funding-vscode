import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const admins = await p.trader.findMany({where:{role:'ADMIN'},select:{email:true,role:true}});
console.log('Admins:', admins);
await p.$disconnect();
