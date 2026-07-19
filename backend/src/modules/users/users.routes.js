import express from 'express';
import * as usersController from './users.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Specific routes that allow SUPERVISOR as well
router.get('/', requireRoles('ADMIN', 'SUPERVISOR'), usersController.getUsers);
router.get('/:id', requireRoles('ADMIN', 'SUPERVISOR'), usersController.getUser);

// Admin-only routes
router.use(requireRoles('ADMIN'));

router.post('/', usersController.createUser);
router.patch('/:id', usersController.updateUser);
router.patch('/:id/status', usersController.updateUserStatus);

export default router;
