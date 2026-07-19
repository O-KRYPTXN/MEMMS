import { z } from 'zod';

export const queryRegistrationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'APPROVED', 'DENIED']).optional(),
  search: z.string().optional(),
});

export const rejectRegistrationSchema = z.object({
  reason: z.string().optional(),
});
