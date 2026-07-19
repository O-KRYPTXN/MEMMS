import { catchAsync } from '../../utils/catchAsync.js';
import * as auditLogsService from './auditLogs.service.js';

export const getAuditLogsHandler = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const { entity, action, search, startDate, endDate, userId } = req.query;

  const result = await auditLogsService.getAuditLogs({
    page,
    limit,
    entity,
    action,
    search,
    startDate,
    endDate,
    userId
  });

  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
});
