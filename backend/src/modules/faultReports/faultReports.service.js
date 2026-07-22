import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';
import { AppError } from '../../utils/AppError.js';
import { createAlert } from '../alerts/alerts.service.js';

export const createFaultReport = async (data, userId) => {
  const { deviceId, description, urgency } = data;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify device exists
    const device = await tx.device.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    // 2. Check if user's department matches device's department (bypass for technicians/admins)
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (user.role === 'DEPARTMENT' && user.departmentId !== device.departmentId) {
      throw new AppError('You can only report faults for devices in your department', 403);
    }

    // 3. Prevent duplicate active fault reports
    const activeFaults = await tx.faultReport.findFirst({
      where: {
        deviceId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (activeFaults) {
      throw new AppError('This device already has an active fault report', 400);
    }

    // 4. Create the fault report
    const report = await tx.faultReport.create({
      data: {
        deviceId,
        description,
        urgency: urgency || 'MEDIUM',
        submittedById: userId,
        status: 'PENDING'
      },
      include: {
        device: true,
        submittedBy: { select: { name: true } }
      }
    });

    // 5. Update device status to FAULTY
    await tx.device.update({
      where: { id: deviceId },
      data: { status: 'FAULTY' }
    });

    // 6. Create Audit Log for Device Status Change
    await tx.auditLog.create({
      data: {
        action: 'STATUS_CHANGED',
        entity: 'Device',
        entityId: device.assetCode,
        oldValue: JSON.stringify({ status: device.status }),
        newValue: JSON.stringify({ status: 'FAULTY' }),
        userId
      }
    });

    // 7. Create Audit Log for Fault Report Created
    await tx.auditLog.create({
      data: {
        action: 'FAULT_REPORT_CREATED',
        entity: 'FaultReport',
        entityId: report.id,
        newValue: JSON.stringify({ deviceId, description, urgency }),
        userId
      }
    });

    // 8. Create Supervisor Alert
    await createAlert({
      type: 'WARNING',
      title: 'New Fault Reported',
      subtitle: `New fault reported by ${report.submittedBy?.name || 'User'} for Device ${report.device.assetCode}`,
      targetRoles: ['SUPERVISOR'],
      faultReportId: report.id
    }, tx);

    return report;
  });

  return result;
};

export const getFaultReports = async (page, limit, filters, user) => {
  const { status, deviceId, search, departmentId } = filters;
  
  const where = {};

  if (status) where.status = status;
  if (deviceId) where.deviceId = deviceId;
  
  // Scoping based on user role
  if (user.role === 'DEPARTMENT') {
    where.device = { departmentId: user.departmentId };
  } else if (departmentId) {
    where.device = { departmentId };
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { device: { name: { contains: search, mode: 'insensitive' } } },
      { id: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.faultReport.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        device: true,
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        workOrder: {
          select: { id: true, status: true, notes: true, assignedTo: { select: { name: true } } }
        }
      }
    }),
    prisma.faultReport.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

export const getFaultReportStats = async (user) => {
  const where = {};
  if (user.role === 'DEPARTMENT') {
    where.device = { departmentId: user.departmentId };
  }

  const grouped = await prisma.faultReport.groupBy({
    by: ['status'],
    where,
    _count: {
      id: true
    }
  });

  const stats = { PENDING: 0, IN_PROGRESS: 0, SOLVED: 0, REJECTED: 0, TOTAL: 0 };
  
  grouped.forEach(item => {
    stats[item.status] = item._count.id;
    stats.TOTAL += item._count.id;
  });

  return stats;
};

export const updateFaultReport = async (id, data) => {
  const report = await prisma.faultReport.findUnique({ where: { id } });
  if (!report) {
    throw new AppError('Fault report not found', 404);
  }

  const updated = await prisma.faultReport.update({
    where: { id },
    data
  });

  if (data.status === 'SOLVED' && report.status !== 'SOLVED') {
    await createAlert({
      type: 'SUCCESS',
      title: 'Fault Report Resolved',
      subtitle: `Your fault report for device #${report.deviceId} has been resolved`,
      userId: report.submittedById,
      faultReportId: report.id
    });
  }

  return updated;
};
