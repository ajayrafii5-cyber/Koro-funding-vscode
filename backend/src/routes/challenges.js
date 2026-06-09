import { Router } from 'express';
const router = Router();

const CHALLENGES = [
  { type: 'CHALLENGE_2STEP', label: '2-Step Challenge', sizes: [10000,25000,50000,100000,200000], split: 80, leverage: '1:100' },
  { type: 'CHALLENGE_1STEP', label: '1-Step Challenge', sizes: [10000,25000,50000,100000], split: 85, leverage: '1:100' },
  { type: 'INSTANT_FUNDING', label: 'Instant Funding',  sizes: [10000,25000,50000], split: 75, leverage: '1:50' },
];

router.get('/', (_req, res) => {
  res.json({ challenges: CHALLENGES });
});

export default router;
