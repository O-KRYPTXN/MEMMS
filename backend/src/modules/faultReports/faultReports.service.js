import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';
import { AppError } from '../../utils/AppError.js';
import { createAlert } from '../alerts/alerts.service.js';

export const createFaultReport = async (data, userId) => {
  const { deviceId, description, urgency } = data;

  // Verify device exists and get its department
  const device = await prisma.device.findUnique({
    where: { id: deviceId }
  });

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Optional: check if user's department matches device's department
  // For safety, we will let controller verify this if needed, or do it here:
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.role === 'DEPARTMENT' && user.departmentId !== device.departmentId) {
    throw new AppError('You can only report faults for devices in your department', 403);
  }

  // Create the fault report
  const report = await prisma.faultReport.create({
    data: {
      deviceId,
      description,
      urgency: urgency || 'MEDIUM',
      submittedById: userId,
      status: 'PENDING'
    },
    include: {
      device: true
    }
  });

  await createAlert({
    type: 'WARNING',
    title: 'New Fault Report',
    subtitle: `${report.device.name} requires attention`,
    targetRoles: ['SUPERVISOR'],
    faultReportId: report.id
  });

  return report;
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
