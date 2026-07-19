import { z } from 'zod';

export const getAlertsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const markReadSchema = z.object({
  id: z.string().cuid('Invalid alert ID'),
});
