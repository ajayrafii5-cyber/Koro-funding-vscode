import { logger } from './logger.js';

export async function notifyAdmin({ text, color }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn(`[SLACK MOCK] ${text}`);
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{ text, color: color || 'good' }]
    })
  });
}
