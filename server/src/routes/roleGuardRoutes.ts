import { Router } from 'express';
import {
  organizerGuard,
  playerGuard,
  requireAuth,
} from '../middleware/authMiddleware.js';

const router = Router();

router.get('/organizer', ...organizerGuard, (_req, res) => {
  res.json({ access: 'organizer' });
});

router.get('/player', ...playerGuard, (_req, res) => {
  res.json({ access: 'player' });
});

router.get('/authenticated', requireAuth, (_req, res) => {
  res.json({ access: 'authenticated' });
});

export default router;
