import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';

/**
 * Generate a unique Asset Code (e.g. DEV-0001)
 */
const generateAssetCode = async () => {
  const latestDevice = await prisma.device.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { assetCode: true }
  });

  let nextNum = 1;
  if (latestDevice && latestDevice.assetCode.startsWith('DEV-')) {
    const numPart = parseInt(latestDevice.assetCode.split('-')[1], 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  return `DEV-${nextNum.toString().padStart(4, '0')}`;
};

/**
 * Get all devices with pagination, filtering, and search
 */
export const getAllDevices = async (page, limit, filters) => {
  const { category, status, departmentId, search, all } = filters;
  const where = {};

  if (category) where.category = category;
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { assetCode: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (all === 'true') {
    const data = await prisma.device.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    return { data };
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.device.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    }),
    prisma.device.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

/**
 * Get device statistics (total count grouped by status)
 */
export const getDeviceStats = async (departmentId = null) => {
  const where = departmentId ? { departmentId } : {};

  const [total, operational, faulty, maintenance, decommissioned] = await Promise.all([
    prisma.device.count({ where }),
    prisma.device.count({ where: { ...where, status: 'OPERATIONAL' } }),
    prisma.device.count({ where: { ...where, status: 'FAULTY' } }),
    prisma.device.count({ where: { ...where, status: 'MAINTENANCE' } }),
    prisma.device.count({ where: { ...where, status: 'DECOMMISSIONED' } })
  ]);

  return {
    total,
    operational,
    faulty,
    maintenance,
    decommissioned
  };
};

/**
 * Get a single device by ID
 */
export const getDeviceById = async (id) => {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      department: {
        select: { id: true, name: true, code: true }
      }
    }
  });

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  return device;
};

/**
 * Create a new device
 */
export const createDevice = async (data, executorId) => {
  const { serialNumber } = data;

  // Check if serial number already exists
  const existing = await prisma.device.findUnique({ where: { serialNumber } });
  if (existing) {
    throw new AppError('A device with this serial number already exists', 400);
  }

  // Generate Asset Code
  const assetCode = await generateAssetCode();

  const device = await prisma.device.create({
    data: {
      ...data,
      assetCode,
    },
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  });

  await logAction({
    userId: executorId,
    action: 'CREATED',
    entity: 'Device',
    entityId: device.assetCode,
    newValue: device
  });

  return device;
};

/**
 * Update device details
 */
export const updateDevice = async (id, data, executorId) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    throw new DeviceServiceError('Device not found', 404);
  }

  // If changing serial number, check for duplicates
  if (data.serialNumber && data.serialNumber !== device.serialNumber) {
    const existing = await prisma.device.findUnique({ where: { serialNumber: data.serialNumber } });
    if (existing) {
      throw new DeviceServiceError('A device with this serial number already exists', 400);
    }
  }

  const updated = await prisma.device.update({
    where: { id },
    data,
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  });

  await logAction({
    userId: executorId,
    action: 'UPDATED',
    entity: 'Device',
    entityId: existing.assetCode,
    oldValue: device,
    newValue: updated
  });

  return updated;
};

/**
 * Update device status
 */
export const updateDeviceStatus = async (id, status, executorId) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    throw new DeviceServiceError('Device not found', 404);
  }

  const updated = await prisma.device.update({
    where: { id },
    data: { status },
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  });

  await logAction({
    userId: executorId,
    action: status === 'DECOMMISSIONED' ? 'ARCHIVED' : 'STATUS_CHANGED',
    entity: 'Device',
    entityId: device.assetCode,
    oldValue: { status: device.status },
    newValue: { status }
  });

  return updated;
};

/**
 * Delete a device
 */
export const deleteDevice = async (id) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    throw new DeviceServiceError('Device not found', 404);
  }

  // Note: Depending on the schema, if a device has active Work Orders or PM tasks, 
  // Prisma will block the hard delete unless onDelete: Cascade is configured or we soft-delete.
  // For now, attempting a hard delete.
  try {
    await prisma.device.delete({ where: { id } });
    return true;
  } catch (err) {
    throw new DeviceServiceError('Cannot delete device because it has associated records (e.g., Work Orders). Try decommissioning it instead.', 400);
  }
};
