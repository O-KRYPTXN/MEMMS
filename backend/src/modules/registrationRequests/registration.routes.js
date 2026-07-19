import express from 'express';
import * as registrationController from './registration.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';

const router = express.Router();

// Registration management is strictly for ADMINs
router.use(protect);
router.use(requireRoles('ADMIN'));

router
  .route('/')
  .get(registrationController.getRequests);

router
  .route('/:id/approve')
  .post(registrationController.approveRegistration);

router
  .route('/:id/reject')
  .post(registrationController.rejectRegistration);

export default router;
