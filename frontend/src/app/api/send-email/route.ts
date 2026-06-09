import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  const { name, email, type, size, split, leverage, orderId } = await req.json();

  try {
    await transporter.sendMail({
      from: `"Koro Funding" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✅ Order Berhasil - Koro Funding ${size} Account`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:16px;">
          <h2 style="color:#00d4c8;margin-bottom:4px;">Koro Funding</h2>
          <p style="color:#888;font-size:13px;margin-top:0;">Order Konfirmasi</p>
          <hr style="border-color:#222;margin:24px 0"/>
          <h3 style="margin-bottom:4px;">Halo, ${name}! 👋</h3>
          <p style="color:#aaa;font-size:14px;">Akun trading kamu sudah aktif. Berikut detail ordermu:</p>
          <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:20px 0;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#888;padding:8px 0;">Order ID</td><td style="text-align:right;color:#fff;font-weight:bold;">${orderId}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Tipe Challenge</td><td style="text-align:right;color:#fff;">${type}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Ukuran Akun</td><td style="text-align:right;color:#00d4c8;font-weight:bold;">${size}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Profit Split</td><td style="text-align:right;color:#00d4c8;font-weight:bold;">${split}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Leverage</td><td style="text-align:right;color:#fff;">${leverage}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Total Bayar</td><td style="text-align:right;color:#fff;">$0 (Mode Percobaan)</td></tr>
            </table>
          </div>
          <p style="color:#aaa;font-size:13px;">Kredensial MT4/MT5 akan dikirim dalam 1x24 jam ke email ini.</p>
          <hr style="border-color:#222;margin:24px 0"/>
          <p style="color:#555;font-size:12px;text-align:center;">© 2026 Koro Funding. All rights reserved.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
