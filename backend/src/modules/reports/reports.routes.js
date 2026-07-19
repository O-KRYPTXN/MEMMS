import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as reportsController from './reports.controller.js';
import * as reportsValidation from './reports.validation.js';


const router = express.Router();

router.use(protect);
router.use(requireRoles('ADMIN', 'VIEWER'));

router.get(
  '/dashboard',
  validateRequest(reportsValidation.getDashboardQuery, 'query'),
  reportsController.getDashboardHandler
);

router.get(
  '/analytics',
  reportsController.getAnalyticsHandler
);

router.get(
  '/',
  validateRequest(reportsValidation.getReportsQuery, 'query'),
  reportsController.getReportsHandler
);

router.post(
  '/generate',
  validateRequest(reportsValidation.generateReportBody, 'body'),
  reportsController.generateReportHandler
);

router.get(
  '/:id/download',
  reportsController.downloadReportHandler
);

export default router;
