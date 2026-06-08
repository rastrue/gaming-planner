import { Router } from 'express';
import * as slotController from '../controllers/slotController.js';
import { organizerGuard } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams } from '../middleware/errorHandler.js';
import {
  createSlotSchema,
  eventSlotEventParamsSchema,
  slotIdParamsSchema,
  updateSlotSchema,
} from '../validators/slotValidator.js';

export const eventSlotNestedRouter = Router({ mergeParams: true });

eventSlotNestedRouter.get('/', asyncHandler(slotController.listEventSlots));
eventSlotNestedRouter.post(
  '/',
  ...organizerGuard,
  validateBody(createSlotSchema),
  asyncHandler(slotController.createEventSlot),
);

const slotMutationRouter = Router();

slotMutationRouter.put(
  '/:id',
  ...organizerGuard,
  validateParams(slotIdParamsSchema),
  validateBody(updateSlotSchema),
  asyncHandler(slotController.updateEventSlot),
);
slotMutationRouter.delete(
  '/:id',
  ...organizerGuard,
  validateParams(slotIdParamsSchema),
  asyncHandler(slotController.deleteEventSlot),
);

export default slotMutationRouter;
