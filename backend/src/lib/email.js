import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import { credentialsEmail, breachDailyEmail, breachMaxEmail, phasePassedEmail, challengePassedEmail, kycApprovedEmail, payoutProcessingEmail, payoutCompletedEmail } from './email-templates.js';

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

const SUBJECTS = {
  credentials:       '🎯 Akun Challenge Anda Siap – Koro Funding',
  breach_daily:      '⚠️ Peringatan: Daily Loss Limit Terlampaui',
  breach_max:        '🚨 Akun Dinonaktifkan – Max Drawdown',
  phase_passed:      '🎉 Selamat! Anda Lulus Phase',
  challenge_passed:  '🏆 Anda LULUS Challenge! – Koro Funding',
  kyc_approved:      '💰 Akun Funded Anda Aktif!',
  payout_processing: '💸 Payout Anda Sedang Diproses',
  payout_completed:  '🎉 Payout Berhasil Dikirim!',
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, template, data }) {
  try {
    const renderFn = TEMPLATES[template];
    const html = renderFn ? renderFn(data) : `<p>${JSON.stringify(data)}</p>`;
    await transporter.sendMail({
      from: `"Koro Funding" <${process.env.GMAIL_USER}>`,
      to,
      subject: SUBJECTS[template] || template,
      html,
    });
    logger.info(`Email sent: ${template} → ${to}`);
  } catch (err) {
    logger.error(`Email failed (${template} → ${to}): ${err.message}`);
  }
}
