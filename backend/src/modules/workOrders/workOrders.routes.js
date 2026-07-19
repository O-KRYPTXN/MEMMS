import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import * as workOrderController from './workOrders.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', requireRoles('ADMIN', 'SUPERVISOR', 'TECHNICIAN'), workOrderController.getWorkOrders);
router.get('/:id', requireRoles('ADMIN', 'SUPERVISOR', 'TECHNICIAN'), workOrderController.getWorkOrderById);
router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), workOrderController.createWorkOrder);
router.patch('/:id', requireRoles('ADMIN', 'SUPERVISOR', 'TECHNICIAN'), workOrderController.updateWorkOrder);
router.delete('/:id', requireRoles('ADMIN'), workOrderController.deleteWorkOrder);

export default router;
