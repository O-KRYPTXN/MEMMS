import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';
import { createAlert } from '../alerts/alerts.service.js';
import { emitToRoles, emitToRooms } from '../../socket/socket.service.js';
import { SOCKET_EVENTS } from '../../socket/socket.events.js';

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

/**
 * Helper: build rooms for WO-related events.
 * Always includes SUPERVISOR + ADMIN roles; optionally a specific technician.
 */
const buildWORooms = (assignedToId = null) => {
  const rooms = ['role_SUPERVISOR', 'role_ADMIN'];
  if (assignedToId) rooms.push(`user_${assignedToId}`);
  return rooms;
};

export const createWorkOrder = async (data, user) => {
  const { deviceId, faultReportId, pmTaskId, assignedToId, ...rest } = data;

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

  const wo = await prisma.$transaction(async (tx) => {
    const created = await tx.workOrder.create({
      data: {
        ...rest,
        deviceId,
        faultReportId,
        pmTaskId,
        assignedToId,
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
      entityId: created.workOrderNumber,
      newValue: created,
      workOrderId: created.id,
      tx
    });

    if (assignedToId) {
      await createAlert({
        type: 'INFO',
        title: 'New Work Order Assigned',
        subtitle: `You have been assigned ${created.workOrderNumber}`,
        userId: assignedToId,
        workOrderId: created.id
      }, tx);
    }

    if (rest.priority === 'HIGH' || rest.priority === 'CRITICAL') {
      await createAlert({
        type: rest.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `${rest.priority} Priority Work Order`,
        subtitle: `${created.workOrderNumber} was created with ${rest.priority} priority`,
        targetRoles: ['SUPERVISOR', 'ADMIN'],
        workOrderId: created.id
      }, tx);
    }

    return created;
  });

  // ── Emit after successful transaction ────────────────────────────────────
  emitToRoles(['SUPERVISOR', 'ADMIN'], SOCKET_EVENTS.WORK_ORDER_CREATED, {
    workOrderId: wo.id
  });

  if (assignedToId) {
    // Notify the technician specifically that they have been assigned
    emitToRooms(
      buildWORooms(assignedToId),
      SOCKET_EVENTS.WORK_ORDER_ASSIGNED,
      { workOrderId: wo.id }
    );
  }

  return wo;
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

  // ── TECHNICIAN PATH ──────────────────────────────────────────────────────
  if (user.role === 'TECHNICIAN') {
    if (wo.assignedToId !== user.id) {
      throw new AppError('Access denied', 403);
    }
    
    const { status, notes } = data;
    
    // PM Work Orders can be marked DONE directly by the Technician
    if (status === 'DONE' && wo.type === 'PREVENTIVE_MAINTENANCE') {
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.workOrder.update({
          where: { id },
          data: { status, notes, resolvedAt: new Date() }
        });

        let nextPmDate = undefined;
        if (wo.pmTaskId) {
          const pmTask = await tx.pMTask.findUnique({ where: { id: wo.pmTaskId } });
          await tx.pMTask.update({
            where: { id: wo.pmTaskId },
            data: { status: 'COMPLETED', completedAt: new Date() }
          });

          // Calculate next PM Date
          if (pmTask.recurrence) {
            const date = new Date();
            if (pmTask.recurrence === 'MONTHLY') date.setMonth(date.getMonth() + 1);
            else if (pmTask.recurrence === 'QUARTERLY') date.setMonth(date.getMonth() + 3);
            else if (pmTask.recurrence === 'SEMI_ANNUAL') date.setMonth(date.getMonth() + 6);
            else if (pmTask.recurrence === 'ANNUAL') date.setFullYear(date.getFullYear() + 1);
            nextPmDate = date;
          }
        }

        await tx.device.update({
          where: { id: wo.deviceId },
          data: { 
            status: 'OPERATIONAL',
            lastPmDate: new Date(), 
            ...(nextPmDate !== undefined && { nextPmDate }) 
          }
        });
        
        await logAction({
          userId: user.id,
          action: 'STATUS_CHANGED',
          entity: 'WorkOrder',
          entityId: wo.workOrderNumber,
          oldValue: wo,
          newValue: result,
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

        return result;
      });

      // ── Emit: technician PM completed → device back to OPERATIONAL ────
      const rooms = buildWORooms(wo.assignedToId);
      emitToRooms(rooms, SOCKET_EVENTS.WORK_ORDER_COMPLETED, { workOrderId: id });
      emitToRoles(['SUPERVISOR', 'ADMIN'], SOCKET_EVENTS.DEVICE_UPDATED, { deviceId: wo.deviceId });

      return updated;
    }

    // Corrective Work Orders go to PENDING_APPROVAL
    if (status === 'DONE' && wo.type !== 'PREVENTIVE_MAINTENANCE') {
      throw new AppError('Corrective work orders require supervisor approval (use PENDING_APPROVAL)', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = { status, notes };
      if (status === 'PENDING_APPROVAL' && wo.status !== 'PENDING_APPROVAL') {
        updateData.resolvedAt = new Date();
      }

      const result = await tx.workOrder.update({
        where: { id },
        data: updateData
      });

      // Work Order transitions to IN_PROGRESS → device enters MAINTENANCE
      if (status === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') {
        const device = await tx.device.findUnique({ where: { id: wo.deviceId } });
        if (device.status !== 'MAINTENANCE') {
          await tx.device.update({
            where: { id: wo.deviceId },
            data: { status: 'MAINTENANCE' }
          });
          await logAction({
            userId: user.id,
            action: 'STATUS_CHANGED',
            entity: 'Device',
            entityId: device.assetCode,
            oldValue: device,
            newValue: { ...device, status: 'MAINTENANCE' },
            tx
          });
        }
      }

      await logAction({
        userId: user.id,
        action: 'STATUS_CHANGED',
        entity: 'WorkOrder',
        entityId: wo.workOrderNumber,
        oldValue: wo,
        newValue: result,
        workOrderId: id,
        tx
      });

      if (status === 'PENDING_APPROVAL' && wo.status !== 'PENDING_APPROVAL') {
        await createAlert({
          type: 'INFO',
          title: 'Work Order Pending Approval',
          subtitle: `${wo.workOrderNumber} is pending your review`,
          targetRoles: ['SUPERVISOR'],
          workOrderId: wo.id
        }, tx);
      }

      return result;
    });

    // ── Emit: technician status update ────────────────────────────────────
    const rooms = buildWORooms(wo.assignedToId);
    emitToRooms(rooms, SOCKET_EVENTS.WORK_ORDER_UPDATED, { workOrderId: id, status });

    if (status === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') {
      emitToRoles(['SUPERVISOR', 'ADMIN'], SOCKET_EVENTS.DEVICE_UPDATED, { deviceId: wo.deviceId });
    }

    return updated;
  }

  // ── SUPERVISOR / ADMIN PATH ───────────────────────────────────────────────
  const updated = await prisma.$transaction(async (tx) => {
    let updateData = { ...data };

    if (data.status === 'DONE' && wo.status !== 'DONE') {
      updateData.approvedById = user.id;
    }

    const result = await tx.workOrder.update({
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
      
      if (result.type === 'REPAIR' || result.type === 'PREVENTIVE_MAINTENANCE') {
        let nextPmDate = undefined;
        if (result.type === 'PREVENTIVE_MAINTENANCE' && wo.pmTaskId) {
          const pmTask = await tx.pMTask.findUnique({ where: { id: wo.pmTaskId } });
          await tx.pMTask.update({
            where: { id: wo.pmTaskId },
            data: { status: 'COMPLETED', completedAt: new Date() }
          });

          if (pmTask.recurrence) {
            const date = new Date();
            if (pmTask.recurrence === 'MONTHLY') date.setMonth(date.getMonth() + 1);
            else if (pmTask.recurrence === 'QUARTERLY') date.setMonth(date.getMonth() + 3);
            else if (pmTask.recurrence === 'SEMI_ANNUAL') date.setMonth(date.getMonth() + 6);
            else if (pmTask.recurrence === 'ANNUAL') date.setFullYear(date.getFullYear() + 1);
            nextPmDate = date;
          }
        }

        await tx.device.update({
          where: { id: wo.deviceId },
          data: { 
            status: 'OPERATIONAL',
            lastPmDate: new Date(),
            ...(nextPmDate !== undefined && { nextPmDate })
          }
        });
      }
    } else if (data.status === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') {
      const device = await tx.device.findUnique({ where: { id: wo.deviceId } });
      if (device.status !== 'MAINTENANCE') {
        await tx.device.update({
          where: { id: wo.deviceId },
          data: { status: 'MAINTENANCE' }
        });
        await logAction({
          userId: user.id,
          action: 'STATUS_CHANGED',
          entity: 'Device',
          entityId: device.assetCode,
          oldValue: device,
          newValue: { ...device, status: 'MAINTENANCE' },
          tx
        });
      }
    }

    await logAction({
      userId: user.id,
      action: data.status === 'DONE' && wo.status !== 'DONE' ? 'COMPLETED' : 'STATUS_CHANGED',
      entity: 'WorkOrder',
      entityId: wo.workOrderNumber,
      oldValue: wo,
      newValue: result,
      workOrderId: id,
      tx
    });

    // Handle re-assignment alert
    if (data.assignedToId && data.assignedToId !== wo.assignedToId) {
      await createAlert({
        type: 'INFO',
        title: 'Work Order Reassigned',
        subtitle: `${wo.workOrderNumber} has been assigned to you`,
        userId: data.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    // Handle high/critical priority change alert
    if (data.priority && data.priority !== wo.priority && (data.priority === 'HIGH' || data.priority === 'CRITICAL')) {
      await createAlert({
        type: data.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `${data.priority} Priority Work Order`,
        subtitle: `${wo.workOrderNumber} priority was raised to ${data.priority}`,
        targetRoles: ['SUPERVISOR', 'ADMIN'],
        workOrderId: wo.id
      }, tx);
    }

    // Handle completion alert to technician
    if (data.status === 'DONE' && wo.status !== 'DONE' && result.assignedToId) {
      await createAlert({
        type: 'SUCCESS',
        title: 'Work Order Approved',
        subtitle: `${wo.workOrderNumber} has been marked as Done`,
        userId: result.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    // Handle cancellation alert to technician
    if (data.status === 'CANCELLED' && wo.status !== 'CANCELLED' && result.assignedToId) {
      await createAlert({
        type: 'WARNING',
        title: 'Work Order Cancelled',
        subtitle: `${wo.workOrderNumber} has been cancelled`,
        userId: result.assignedToId,
        workOrderId: wo.id
      }, tx);
    }

    return result;
  });

  // ── Emit after successful supervisor/admin transaction ────────────────────
  const assignedId = updated.assignedToId || wo.assignedToId;
  const rooms = buildWORooms(assignedId);

  if (data.status === 'DONE' && wo.status !== 'DONE') {
    // Work order completed: also update fault report + device status
    emitToRooms(rooms, SOCKET_EVENTS.WORK_ORDER_COMPLETED, { workOrderId: id });
    emitToRoles(['SUPERVISOR', 'ADMIN'], SOCKET_EVENTS.DEVICE_UPDATED, { deviceId: wo.deviceId });
  } else if (data.assignedToId && data.assignedToId !== wo.assignedToId) {
    // Assignment changed
    const reassignRooms = buildWORooms(data.assignedToId);
    emitToRooms(reassignRooms, SOCKET_EVENTS.WORK_ORDER_ASSIGNED, { workOrderId: id });
  } else {
    // General status/data update
    emitToRooms(rooms, SOCKET_EVENTS.WORK_ORDER_UPDATED, { workOrderId: id });

    if (data.status === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') {
      emitToRoles(['SUPERVISOR', 'ADMIN'], SOCKET_EVENTS.DEVICE_UPDATED, { deviceId: wo.deviceId });
    }
  }

  return updated;
};

export const deleteWorkOrder = async (id) => {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) {
    throw new AppError('Work order not found', 404);
  }

  try {
    await prisma.workOrder.delete({ where: { id } });
    return true;
  } catch (err) {
    throw new AppError('Cannot delete work order due to existing references', 400);
  }
};
