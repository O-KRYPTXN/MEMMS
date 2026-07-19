import { z } from 'zod';

// Roles accepted by the system
const RoleEnum = z.enum(['ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'DEPARTMENT']);

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: RoleEnum,
  departmentId: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: RoleEnum.optional(),
  departmentId: z.string().optional().nullable(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
}).refine(data => data.isActive !== undefined || data.isSuspended !== undefined, {
  message: "Must provide either isActive or isSuspended to update status",
});

export const queryUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  role: RoleEnum.optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
  isSuspended: z.enum(['true', 'false']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});
