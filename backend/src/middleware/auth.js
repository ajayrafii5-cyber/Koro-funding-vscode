import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token diperlukan.' });
  }
  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const trader  = await prisma.trader.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, kycStatus: true, role: true }
    });
    if (!trader) return res.status(401).json({ error: 'Trader tidak ditemukan.' });
    req.trader = trader;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.trader.role !== 'ADMIN') {
    return res.status(404).json({ error: 'Not found.' });
  }
  next();
};
