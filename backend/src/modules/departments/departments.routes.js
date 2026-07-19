import express from 'express';
import * as departmentsController from './departments.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';

const router = express.Router();

// Public route for Signup dropdown
router.get('/options', departmentsController.getPublicDepartments);

// All routes below require the user to be logged in
router.use(protect);

router
  .route('/')
  .get(departmentsController.getDepartments)
  .post(requireRoles('ADMIN'), departmentsController.createDepartment);

router
  .route('/:id')
  .get(departmentsController.getDepartment)
  .patch(requireRoles('ADMIN'), departmentsController.updateDepartment);

export default router;
