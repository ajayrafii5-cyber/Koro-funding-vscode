import axios from 'axios';
import { logger } from './logger.js';

export async function notifyAdmin({ text, color = 'good' }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR')) {
    logger.info(`[SLACK MOCK] ${text}`);
    return;
  }
  try {
    await axios.post(webhookUrl, {
      attachments: [{ color, text, footer: 'Koro Funding', ts: Math.floor(Date.now() / 1000) }]
    });
  } catch (err) {
    logger.error(`Slack notification failed: ${err.message}`);
  }
}
