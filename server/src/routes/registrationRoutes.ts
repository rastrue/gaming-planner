import { Router } from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams, validateQuery } from '../middleware/errorHandler.js';
import {
  createRegistrationSchema,
  listRegistrationsQuerySchema,
  registrationIdParamsSchema,
  updateRegistrationSchema,
} from '../validators/registrationValidator.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validateQuery(listRegistrationsQuerySchema),
  asyncHandler(registrationController.listRegistrations),
);
router.get(
  '/:id',
  validateParams(registrationIdParamsSchema),
  asyncHandler(registrationController.getRegistrationById),
);
router.post(
  '/',
  validateBody(createRegistrationSchema),
  asyncHandler(registrationController.createRegistration),
);
router.put(
  '/:id',
  validateParams(registrationIdParamsSchema),
  validateBody(updateRegistrationSchema),
  asyncHandler(registrationController.updateRegistration),
);
router.delete(
  '/:id',
  validateParams(registrationIdParamsSchema),
  asyncHandler(registrationController.deleteRegistration),
);

export default router;
