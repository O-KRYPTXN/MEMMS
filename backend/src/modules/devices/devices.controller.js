import { catchAsync } from '../../utils/catchAsync.js';
import * as deviceService from './devices.service.js';

export const getDevices = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const filters = {
    category: req.query.category,
    status: req.query.status,
    departmentId: req.query.departmentId,
    search: req.query.search,
    all: req.query.all
  };

  if (req.user.role === 'DEPARTMENT') {
    filters.departmentId = req.user.departmentId;
  }

  const result = await deviceService.getAllDevices(page, limit, filters);

  res.status(200).json(result);
});

export const getDeviceStats = catchAsync(async (req, res) => {
  let departmentId = null;
  if (req.user.role === 'DEPARTMENT') {
    departmentId = req.user.departmentId;
  }

  const stats = await deviceService.getDeviceStats(departmentId);
  
  res.status(200).json({
    message: 'Device stats fetched successfully',
    data: stats
  });
});

export const getDeviceById = catchAsync(async (req, res) => {
  const device = await deviceService.getDeviceById(req.params.id);
  
  res.status(200).json({
    message: 'Device fetched successfully',
    data: device
  });
});

export const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body, req.user.id);

  res.status(201).json({
    message: 'Device created successfully',
    data: device
  });
});

export const updateDevice = catchAsync(async (req, res) => {
  const device = await deviceService.updateDevice(req.params.id, req.body, req.user.id);

  res.status(200).json({
    message: 'Device updated successfully',
    data: device
  });
});

export const updateDeviceStatus = catchAsync(async (req, res) => {
  const device = await deviceService.updateDeviceStatus(req.params.id, req.body.status, req.user.id);

  res.status(200).json({
    message: 'Device status updated successfully',
    data: device
  });
});

export const deleteDevice = catchAsync(async (req, res) => {
  await deviceService.deleteDevice(req.params.id);

  res.status(200).json({
    message: 'Device deleted successfully'
  });
});
