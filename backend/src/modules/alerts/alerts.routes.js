import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as validation from './alerts.validation.js';
import * as controller from './alerts.controller.js';

const router = Router();

// All alert routes require authentication
router.use(protect);

// Get unread count
router.get('/unread-count', controller.getUnreadCountHandler);

// Get paginated alerts
router.get('/', validateRequest(validation.getAlertsSchema, 'query'), controller.getAlertsHandler);

// Mark all as read
router.patch('/read-all', controller.markAllAsReadHandler);

// Mark specific alert as read
router.patch('/:id/read', validateRequest(validation.markReadSchema, 'params'), controller.markAsReadHandler);

export default router;
