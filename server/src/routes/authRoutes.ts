import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
router.get('/me', optionalAuth, asyncHandler(authController.me));
router.post('/logout', authController.logout);

export default router;
