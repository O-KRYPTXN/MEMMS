import { z } from 'zod';

export const createFaultReportSchema = z.object({
  deviceId: z.string({ required_error: 'Device ID is required' }),
  description: z.string({ required_error: 'Description is required' }).min(5, 'Description must be at least 5 characters'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const updateFaultReportSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SOLVED', 'REJECTED']).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const queryFaultReportsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SOLVED', 'REJECTED']).optional(),
  deviceId: z.string().optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
});
