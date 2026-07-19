import prisma from '../../../prisma/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { emitToUser, emitToRooms } from '../../socket/socket.service.js';
import { SOCKET_EVENTS } from '../../socket/socket.events.js';

/**
 * Internal helper to create an alert and distribute it to target users.
 * 
 * @param {Object} data 
 * @param {string} data.type - AlertType (CRITICAL, WARNING, INFO, SUCCESS)
 * @param {string} data.title
 * @param {string} data.subtitle
 * @param {string} data.workOrderId
 * @param {string} data.deviceId
 * @param {string} data.pmTaskId
 * @param {string} data.faultReportId
 * @param {string} data.userId - Specific user to notify
 * @param {string[]} data.userIds - Array of specific users to notify
 * @param {string} data.targetRole - Role to broadcast to
 * @param {string[]} data.targetRoles - Array of roles to broadcast to
 * @param {Object} tx - Prisma transaction (optional)
 */
export const createAlert = async (data, tx = prisma) => {
  const { 
    type, title, subtitle, 
    workOrderId, deviceId, pmTaskId, faultReportId,
    userId, userIds = [], targetRole, targetRoles = [] 
  } = data;

  // Resolve all target roles
  const rolesToQuery = [...targetRoles];
  if (targetRole) rolesToQuery.push(targetRole);

  let roleUsers = [];
  if (rolesToQuery.length > 0) {
    roleUsers = await tx.user.findMany({
      where: { 
        role: { in: rolesToQuery },
        isActive: true, 
        isSuspended: false 
      },
      select: { id: true }
    });
  }

  // Combine and deduplicate target user IDs
  const uniqueUserIds = new Set([
    ...(userId ? [userId] : []),
    ...userIds,
    ...roleUsers.map(u => u.id)
  ]);

  if (uniqueUserIds.size === 0) return null;

  const alert = await tx.alert.create({
    data: {
      type,
      title,
      subtitle,
      workOrderId,
      deviceId,
      pmTaskId,
      faultReportId,
      userAlerts: {
        create: Array.from(uniqueUserIds).map(id => ({
          userId: id,
          isRead: false
        }))
      }
    },
    include: {
      userAlerts: true
    }
  });

  // Emit real-time socket events
  // Combining user rooms and role rooms in a single emit call prevents duplicate deliveries
  // if a user is in both targeted rooms.
  const targetRooms = [
    ...Array.from(uniqueUserIds).map(id => `user_${id}`),
    ...rolesToQuery.map(role => `role_${role}`)
  ];
  
  if (targetRooms.length > 0) {
    emitToRooms(targetRooms, SOCKET_EVENTS.NOTIFICATION_NEW, alert);
  }

  return alert;
};

/**
 * Get paginated alerts for a specific user
 */
export const getUserAlerts = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly === 'true' || unreadOnly === true ? { isRead: false } : {})
  };

  const [items, total] = await Promise.all([
    prisma.userAlert.findMany({
      where,
      include: {
        alert: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    }),
    prisma.userAlert.count({ where })
  ]);

  // Flatten the response so it looks like a single alert object to the frontend
  const formattedItems = items.map(item => ({
    id: item.alert.id, // we might want to expose userAlert id for marking as read, or just use alertId. We will use alertId.
    userAlertId: item.id,
    type: item.alert.type,
    title: item.alert.title,
    subtitle: item.alert.subtitle,
    isRead: item.isRead,
    createdAt: item.createdAt,
    readAt: item.readAt,
    workOrderId: item.alert.workOrderId,
    deviceId: item.alert.deviceId,
    pmTaskId: item.alert.pmTaskId,
    faultReportId: item.alert.faultReportId,
  }));

  return {
    items: formattedItems,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  const count = await prisma.userAlert.count({
    where: {
      userId,
      isRead: false
    }
  });
  
  return count;
};

/**
 * Mark a specific alert as read for the user
 */
export const markAsRead = async (userId, alertId) => {
  const userAlert = await prisma.userAlert.findUnique({
    where: {
      userId_alertId: {
        userId,
        alertId
      }
    }
  });

  if (!userAlert) {
    throw new AppError('Alert not found for this user', 404);
  }

  if (userAlert.isRead) {
    return userAlert;
  }

  const updated = await prisma.userAlert.update({
    where: { id: userAlert.id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ, { alertId });
  return updated;
};

/**
 * Mark all alerts as read for the user
 */
export const markAllAsRead = async (userId) => {
  const result = await prisma.userAlert.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ_ALL, {});
  return result.count;
};
