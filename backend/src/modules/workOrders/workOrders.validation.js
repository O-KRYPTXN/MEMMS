import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  deviceId: z.string({ required_error: 'Device ID is required' }),
  type: z.enum(['REPAIR', 'PREVENTIVE_MAINTENANCE', 'DECOMMISSION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().optional(),
  faultReportId: z.string().optional()
});

export const updateWorkOrderSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'PENDING_APPROVAL', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().nullable().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional())
});

export const queryWorkOrdersSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'PENDING_APPROVAL', 'DONE', 'CANCELLED']).optional(),
  type: z.enum(['REPAIR', 'PREVENTIVE_MAINTENANCE', 'DECOMMISSION']).optional(),
  deviceId: z.string().optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
});
