import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as devicesController from './devices.controller.js';
import { createDeviceSchema, updateDeviceSchema, updateStatusSchema } from './devices.validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/devices (List all devices with pagination/filters) - All authenticated users
router.get('/', devicesController.getDevices);

// GET /api/devices/stats (Get overall device metrics) - All authenticated users
router.get('/stats', devicesController.getDeviceStats);

// GET /api/devices/:id (Get single device) - All authenticated users
router.get('/:id', devicesController.getDeviceById);

// POST /api/devices (Create device) - Admin & Supervisor only
router.post(
  '/',
  requireRoles('ADMIN', 'SUPERVISOR'),
  validateRequest(createDeviceSchema),
  devicesController.createDevice
);

// PATCH /api/devices/:id (Update device details) - Admin & Supervisor only
router.patch(
  '/:id',
  requireRoles('ADMIN', 'SUPERVISOR'),
  validateRequest(updateDeviceSchema),
  devicesController.updateDevice
);

// PATCH /api/devices/:id/status (Update device status) - Admin, Supervisor, Technician
router.patch(
  '/:id/status',
  requireRoles('ADMIN', 'SUPERVISOR', 'TECHNICIAN'),
  validateRequest(updateStatusSchema),
  devicesController.updateDeviceStatus
);

// DELETE /api/devices/:id (Delete device) - Admin only
router.delete(
  '/:id',
  requireRoles('ADMIN'),
  devicesController.deleteDevice
);

export default router;
