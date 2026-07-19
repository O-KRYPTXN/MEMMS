import { z } from 'zod';

export const createDeviceSchema = z.object({
  name: z.string().min(2, "Device name must be at least 2 characters long"),
  category: z.string().min(2, "Category is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  departmentId: z.string().cuid("Invalid department ID"),
  purchaseDate: z.string().datetime().optional().or(z.date().optional()),
  lastPmDate: z.string().datetime().optional().or(z.date().optional()),
  nextPmDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().optional()
});

export const updateDeviceSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  serialNumber: z.string().min(1).optional(),
  departmentId: z.string().cuid().optional(),
  purchaseDate: z.string().datetime().optional().or(z.date().optional()),
  lastPmDate: z.string().datetime().optional().or(z.date().optional()),
  nextPmDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['OPERATIONAL', 'FAULTY', 'MAINTENANCE', 'DECOMMISSIONED'])
});
