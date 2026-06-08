import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/errorHandler.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', authController.logout);

export default router;
