import { catchAsync } from '../../utils/catchAsync.js';
import * as pmTaskService from './pmTasks.service.js';
// Trigger nodemon restart for Prisma client

export const getPMTasks = catchAsync(async (req, res) => {
  // If technician, optionally restrict to their tasks only. 
  // For now, let's allow tech to see all PM tasks but they can filter.
  // We can force techId if they are TECHNICIAN role and trying to fetch assigned
  const query = { ...req.query };
  if (req.user.role === 'TECHNICIAN' && !query.techId) {
    // Optionally scope to only their assigned PMs? 
    // Usually techs might need to see what's scheduled for their department.
    // Let's stick to standard RBAC filtering if needed, but for now just pass query.
  }

  const tasks = await pmTaskService.getPMTasks(query);
  res.status(200).json({
    status: 'success',
    results: tasks.length,
    items: tasks
  });
});

export const getPMTask = catchAsync(async (req, res) => {
  const task = await pmTaskService.getPMTaskById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: task
  });
});

export const createPMTask = catchAsync(async (req, res) => {
  const task = await pmTaskService.createPMTask(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: task
  });
});

export const updatePMTask = catchAsync(async (req, res) => {
  const task = await pmTaskService.updatePMTask(req.params.id, req.body, req.user.id);
  res.status(200).json({
    status: 'success',
    data: task
  });
});

export const deletePMTask = catchAsync(async (req, res) => {
  await pmTaskService.deletePMTask(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});
