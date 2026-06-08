import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import { optionalAuth, organizerGuard } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams, validateQuery } from '../middleware/errorHandler.js';
import {
  createEventSchema,
  eventIdParamsSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from '../validators/eventValidator.js';
import { eventSlotEventParamsSchema } from '../validators/slotValidator.js';
import { eventSlotNestedRouter } from './slotRoutes.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validateQuery(listEventsQuerySchema),
  asyncHandler(eventController.listEvents),
);
router.use(
  '/:eventId/slots',
  validateParams(eventSlotEventParamsSchema),
  eventSlotNestedRouter,
);
router.get('/:id', validateParams(eventIdParamsSchema), asyncHandler(eventController.getEventById));
router.post(
  '/',
  ...organizerGuard,
  validateBody(createEventSchema),
  asyncHandler(eventController.createEvent),
);
router.put(
  '/:id',
  ...organizerGuard,
  validateParams(eventIdParamsSchema),
  validateBody(updateEventSchema),
  asyncHandler(eventController.updateEvent),
);
router.delete(
  '/:id',
  ...organizerGuard,
  validateParams(eventIdParamsSchema),
  asyncHandler(eventController.deleteEvent),
);

export default router;
