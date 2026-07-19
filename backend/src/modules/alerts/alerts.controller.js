import { catchAsync } from '../../utils/catchAsync.js';
import * as alertsService from './alerts.service.js';

export const getAlertsHandler = catchAsync(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const userId = req.user.id;

  const result = await alertsService.getUserAlerts(userId, {
    page,
    limit,
    unreadOnly
  });

  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
});

export const getUnreadCountHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const count = await alertsService.getUnreadCount(userId);

  res.status(200).json({
    success: true,
    data: {
      count
    }
  });
});

export const markAsReadHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await alertsService.markAsRead(userId, id);

  res.status(200).json({
    success: true,
    message: 'Alert marked as read'
  });
});

export const markAllAsReadHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const count = await alertsService.markAllAsRead(userId);

  res.status(200).json({
    success: true,
    message: `Marked ${count} alerts as read`,
    data: { count }
  });
});
