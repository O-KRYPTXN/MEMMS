import { z } from 'zod';

export const getAuditLogsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional()
});
