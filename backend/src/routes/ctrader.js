import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const CLIENT_ID     = process.env.CTRADER_CLIENT_ID;
const CLIENT_SECRET = process.env.CTRADER_CLIENT_SECRET;
const REDIRECT_URI  = process.env.CTRADER_REDIRECT_URI;
const BASE_URL      = 'https://connect.spotware.com';

// Step 1: Redirect trader ke cTrader login
router.get('/auth', (req, res) => {
  const url = `${BASE_URL}/apps/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=trading`;
  res.redirect(url);
});

// Step 2: Callback setelah trader login
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code received' });

  try {
    const response = await fetch(`${BASE_URL}/apps/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const token = await response.json();
    console.log('cTrader token:', token);

    // TODO: simpan token ke database trader
    res.json({ success: true, token });
  } catch (err) {
    console.error('cTrader callback error:', err);
    res.status(500).json({ error: 'Failed to get token' });
  }
});

export default router;
