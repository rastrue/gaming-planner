import { Router } from 'express';
import * as gameController from '../controllers/gameController.js';
import { organizerGuard } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams } from '../middleware/errorHandler.js';
import {
  createGameSchema,
  gameIdParamsSchema,
  updateGameSchema,
} from '../validators/gameValidator.js';

const router = Router();

router.get('/', asyncHandler(gameController.listGames));
router.get('/:id', validateParams(gameIdParamsSchema), asyncHandler(gameController.getGameById));
router.post(
  '/',
  ...organizerGuard,
  validateBody(createGameSchema),
  asyncHandler(gameController.createGame),
);
router.put(
  '/:id',
  ...organizerGuard,
  validateParams(gameIdParamsSchema),
  validateBody(updateGameSchema),
  asyncHandler(gameController.updateGame),
);
router.delete(
  '/:id',
  ...organizerGuard,
  validateParams(gameIdParamsSchema),
  asyncHandler(gameController.deleteGame),
);

export default router;
