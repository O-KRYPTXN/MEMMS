import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(1, 'Code is required').max(10, 'Code cannot exceed 10 characters'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  code: z.string().min(1, 'Code is required').max(10, 'Code cannot exceed 10 characters').optional(),
  isActive: z.boolean().optional(),
});

export const queryDepartmentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  all: z.enum(['true', 'false']).optional(), // if true, returns all departments without pagination
});
