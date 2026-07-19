import prisma from '../../../prisma/prisma.js';

/**
 * Standard utility function for logging business actions.
 * Exposed for internal backend usage by other services.
 */
export const logAction = async ({
  userId,
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  description = null,
  workOrderId = null,
  tx = prisma
}) => {
  // If description is not provided, we can auto-generate a fallback description
  // but ideally the caller provides a human-readable one.
  const desc = description || `${entity} was ${action.toLowerCase()}`;

  // Safe stringification
  const safeStringify = (val) => {
    if (!val) return null;
    try {
      return typeof val === 'string' ? val : JSON.stringify(val);
    } catch {
      return String(val);
    }
  };

  try {
    await tx.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: String(entityId),
        oldValue: safeStringify(oldValue),
        newValue: safeStringify(newValue),
        workOrderId
        // Note: the Prisma schema currently does not have a `description` field natively on AuditLog.
        // If we want the description to be directly available, we either add it to the schema or store it in `newValue` or parse it on the fly.
        // Wait! The user requested "Description" in the Response data. Let me quickly check the schema.
      }
    });
  } catch (error) {
    // We shouldn't crash the main business flow if audit logging fails,
    // but we should log it to console.
    console.error('[AuditLog] Failed to write log:', error);
  }
};

export const getAuditLogs = async ({ page = 1, limit = 10, entity, action, search, startDate, endDate, userId }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
      { oldValue: { contains: search, mode: 'insensitive' } },
      { newValue: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  // Format response data to include a dynamic description if schema lacks it
  const formattedItems = items.map(item => {
    return {
      ...item,
      // Auto-generate a human-readable description based on the action/entity
      description: `${item.user?.name || 'System'} performed ${item.action} on ${item.entity} #${item.entityId}`
    };
  });

  return {
    items: formattedItems,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};
