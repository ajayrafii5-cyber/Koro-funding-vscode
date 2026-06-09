import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  }
});

export async function sendEmail({ to, template, data }) {
  const subjects = {
    breach_daily:     '⚠️ Daily Loss Limit Breached — Koro Funding',
    breach_max:       '🚨 Max Drawdown Breached — Koro Funding',
    phase_passed:     '🎯 Phase Passed! — Koro Funding',
    challenge_passed: '🏆 Challenge Passed! — Koro Funding',
    expiry_warning:   '⏰ Account Expiring Soon — Koro Funding',
  };

  const bodies = {
    breach_daily: `Hi ${data.firstName}, your account ${data.accountId} has hit the daily loss limit of ${data.limitValue}. Account has been disabled.`,
    breach_max:   `Hi ${data.firstName}, your account ${data.accountId} has hit the max drawdown limit of ${data.limitValue}. Account has been disabled.`,
    phase_passed: `Hi ${data.firstName}, congratulations! You passed Phase ${data.phase}. Your Phase ${data.nextPhase} credentials: Login: ${data.login}, Password: ${data.password}, Server: ${data.server}`,
    challenge_passed: `Hi ${data.firstName}, you passed the challenge! Please complete KYC at ${data.kycLink}`,
    expiry_warning: `Hi ${data.firstName}, your account expires in ${data.daysLeft} days on ${data.expiresAt}.`,
  };

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: subjects[template] || 'Koro Funding Notification',
    text: bodies[template] || JSON.stringify(data),
  });
}
