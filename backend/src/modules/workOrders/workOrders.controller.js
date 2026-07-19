import { catchAsync } from '../../utils/catchAsync.js';
import * as workOrderService from './workOrders.service.js';
import * as workOrderValidation from './workOrders.validation.js';

const formatZodErrors = (error) => {
  return error.errors.map(err => err.message).join(', ');
};

export const createWorkOrder = catchAsync(async (req, res) => {
  const parsed = workOrderValidation.createWorkOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  try {
    const wo = await workOrderService.createWorkOrder(parsed.data, req.user);
    res.status(201).json({
      status: 'success',
      data: wo
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

export const getWorkOrders = catchAsync(async (req, res) => {
  const parsed = workOrderValidation.queryWorkOrdersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  const { page, limit, ...filters } = parsed.data;
  const result = await workOrderService.getWorkOrders(page, limit, filters, req.user);
  
  res.status(200).json(result);
});

export const getWorkOrderById = catchAsync(async (req, res) => {
  try {
    const wo = await workOrderService.getWorkOrderById(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: wo
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

export const updateWorkOrder = catchAsync(async (req, res) => {
  const parsed = workOrderValidation.updateWorkOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  try {
    const wo = await workOrderService.updateWorkOrder(req.params.id, parsed.data, req.user);
    res.status(200).json({
      status: 'success',
      data: wo
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

export const deleteWorkOrder = catchAsync(async (req, res) => {
  try {
    await workOrderService.deleteWorkOrder(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Work order deleted successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});
