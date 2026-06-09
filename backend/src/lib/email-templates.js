/**
 * Koro Funding — Email Template System
 * Engine: SendGrid Dynamic Templates
 * Usage: sendEmail({ to, template, data })
 *
 * Templates defined here as HTML strings.
 * In production: upload to SendGrid as Dynamic Templates
 * and use template IDs instead.
 */

// Base wrapper for all emails
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Koro Funding</title>
<style>
  body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#F4F7FB; }
  .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
  .card { background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
  .header { background:#07090F; padding:32px 40px; text-align:center; }
  .header-logo { color:#FFFFFF; font-size:24px; font-weight:800; letter-spacing:-0.5px; }
  .header-dot { display:inline-block; width:8px; height:8px; background:#00D4C8; border-radius:50%; margin-right:8px; }
  .body { padding:40px; }
  .footer { background:#F9FAFB; padding:24px 40px; text-align:center; border-top:1px solid #F0F0F0; }
  .footer p { font-size:12px; color:#9CA3AF; margin:4px 0; line-height:1.6; }
  h1 { font-size:24px; color:#07090F; margin:0 0 8px; font-weight:800; }
  h2 { font-size:18px; color:#07090F; margin:24px 0 12px; font-weight:700; }
  p { font-size:15px; color:#374151; line-height:1.7; margin:0 0 16px; }
  .highlight { color:#00D4C8; font-weight:700; }
  .gold { color:#F0A500; font-weight:700; }
  .creds-box { background:#F0FFFE; border:1px solid #B0EDE9; border-radius:12px; padding:24px; margin:24px 0; }
  .creds-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E0F7F5; }
  .creds-row:last-child { border-bottom:none; }
  .creds-label { font-size:13px; color:#6B7A99; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
  .creds-val { font-size:14px; color:#07090F; font-weight:700; font-family:monospace; }
  .btn { display:inline-block; background:#00D4C8; color:#07090F !important; text-decoration:none;
         padding:14px 32px; border-radius:8px; font-weight:700; font-size:15px; margin:16px 0; }
  .btn-outline { background:transparent; border:2px solid #00D4C8; color:#00D4C8 !important; }
  .alert-box { background:#FFF5F5; border:1px solid #FFC5C5; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .alert-box .icon { font-size:32px; margin-bottom:8px; }
  .success-box { background:#F0FFF9; border:1px solid #A7F3D0; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .metric-row { display:flex; gap:12px; margin:20px 0; flex-wrap:wrap; }
  .metric-chip { flex:1; min-width:120px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:14px; text-align:center; }
  .metric-chip .val { font-size:20px; font-weight:800; color:#07090F; }
  .metric-chip .lbl { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.08em; margin-top:4px; }
  .step-item { display:flex; align-items:flex-start; gap:16px; margin-bottom:16px; }
  .step-num { width:32px; height:32px; background:#07090F; color:#00D4C8; border-radius:50%;
              display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0; }
  .step-text { font-size:14px; color:#374151; line-height:1.6; }
  .divider { height:1px; background:#F0F0F0; margin:24px 0; }
  .social-links { margin-top:12px; }
  .social-links a { display:inline-block; margin:0 6px; font-size:12px; color:#9CA3AF; text-decoration:none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo"><span class="header-dot"></span>Koro Funding</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Koro Funding | Trade. Prove. Get Funded.</p>
      <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      <p>© 2026 Koro Funding. All rights reserved.</p>
      <div class="social-links">
        <a href="#">Instagram</a> · <a href="#">Telegram</a> · <a href="#">Twitter/X</a>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────
// T1: CHALLENGE CREDENTIALS
// ─────────────────────────────────────────────────────────
export const credentialsEmail = (d) => baseTemplate(`
  <h1>🎯 Akun Challenge Anda Siap, ${d.firstName}!</h1>
  <p>Pembayaran Anda telah dikonfirmasi. Berikut adalah detail akun trading <strong>${d.challengeType}</strong> senilai <span class="highlight">${d.accountSize}</span>.</p>

  <div class="creds-box">
    <h2 style="margin-top:0;">Kredensial Trading</h2>
    <div class="creds-row"><span class="creds-label">Login</span><span class="creds-val">${d.accountId}</span></div>
    <div class="creds-row"><span class="creds-label">Password</span><span class="creds-val">${d.password}</span></div>
    <div class="creds-row"><span class="creds-label">Server</span><span class="creds-val">${d.server}</span></div>
    <div class="creds-row"><span class="creds-label">Platform</span><span class="creds-val">${d.platform}</span></div>
  </div>

  <div class="metric-row">
    <div class="metric-chip"><div class="val highlight">${d.phase1Target}</div><div class="lbl">Profit Target</div></div>
    <div class="metric-chip"><div class="val" style="color:#FF4D6D">${d.dailyLossLimit}</div><div class="lbl">Daily Loss Max</div></div>
    <div class="metric-chip"><div class="val" style="color:#FF4D6D">${d.maxDrawdown}</div><div class="lbl">Max Drawdown</div></div>
  </div>

  <a href="${d.downloadUrl}" class="btn" target="_blank">⬇️ Download ${d.platform}</a>

  <div class="divider"></div>
  <h2>Langkah Selanjutnya</h2>
  <div class="step-item"><div class="step-num">1</div><div class="step-text">Download dan install platform trading ${d.platform}</div></div>
  <div class="step-item"><div class="step-num">2</div><div class="step-text">Login dengan kredensial di atas (simpan di tempat aman!)</div></div>
  <div class="step-item"><div class="step-num">3</div><div class="step-text">Pantau progress Anda di <a href="${d.dashboardUrl}" style="color:#00D4C8">dashboard Koro Funding</a></div></div>
  <div class="step-item"><div class="step-num">4</div><div class="step-text">Capai profit target dan patuhi aturan risk management — akun funded menanti!</div></div>

  <p style="margin-top:24px;">Semangat trading, ${d.firstName}! Tim kami percaya pada kemampuan Anda. 💪</p>
  <a href="${d.dashboardUrl}" class="btn">Buka Dashboard →</a>
`);

// ─────────────────────────────────────────────────────────
// T2: DAILY LOSS BREACH
// ─────────────────────────────────────────────────────────
export const breachDailyEmail = (d) => baseTemplate(`
  <div class="alert-box">
    <div class="icon">⚠️</div>
    <h1 style="color:#DC2626;">Batas Daily Loss Terlampaui</h1>
  </div>
  <p>Hai ${d.firstName},</p>
  <p>Kami mendeteksi bahwa akun <strong>#${d.accountId}</strong> (${d.accountSize}) telah melampaui batas <strong>Daily Loss Limit</strong> yang ditetapkan.</p>

  <div class="creds-box">
    <div class="creds-row"><span class="creds-label">Tipe Pelanggaran</span><span class="creds-val" style="color:#DC2626;">Daily Loss Limit</span></div>
    <div class="creds-row"><span class="creds-label">Loss yang Terjadi</span><span class="creds-val" style="color:#DC2626;">${d.valueHit}</span></div>
    <div class="creds-row"><span class="creds-label">Batas yang Diizinkan</span><span class="creds-val">${d.limitValue}</span></div>
    <div class="creds-row"><span class="creds-label">Status Akun</span><span class="creds-val" style="color:#DC2626;">DINONAKTIFKAN</span></div>
  </div>

  <p>Akun Anda telah dinonaktifkan secara otomatis sesuai ketentuan challenge. Ini adalah bagian normal dari proses — semua prop trader profesional menghadapi ini.</p>
  <p>Jangan menyerah! Gunakan ini sebagai pelajaran berharga. Trader terbaik bukan yang tidak pernah kalah, tapi yang belajar dari setiap kekalahan. 💪</p>

  <div class="divider"></div>
  <h2>Mulai Lagi dengan Diskon 20%</h2>
  <p>Gunakan kode berikut saat checkout:</p>
  <div class="creds-box" style="text-align:center;">
    <div style="font-size:28px; font-weight:800; color:#F0A500; letter-spacing:4px;">${d.discountCode}</div>
    <p style="margin:8px 0 0; font-size:13px; color:#6B7A99;">Berlaku 7 hari dari sekarang</p>
  </div>
  <a href="${d.retryLink}" class="btn">🔄 Coba Lagi Sekarang</a>
`);

// ─────────────────────────────────────────────────────────
// T3: MAX DRAWDOWN BREACH
// ─────────────────────────────────────────────────────────
export const breachMaxEmail = (d) => baseTemplate(`
  <div class="alert-box">
    <div class="icon">🚨</div>
    <h1 style="color:#DC2626;">Akun Dinonaktifkan – Max Drawdown</h1>
  </div>
  <p>Hai ${d.firstName},</p>
  <p>Akun <strong>#${d.accountId}</strong> telah dinonaktifkan karena batas <strong>Max Drawdown</strong> telah terlampaui.</p>

  <div class="creds-box">
    <div class="creds-row"><span class="creds-label">Tipe Pelanggaran</span><span class="creds-val" style="color:#DC2626;">Max Drawdown</span></div>
    <div class="creds-row"><span class="creds-label">Drawdown yang Terjadi</span><span class="creds-val" style="color:#DC2626;">${d.valueHit}</span></div>
    <div class="creds-row"><span class="creds-label">Batas Maximum</span><span class="creds-val">${d.limitValue}</span></div>
  </div>

  <p>Setiap trader besar pernah mengalami ini. Yang membedakan trader sukses adalah kemampuan bangkit dan belajar dari pengalaman ini.</p>
  <p>Gunakan kode diskon <strong style="color:#F0A500;">${d.discountCode}</strong> untuk memulai kembali dengan harga lebih hemat.</p>
  <a href="${d.retryLink}" class="btn">Mulai Challenge Baru →</a>
`);

// ─────────────────────────────────────────────────────────
// T4: PHASE PASSED
// ─────────────────────────────────────────────────────────
export const phasePassedEmail = (d) => baseTemplate(`
  <div class="success-box">
    <h1>🎉 Selamat! Anda Lulus Phase ${d.phase}!</h1>
  </div>
  <p>Hai ${d.firstName},</p>
  <p>Luar biasa! Anda telah berhasil menyelesaikan <strong>Phase ${d.phase}</strong> dari challenge Koro Funding dengan akun ${d.accountSize}. Kini saatnya melanjutkan ke <strong class="highlight">Phase ${d.nextPhase}</strong>!</p>

  <div class="creds-box">
    <h2 style="margin-top:0;">Kredensial Phase ${d.nextPhase}</h2>
    <div class="creds-row"><span class="creds-label">Login</span><span class="creds-val">${d.login}</span></div>
    <div class="creds-row"><span class="creds-label">Password</span><span class="creds-val">${d.password}</span></div>
    <div class="creds-row"><span class="creds-label">Server</span><span class="creds-val">${d.server}</span></div>
    <div class="creds-row"><span class="creds-label">Target Phase ${d.nextPhase}</span><span class="creds-val highlight">${d.newTarget} profit</span></div>
  </div>

  <p>Phase ${d.nextPhase} memiliki target lebih rendah — Anda hampir di sana! Pertahankan disiplin yang sama dan akun funded sudah menanti. 🏆</p>
  <a href="${d.dashboardUrl}" class="btn">Pantau Progress →</a>
`);

// ─────────────────────────────────────────────────────────
// T5: CHALLENGE FULLY PASSED → KYC
// ─────────────────────────────────────────────────────────
export const challengePassedEmail = (d) => baseTemplate(`
  <div class="success-box" style="text-align:center;">
    <div style="font-size:48px;">🏆</div>
    <h1>Anda LULUS! Selamat, ${d.firstName}!</h1>
  </div>
  <p>Anda telah berhasil menyelesaikan <strong>${d.challengeType}</strong> dengan akun senilai <strong class="highlight">${d.accountSize}</strong>. Total profit: <strong class="gold">${d.profit}</strong>. LUAR BIASA!</p>

  <p>Langkah terakhir sebelum akun funded Anda aktif: <strong>Verifikasi KYC</strong>.</p>

  <div class="divider"></div>
  <h2>Langkah Verifikasi KYC</h2>
  <div class="step-item"><div class="step-num">1</div><div class="step-text">Klik tombol di bawah dan masuk ke portal KYC</div></div>
  <div class="step-item"><div class="step-num">2</div><div class="step-text">Upload foto/scan ID pemerintah yang masih berlaku (KTP/Paspor)</div></div>
  <div class="step-item"><div class="step-num">3</div><div class="step-text">Upload bukti alamat (tagihan listrik/rekening koran, maks 3 bulan)</div></div>
  <div class="step-item"><div class="step-num">4</div><div class="step-text">Ambil selfie dengan ID Anda</div></div>
  <div class="step-item"><div class="step-num">5</div><div class="step-text">Tim kami akan mereview dalam 24–48 jam kerja</div></div>

  <a href="${d.kycLink}" class="btn">✅ Mulai Verifikasi KYC</a>

  ${d.certUrl ? `<div class="divider"></div><h2>🎓 Sertifikat Challenge Anda</h2><p>Download sertifikat kelulusan Anda dan bagikan ke komunitas trading!</p><a href="${d.certUrl}" class="btn btn-outline">Download Sertifikat</a>` : ''}
`);

// ─────────────────────────────────────────────────────────
// T6: KYC APPROVED → FUNDED ACCOUNT ACTIVE
// ─────────────────────────────────────────────────────────
export const kycApprovedEmail = (d) => baseTemplate(`
  <div style="background:linear-gradient(135deg, #07090F, #0D2137); padding:32px; border-radius:12px; text-align:center; margin-bottom:24px;">
    <div style="font-size:40px;">💰</div>
    <h1 style="color:#F0A500; margin:8px 0;">Akun Funded Anda AKTIF!</h1>
    <p style="color:#9CA3AF; margin:0;">KYC berhasil diverifikasi</p>
  </div>
  <p>Hai ${d.firstName},</p>
  <p>Verifikasi identitas Anda telah disetujui! Akun funded senilai <strong class="highlight">${d.accountSize}</strong> Anda kini aktif dan siap digunakan.</p>

  <div class="creds-box">
    <h2 style="margin-top:0;">Akun Funded Anda</h2>
    <div class="creds-row"><span class="creds-label">Login</span><span class="creds-val">${d.login}</span></div>
    <div class="creds-row"><span class="creds-label">Password</span><span class="creds-val">${d.password}</span></div>
    <div class="creds-row"><span class="creds-label">Server</span><span class="creds-val">${d.server}</span></div>
    <div class="creds-row"><span class="creds-label">Profit Split</span><span class="creds-val gold">${d.profitSplit}% untuk Anda</span></div>
  </div>

  <h2>Cara Request Payout</h2>
  <div class="step-item"><div class="step-num">1</div><div class="step-text">Login ke dashboard dan klik "Request Payout"</div></div>
  <div class="step-item"><div class="step-num">2</div><div class="step-text">Masukkan jumlah dan pilih metode pembayaran</div></div>
  <div class="step-item"><div class="step-num">3</div><div class="step-text">Tim kami memproses dalam 1x24 jam kerja</div></div>

  <a href="${d.dashboardUrl}" class="btn gold">🚀 Buka Akun Funded</a>
`);

// ─────────────────────────────────────────────────────────
// T7: PAYOUT PROCESSING
// ─────────────────────────────────────────────────────────
export const payoutProcessingEmail = (d) => baseTemplate(`
  <h1>💸 Payout Anda Sedang Diproses</h1>
  <p>Hai ${d.firstName},</p>
  <p>Kami telah menerima permintaan payout Anda dan sedang memprosesnya.</p>

  <div class="creds-box">
    <div class="creds-row"><span class="creds-label">Jumlah</span><span class="creds-val highlight">${d.amount}</span></div>
    <div class="creds-row"><span class="creds-label">Metode</span><span class="creds-val">${d.method}</span></div>
    <div class="creds-row"><span class="creds-label">Estimasi Tiba</span><span class="creds-val">1–2 hari kerja</span></div>
    <div class="creds-row"><span class="creds-label">Referensi</span><span class="creds-val">${d.payoutId}</span></div>
  </div>
  <a href="${d.dashboardUrl}" class="btn">Lihat Status Payout</a>
`);

// ─────────────────────────────────────────────────────────
// T8: PAYOUT COMPLETED
// ─────────────────────────────────────────────────────────
export const payoutCompletedEmail = (d) => baseTemplate(`
  <div style="text-align:center; padding:16px 0;">
    <div style="font-size:56px;">🎉</div>
    <h1>Payout Berhasil Dikirim!</h1>
  </div>
  <p>Hai ${d.firstName},</p>
  <p>Payout sebesar <strong class="gold">${d.amount}</strong> telah berhasil dikirim ke akun Anda via <strong>${d.method}</strong>.</p>

  <div class="creds-box">
    <div class="creds-row"><span class="creds-label">Jumlah Bersih</span><span class="creds-val gold">${d.amount}</span></div>
    <div class="creds-row"><span class="creds-label">Metode</span><span class="creds-val">${d.method}</span></div>
    <div class="creds-row"><span class="creds-label">Tanggal</span><span class="creds-val">${d.paidAt}</span></div>
    <div class="creds-row"><span class="creds-label">ID Transaksi</span><span class="creds-val">${d.payoutId}</span></div>
  </div>

  <p>Selamat! 🎊 Bagikan pencapaian Anda dan inspirasi trader lain:</p>
  <a href="https://twitter.com/intent/tweet?text=Baru+saja+dapat+payout+dari+@KoroFunding!+Trade.+Prove.+Get+Funded.+%23KoroFunding+%23PropFirm" class="btn btn-outline" style="margin-right:12px;">Share di Twitter/X</a>
  <a href="${d.dashboardUrl}" class="btn">Kembali ke Dashboard</a>
`);

// ─── EMAIL SENDER ─────────────────────────────────────────
const TEMPLATES = {
  credentials:       credentialsEmail,
  breach_daily:      breachDailyEmail,
  breach_max:        breachMaxEmail,
  phase_passed:      phasePassedEmail,
  challenge_passed:  challengePassedEmail,
  kyc_approved:      kycApprovedEmail,
  payout_processing: payoutProcessingEmail,
  payout_completed:  payoutCompletedEmail,
};

export async function sendEmail({ to, template, data }) {
  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const renderFn = TEMPLATES[template];
  if (!renderFn) throw new Error(`Unknown email template: ${template}`);
  const html = renderFn(data);

  const subjects = {
    credentials:       `🎯 Akun Challenge Anda Siap – Koro Funding`,
    breach_daily:      `⚠️ Peringatan: Daily Loss Limit Terlampaui – Akun #${data.accountId}`,
    breach_max:        `🚨 Akun Dinonaktifkan – Max Drawdown – Akun #${data.accountId}`,
    phase_passed:      `🎉 Selamat! Anda Lulus Phase ${data.phase} – Koro Funding`,
    challenge_passed:  `🏆 Anda LULUS Challenge! Langkah KYC – Koro Funding`,
    kyc_approved:      `💰 Akun Funded Aktif! Selamat, ${data.firstName}`,
    payout_processing: `💸 Payout Anda Sedang Diproses – Koro Funding`,
    payout_completed:  `🎉 Payout ${data.amount} Berhasil Dikirim!`,
  };

  await sgMail.send({
    to,
    from: { email: process.env.EMAIL_FROM, name: 'Koro Funding' },
    subject: subjects[template],
    html,
  });
}
