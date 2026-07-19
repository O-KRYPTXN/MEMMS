import { z } from 'zod';

export const createPMTaskSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  type: z.enum(['ROUTINE', 'CALIBRATION', 'INSPECTION']).default('ROUTINE'),
  recurrence: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).optional().nullable().or(z.literal('')),
  scheduledAt: z.string().datetime().or(z.string().min(1)), // Can be tightened to z.string().datetime() if strictly ISO
  assignedToId: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal(''))
});

export const updatePMTaskSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
  assignedToId: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  scheduledAt: z.string().datetime().or(z.string().min(1)).optional(),
  recurrence: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).optional().nullable().or(z.literal('')),
  type: z.enum(['ROUTINE', 'CALIBRATION', 'INSPECTION']).optional()
});
