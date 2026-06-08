import { Router } from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import gameRoutes from './gameRoutes.js';
import roleGuardRoutes from './roleGuardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/events', eventRoutes);
router.use('/role-guards', roleGuardRoutes);

export default router;
