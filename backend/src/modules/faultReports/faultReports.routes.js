import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import * as faultReportController from './faultReports.controller.js';

const router = express.Router();

router.use(protect);

router.get('/stats', requireRoles('DEPARTMENT', 'ADMIN', 'SUPERVISOR'), faultReportController.getFaultReportStats);
router.get('/', requireRoles('DEPARTMENT', 'ADMIN', 'SUPERVISOR', 'TECHNICIAN'), faultReportController.getFaultReports);
router.post('/', requireRoles('DEPARTMENT'), faultReportController.createFaultReport);
router.patch('/:id', requireRoles('ADMIN', 'SUPERVISOR'), faultReportController.updateFaultReport);

export default router;
