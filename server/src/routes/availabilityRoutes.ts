import { Router } from 'express';
import * as availabilityController from '../controllers/availabilityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams, validateQuery } from '../middleware/errorHandler.js';
import {
  availabilityIdParamsSchema,
  createAvailabilitySchema,
  listAvailabilityQuerySchema,
  updateAvailabilitySchema,
} from '../validators/availabilityValidator.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validateQuery(listAvailabilityQuerySchema),
  asyncHandler(availabilityController.listAvailabilityWindows),
);
router.get(
  '/:id',
  validateParams(availabilityIdParamsSchema),
  asyncHandler(availabilityController.getAvailabilityWindowById),
);
router.post(
  '/',
  validateBody(createAvailabilitySchema),
  asyncHandler(availabilityController.createAvailabilityWindow),
);
router.put(
  '/:id',
  validateParams(availabilityIdParamsSchema),
  validateBody(updateAvailabilitySchema),
  asyncHandler(availabilityController.updateAvailabilityWindow),
);
router.delete(
  '/:id',
  validateParams(availabilityIdParamsSchema),
  asyncHandler(availabilityController.deleteAvailabilityWindow),
);

export default router;
