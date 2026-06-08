import { Router } from 'express';
import authRoutes from './authRoutes.js';
import roleGuardRoutes from './roleGuardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/role-guards', roleGuardRoutes);

export default router;
