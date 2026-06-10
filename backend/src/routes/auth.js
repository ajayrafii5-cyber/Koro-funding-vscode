import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../lib/validators.js';
import { logger } from '../lib/logger.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, country, referralCode } = req.body;
    const existing = await prisma.trader.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar.' });
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    let referredBy = null;
    if (referralCode) {
      const referrer = await prisma.trader.findUnique({ where: { affiliateRefCode: referralCode } });
      if (referrer) referredBy = referrer.id;
    }
    const firstName = fullName.trim().split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    const randNum = Math.floor(10 + Math.random() * 90);
    let affiliateRefCode = `${firstName}${randNum}`;
    const existing2 = await prisma.trader.findUnique({ where: { affiliateRefCode } });
    if (existing2) affiliateRefCode = `${firstName}${Math.floor(10 + Math.random() * 90)}`;
    const trader = await prisma.trader.create({
      data: { email, passwordHash, fullName, country, referredBy, affiliateRefCode },
      select: { id: true, email: true, fullName: true, createdAt: true }
    });
    logger.info('New trader registered: ' + email);
    transporter.sendMail({
      from: `"Koro Funding" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🎉 Selamat Datang di Koro Funding!",
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:16px;"><h2 style="color:#00d4c8;">Koro Funding</h2><h3>Halo, ${fullName}!</h3><p style="color:#aaa;">Selamat datang di Koro Funding! Akun kamu sudah aktif. Mulai pilih challenge dan buktikan kemampuan trading kamu.</p><div style="text-align:center;margin:32px 0;"><a href="${process.env.APP_URL}/challenge" style="background:#00d4c8;color:#000;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;">Pilih Challenge Sekarang</a></div><p style="color:#555;font-size:12px;">Trade. Prove. Get Funded.</p></div>`,
    }).catch(e => logger.error("Welcome email failed: " + e.message));
    const { accessToken, refreshToken } = generateTokens(trader.id);
    return res.status(201).json({ message: 'Registrasi berhasil!', trader, accessToken, refreshToken });
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const trader = await prisma.trader.findUnique({ where: { email } });
    if (!trader) return res.status(401).json({ error: 'Email atau password salah.' });
    const valid = await bcrypt.compare(password, trader.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah.' });
    await prisma.trader.update({ where: { id: trader.id }, data: { lastLoginAt: new Date() } });
    const { accessToken, refreshToken } = generateTokens(trader.id);
    logger.info('Login: ' + email);
    return res.json({
      trader: { id: trader.id, email: trader.email, fullName: trader.fullName, kycStatus: trader.kycStatus, role: trader.role },
      accessToken, refreshToken,
    });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token diperlukan.' });
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.sub);
    return res.json({ accessToken, refreshToken: newRefresh });
  } catch { return res.status(401).json({ error: 'Refresh token tidak valid atau kadaluarsa.' }); }
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const trader = await prisma.trader.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, country: true, kycStatus: true,
                affiliateRefCode: true, createdAt: true, lastLoginAt: true }
    });
    if (!trader) return res.status(404).json({ error: 'Trader not found' });
    return res.json({ trader });
  } catch { return res.status(401).json({ error: 'Token tidak valid.' }); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib diisi.' });
    const trader = await prisma.trader.findUnique({ where: { email } });
    if (!trader) return res.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
    await prisma.passwordResetToken.deleteMany({ where: { traderId: trader.id } });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { traderId: trader.id, token, expiresAt } });
    const resetUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/auth/reset-password?token=' + token;
    transporter.sendMail({
      from: '"Koro Funding" <' + process.env.GMAIL_USER + '>',
      to: email,
      subject: 'Reset Password - Koro Funding',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:16px;"><h2 style="color:#00d4c8;">Koro Funding</h2><h3>Halo, ' + trader.fullName + '!</h3><p style="color:#aaa;">Klik tombol di bawah untuk reset password kamu. Link berlaku 1 jam.</p><div style="text-align:center;margin:32px 0;"><a href="' + resetUrl + '" style="background:#00d4c8;color:#000;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;">Reset Password</a></div><p style="color:#555;font-size:12px;">Jika tidak merasa meminta reset, abaikan email ini.</p></div>',
    });
    logger.info('Password reset email sent: ' + email);
    return res.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token dan password wajib diisi.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken) return res.status(400).json({ error: 'Token tidak valid.' });
    if (resetToken.used) return res.status(400).json({ error: 'Token sudah digunakan.' });
    if (new Date() > resetToken.expiresAt) return res.status(400).json({ error: 'Token sudah kadaluarsa.' });
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    await prisma.$transaction([
      prisma.trader.update({ where: { id: resetToken.traderId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    ]);
    logger.info('Password reset success: traderId=' + resetToken.traderId);
    return res.json({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (err) { next(err); }
});

function generateTokens(traderId) {
  const accessToken = jwt.sign(
    { sub: traderId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  const refreshToken = jwt.sign(
    { sub: traderId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
}

export default router;

// PATCH /api/v1/auth/profile
router.patch('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const { fullName, phone, country } = req.body;
    if (!fullName) return res.status(400).json({ error: 'Nama wajib diisi.' });
    const trader = await prisma.trader.update({
      where: { id: req.trader.id },
      data: { fullName, phone, country },
    });
    return res.json({ message: 'Profil berhasil diupdate.', trader });
  } catch (err) { next(err); }
});

// PATCH /api/v1/auth/change-password
router.patch('/change-password', authenticateJWT, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Semua field wajib diisi.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    const trader = await prisma.trader.findUnique({ where: { id: req.trader.id } });
    const valid = await bcrypt.compare(currentPassword, trader.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Password saat ini salah.' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.trader.update({ where: { id: req.trader.id }, data: { passwordHash } });
    return res.json({ message: 'Password berhasil diubah.' });
  } catch (err) { next(err); }
});
