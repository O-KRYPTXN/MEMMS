import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';
import { createAlert } from '../alerts/alerts.service.js';

/**
 * Generate a unique Work Order Number (e.g. WO-2026-0001)
 */
const generateWorkOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `WO-${currentYear}-`;

  const latestWO = await prisma.workOrder.findFirst({
    where: {
      workOrderNumber: {
        startsWith: prefix
      }
    },
    orderBy: { createdAt: 'desc' },
    select: { workOrderNumber: true }
  });

  let nextNum = 1;
  if (latestWO && latestWO.workOrderNumber) {
    const numPart = parseInt(latestWO.workOrderNumber.split('-')[2], 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

export const createWorkOrder = async (data, user) => {
  const { deviceId, faultReportId, pmTaskId, ...rest } = data;

  // Validate device
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Validate fault report if provided
  if (faultReportId) {
    const report = await prisma.faultReport.findUnique({ where: { id: faultReportId } });
    if (!report) {
      throw new AppError('Fault report not found', 404);
    }
    if (report.deviceId !== deviceId) {
      throw new AppError('Fault report device does not match the provided device', 400);
    }
  }

  // Validate PM task if provided
  if (pmTaskId) {
    const pmTask = await prisma.pMTask.findUnique({ where: { id: pmTaskId } });
    if (!pmTask) {
      throw new AppError('PM Task not found', 404);
    }
    if (pmTask.deviceId !== deviceId) {
      throw new AppError('PM Task device does not match the provided device', 400);
    }
  }

  const workOrderNumber = await generateWorkOrderNumber();

  return prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: {
        ...rest,
        deviceId,
        faultReportId,
        pmTaskId,
        workOrderNumber,
        status: 'OPEN'
      },
      include: {
        device: true,
        assignedTo: { select: { id: true, name: true } }
      }
    });

    if (pmTaskId) {
      await tx.pMTask.update({
        where: { id: pmTaskId },
        data: { status: 'IN_PROGRESS' }
      });
    }

    if (faultReportId) {
      await tx.faultReport.update({
        where: { id: faultReportId },
        data: { status: 'IN_PROGRESS' }
      });
    }

    if (rest.type === 'REPAIR' || rest.type === 'DECOMMISSION') {
      await tx.device.update({
        where: { id: deviceId },
        data: { status: rest.type === 'REPAIR' ? 'FAULTY' : 'DECOMMISSIONED' }
      });
    }

    await logAction({
      userId: user.id,
      action: 'CREATED',
      entity: 'WorkOrder',
      entityId: wo.workOrderNumber,
      newValue: wo,
      workOrderId: wo.id,
      tx
    });

    if (assignedToId) {
      await createAlert({
        type: 'INFO',
        title: 'New Work Order Assigned',
        subtitle: `You have been assigned ${wo.workOrderNumber}`,
        userId: assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    if (rest.priority === 'HIGH' || rest.priority === 'CRITICAL') {
      await createAlert({
        type: rest.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `${rest.priority} Priority Work Order`,
        subtitle: `${wo.workOrderNumber} was created with ${rest.priority} priority`,
        targetRoles: ['SUPERVISOR', 'ADMIN'],
        workOrderId: wo.id
      }, tx);
    }

    return wo;
  });
};

export const getWorkOrders = async (page, limit, filters, user) => {
  const { status, type, deviceId, assignedToId, search } = filters;
  const where = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (deviceId) where.deviceId = deviceId;
  
  // Technician should only see assigned or relevant
  if (user.role === 'TECHNICIAN') {
    where.assignedToId = user.id;
  } else if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  if (search) {
    where.OR = [
      { workOrderNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { device: { name: { contains: search, mode: 'insensitive' } } },
      { device: { assetCode: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.workOrder.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        device: { select: { id: true, name: true, assetCode: true, department: { select: { name: true } } } },
        assignedTo: { select: { id: true, name: true, email: true } },
        faultReport: { select: { id: true, urgency: true } }
      }
    }),
    prisma.workOrder.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

export const getWorkOrderById = async (id, user) => {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      device: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      faultReport: true,
      partRequests: true,
      auditLogs: true
    }
  });

  if (!wo) {
    throw new AppError('Work order not found', 404);
  }

  if (user.role === 'TECHNICIAN' && wo.assignedToId !== user.id) {
    throw new AppError('Access denied', 403);
  }

  return wo;
};

export const updateWorkOrder = async (id, data, user) => {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) {
    throw new AppError('Work order not found', 404);
  }

  if (user.role === 'TECHNICIAN') {
    if (wo.assignedToId !== user.id) {
      throw new AppError('Access denied', 403);
    }
    
    const { status, notes } = data;
    
    // PM Work Orders can be marked DONE directly by the Technician
    if (status === 'DONE' && wo.type === 'PREVENTIVE_MAINTENANCE') {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.workOrder.update({
          where: { id },
          data: { status, notes, resolvedAt: new Date() }
        });

        if (wo.pmTaskId) {
          const pmTask = await tx.pMTask.findUnique({ where: { id: wo.pmTaskId } });
          await tx.pMTask.update({
            where: { id: wo.pmTaskId },
            data: { status: 'COMPLETED', completedAt: new Date() }
          });

          // Calculate next PM Date
          let nextPmDate = null;
          if (pmTask.recurrence) {
            const date = new Date();
            if (pmTask.recurrence === 'MONTHLY') date.setMonth(date.getMonth() + 1);
            else if (pmTask.recurrence === 'QUARTERLY') date.setMonth(date.getMonth() + 3);
            else if (pmTask.recurrence === 'SEMI_ANNUAL') date.setMonth(date.getMonth() + 6);
            else if (pmTask.recurrence === 'ANNUAL') date.setFullYear(date.getFullYear() + 1);
            nextPmDate = date;
          }

          await tx.device.update({
            where: { id: wo.deviceId },
            data: { lastPmDate: new Date(), nextPmDate }
          });
        }
        
        await logAction({
          userId: user.id,
          action: 'STATUS_CHANGED',
          entity: 'WorkOrder',
          entityId: wo.workOrderNumber,
          oldValue: wo,
          newValue: updated,
          workOrderId: id,
          tx
        });

        if (wo.pmTaskId) {
          const pmTask = await tx.pMTask.findUnique({ where: { id: wo.pmTaskId } });
          await logAction({
            userId: user.id,
            action: 'COMPLETED',
            entity: 'PMTask',
            entityId: pmTask.pmNumber,
            tx
          });
        }

        return updated;
      });
    }

    // Corrective Work Orders go to PENDING_APPROVAL
    if (status === 'DONE' && wo.type !== 'PREVENTIVE_MAINTENANCE') {
      throw new AppError('Corrective work orders require supervisor approval (use PENDING_APPROVAL)', 400);
    }

    const updateData = { status, notes };
    if (status === 'PENDING_APPROVAL' && wo.status !== 'PENDING_APPROVAL') {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData
    });

    await logAction({
      userId: user.id,
      action: 'STATUS_CHANGED',
      entity: 'WorkOrder',
      entityId: wo.workOrderNumber,
      oldValue: wo,
      newValue: updated,
      workOrderId: id
    });

    if (status === 'PENDING_APPROVAL' && wo.status !== 'PENDING_APPROVAL') {
      await createAlert({
        type: 'INFO',
        title: 'Work Order Pending Approval',
        subtitle: `${wo.workOrderNumber} is pending your review`,
        targetRoles: ['SUPERVISOR'],
        workOrderId: wo.id
      });
    }

    return updated;
  }

  return prisma.$transaction(async (tx) => {
    let updateData = { ...data };

    if (data.status === 'DONE' && wo.status !== 'DONE') {
      updateData.approvedById = user.id;
    }

    const updated = await tx.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        device: true,
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // If WO is done, update related FaultReport and Device
    if (data.status === 'DONE') {
      if (wo.faultReportId) {
        await tx.faultReport.update({
          where: { id: wo.faultReportId },
          data: { status: 'SOLVED' }
        });
      }
      
      if (updated.type === 'REPAIR' || updated.type === 'PREVENTIVE_MAINTENANCE') {
        await tx.device.update({
          where: { id: wo.deviceId },
          data: { status: 'OPERATIONAL' }
        });
      }
    }

    await logAction({
      userId: user.id,
      action: data.status === 'DONE' && wo.status !== 'DONE' ? 'COMPLETED' : 'STATUS_CHANGED',
      entity: 'WorkOrder',
      entityId: wo.workOrderNumber,
      oldValue: wo,
      newValue: updated,
      workOrderId: id,
      tx
    });

    // Handle re-assignment
    if (data.assignedToId && data.assignedToId !== wo.assignedToId) {
      await createAlert({
        type: 'INFO',
        title: 'Work Order Reassigned',
        subtitle: `${wo.workOrderNumber} has been assigned to you`,
        userId: data.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    // Handle high/critical priority change
    if (data.priority && data.priority !== wo.priority && (data.priority === 'HIGH' || data.priority === 'CRITICAL')) {
      await createAlert({
        type: data.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `${data.priority} Priority Work Order`,
        subtitle: `${wo.workOrderNumber} priority was raised to ${data.priority}`,
        targetRoles: ['SUPERVISOR', 'ADMIN'],
        workOrderId: wo.id
      }, tx);
    }

    // Handle completion
    if (data.status === 'DONE' && wo.status !== 'DONE' && updated.assignedToId) {
      await createAlert({
        type: 'SUCCESS',
        title: 'Work Order Approved',
        subtitle: `${wo.workOrderNumber} has been marked as Done`,
        userId: updated.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    // Handle cancellation
    if (data.status === 'CANCELLED' && wo.status !== 'CANCELLED' && updated.assignedToId) {
      await createAlert({
        type: 'WARNING',
        title: 'Work Order Cancelled',
        subtitle: `${wo.workOrderNumber} has been cancelled`,
        userId: updated.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    return updated;
  });
};

export const deleteWorkOrder = async (id) => {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) {
    throw new WorkOrderServiceError('Work order not found', 404);
  }

  try {
    await prisma.workOrder.delete({ where: { id } });
    return true;
  } catch (err) {
    throw new WorkOrderServiceError('Cannot delete work order due to existing references', 400);
  }
};
