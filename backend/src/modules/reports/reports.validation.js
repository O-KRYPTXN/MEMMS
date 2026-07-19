import { z } from 'zod';

export const getDashboardQuery = z.object({});

export const getReportsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  format: z.string().optional(),
  search: z.string().optional(),
});

export const generateReportBody = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['EQUIPMENT', 'MAINTENANCE', 'INVENTORY', 'FINANCIAL', 'COMPLIANCE']),
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
  period: z.string().optional()
});
