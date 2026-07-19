import prisma from '../../../prisma/prisma.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';
import { createAlert } from '../alerts/alerts.service.js';

export const getPMTasks = async (query = {}) => {
  const { status, type, departmentId, techId, limit } = query;
  
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (techId) where.assignedToId = techId;
  if (departmentId) {
    where.device = {
      departmentId
    };
  }

  const tasks = await prisma.pMTask.findMany({
    where,
    include: {
      device: {
        include: {
          department: true
        }
      },
      assignedTo: {
        select: { id: true, name: true, initials: true }
      },
      createdBy: {
        select: { id: true, name: true }
      },
      workOrder: {
        select: { id: true, workOrderNumber: true, status: true }
      }
    },
    orderBy: { scheduledAt: 'asc' },
    ...(limit ? { take: parseInt(limit) } : {})
  });

  return tasks;
};

export const getPMTaskById = async (id) => {
  const task = await prisma.pMTask.findUnique({
    where: { id },
    include: {
      device: {
        include: { department: true }
      },
      assignedTo: {
        select: { id: true, name: true, initials: true }
      },
      createdBy: {
        select: { id: true, name: true }
      },
      workOrder: true
    }
  });

  if (!task) {
    throw new AppError('PM Task not found', 404);
  }

  return task;
};

export const createPMTask = async (data, creatorId) => {
  // Generate a unique PM Number
  const count = await prisma.pMTask.count();
  const year = new Date().getFullYear();
  const pmNumber = `PM-${year}-${String(count + 1).padStart(4, '0')}`;

  const task = await prisma.pMTask.create({
    data: {
      pmNumber,
      deviceId: data.deviceId,
      type: data.type,
      recurrence: data.recurrence || null,
      scheduledAt: new Date(data.scheduledAt),
      assignedToId: data.assignedToId || null,
      notes: data.notes || null,
      createdById: creatorId,
      status: 'SCHEDULED'
    },
    include: {
      device: { include: { department: true } },
      assignedTo: { select: { id: true, name: true } }
    }
  });

  await logAction({
    userId: creatorId,
    action: 'CREATED',
    entity: 'PMTask',
    entityId: task.pmNumber,
    newValue: task
  });

  if (task.assignedToId) {
    await createAlert({
      type: 'INFO',
      title: 'New PM Task Assigned',
      subtitle: `You have been assigned ${task.pmNumber}`,
      userId: task.assignedToId,
      pmTaskId: task.id
    });
  }

  return task;
};

export const updatePMTask = async (id, data, executorId) => {
  const existing = await getPMTaskById(id);

  const updatedTask = await prisma.pMTask.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
    },
    include: {
      device: { include: { department: true } },
      assignedTo: { select: { id: true, name: true } },
      workOrder: true
    }
  });

  await logAction({
    userId: executorId,
    action: 'UPDATED',
    entity: 'PMTask',
    entityId: existing.pmNumber,
    oldValue: existing,
    newValue: updatedTask
  });

  if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
    await createAlert({
      type: 'INFO',
      title: 'PM Task Reassigned',
      subtitle: `${existing.pmNumber} has been assigned to you`,
      userId: data.assignedToId,
      pmTaskId: updatedTask.id
    });
  }

  if (data.status === 'OVERDUE' && existing.status !== 'OVERDUE') {
    await createAlert({
      type: 'WARNING',
      title: 'PM Task Overdue',
      subtitle: `${existing.pmNumber} is now overdue`,
      targetRoles: ['SUPERVISOR'],
      pmTaskId: updatedTask.id
    });
  }

  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    await createAlert({
      type: 'SUCCESS',
      title: 'PM Task Completed',
      subtitle: `${existing.pmNumber} was completed`,
      targetRoles: ['SUPERVISOR'],
      pmTaskId: updatedTask.id
    });
  }

  return updatedTask;
};

export const deletePMTask = async (id) => {
  const existing = await getPMTaskById(id);
  
  if (existing.status !== 'SCHEDULED' && existing.status !== 'CANCELLED') {
    throw new AppError('Only scheduled or cancelled PM tasks can be deleted', 400);
  }

  await prisma.pMTask.delete({
    where: { id }
  });

  return { message: 'PM Task deleted successfully' };
};
