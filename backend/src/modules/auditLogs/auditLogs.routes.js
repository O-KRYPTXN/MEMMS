import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as auditLogsController from './auditLogs.controller.js';
import * as auditLogsValidation from './auditLogs.validation.js';

const router = express.Router();

// Audit logs are read-only and restricted to ADMIN
router.use(protect);
router.use(requireRoles('ADMIN'));

router.get(
  '/',
  validateRequest(auditLogsValidation.getAuditLogsQuery, 'query'),
  auditLogsController.getAuditLogsHandler
);

export default router;
