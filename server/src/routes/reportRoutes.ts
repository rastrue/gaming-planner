import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler, validateBody, validateParams, validateQuery } from '../middleware/errorHandler.js';
import {
  createReportSchema,
  emailReportSchema,
  listReportsQuerySchema,
  reportIdParamsSchema,
  updateReportSchema,
} from '../validators/reportValidator.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(listReportsQuerySchema), asyncHandler(reportController.listReports));
router.get(
  '/:id/download',
  validateParams(reportIdParamsSchema),
  asyncHandler(reportController.downloadReport),
);
router.post(
  '/:id/email',
  validateParams(reportIdParamsSchema),
  validateBody(emailReportSchema),
  asyncHandler(reportController.emailReport),
);
router.get('/:id', validateParams(reportIdParamsSchema), asyncHandler(reportController.getReportById));
router.post('/', validateBody(createReportSchema), asyncHandler(reportController.createReport));
router.put(
  '/:id',
  validateParams(reportIdParamsSchema),
  validateBody(updateReportSchema),
  asyncHandler(reportController.updateReport),
);
router.delete(
  '/:id',
  validateParams(reportIdParamsSchema),
  asyncHandler(reportController.deleteReport),
);

export default router;
