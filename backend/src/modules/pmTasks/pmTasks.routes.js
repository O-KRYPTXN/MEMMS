import express from 'express';
import * as pmTaskController from './pmTasks.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createPMTaskSchema, updatePMTaskSchema } from './pmTasks.validation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(pmTaskController.getPMTasks)
  .post(requireRoles('ADMIN', 'SUPERVISOR'), validateRequest(createPMTaskSchema), pmTaskController.createPMTask);

router
  .route('/:id')
  .get(pmTaskController.getPMTask)
  .patch(requireRoles('ADMIN', 'SUPERVISOR', 'TECHNICIAN'), validateRequest(updatePMTaskSchema), pmTaskController.updatePMTask)
  .delete(requireRoles('ADMIN', 'SUPERVISOR'), pmTaskController.deletePMTask);

export default router;
