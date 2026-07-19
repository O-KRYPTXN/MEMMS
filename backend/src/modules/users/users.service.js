import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';
import { createAlert } from '../alerts/alerts.service.js';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (page, limit, filters) => {
  const { role, departmentId, search, isSuspended, isActive } = filters;

  const where = {};

  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;
  
  if (isSuspended !== undefined) {
    where.isSuspended = isSuspended === 'true';
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isSuspended: true,
      isActivated: true,
      createdAt: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Create a new user (Admin bypasses registration requests)
 */
export const createUser = async (data, executorId) => {
  let { name, email, role, departmentId } = data;

  if (role === 'ADMIN') {
    departmentId = null;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('A user with this email already exists', 400);
  }

  // Generate a random temporary password for admin-created accounts
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      departmentId,
      initials,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  await logAction({
    userId: executorId,
    action: 'CREATED',
    entity: 'User',
    entityId: newUser.email,
    newValue: newUser
  });

  return newUser;
};

/**
 * Update user details
 */
export const updateUser = async (id, data, executorId) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new UserServiceError('Email is already in use by another account', 400);
    }
  }

  const updateData = { ...data };
  
  // Force departmentId to null if role is changing to ADMIN, or if they are already an ADMIN and we are not changing the role.
  if (updateData.role === 'ADMIN' || (user.role === 'ADMIN' && !updateData.role)) {
    updateData.departmentId = null;
  }

  if (data.name) {
    updateData.initials = data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // Self-demotion block
  if (id === executorId && updateData.role && updateData.role !== 'ADMIN') {
    throw new UserServiceError('You cannot demote yourself from Administrator', 400);
  }

  // Last Admin Standing Check
  if (user.role === 'ADMIN' && updateData.role && updateData.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true, isSuspended: false }
    });
    if (adminCount <= 1) {
      throw new UserServiceError('Cannot demote the final active administrator', 400);
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isSuspended: true,
    }
  });

  await logAction({
    userId: executorId,
    action: 'UPDATED',
    entity: 'User',
    entityId: user.email,
    oldValue: user,
    newValue: updated
  });

  if (user.role !== updated.role) {
    await createAlert({
      type: 'WARNING',
      title: 'Role Changed',
      subtitle: `Your role has been updated to ${updated.role}.`,
      userId: updated.id,
    });
  }

  if (user.departmentId !== updateData.departmentId) {
    await createAlert({
      type: 'INFO',
      title: 'Department Assignment Changed',
      subtitle: 'Your department assignment has been updated.',
      userId: updated.id,
    });
  }

  return updated;
};

/**
 * Update user status (isActive, isSuspended)
 */
export const updateUserStatus = async (id, statusData, executorId) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  // Prevent admin from suspending themselves
  if (id === executorId && statusData.isSuspended) {
    throw new UserServiceError('You cannot suspend your own account', 403);
  }

  // Last Admin Standing Check
  if (user.role === 'ADMIN' && statusData.isSuspended) {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true, isSuspended: false }
    });
    if (adminCount <= 1) {
      throw new UserServiceError('Cannot suspend the final active administrator', 400);
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: statusData,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isSuspended: true,
    }
  });

  let action = 'STATUS_CHANGED';
  if (statusData.isSuspended === true) action = 'SUSPENDED';
  else if (statusData.isSuspended === false) action = 'UNSUSPENDED';
  else if (statusData.isActive === false) action = 'DEACTIVATED';
  else if (statusData.isActive === true) action = 'ACTIVATED';

  await logAction({
    userId: executorId,
    action,
    entity: 'User',
    entityId: user.email,
    oldValue: { isSuspended: user.isSuspended, isActive: user.isActive },
    newValue: statusData
  });

  if (statusData.isSuspended === true && !user.isSuspended) {
    await createAlert({
      type: 'CRITICAL',
      title: 'Account Suspended',
      subtitle: 'Your account has been suspended by an administrator.',
      userId: updated.id,
    });
  } else if (statusData.isSuspended === false && user.isSuspended) {
    await createAlert({
      type: 'SUCCESS',
      title: 'Account Reactivated',
      subtitle: 'Your account suspension has been lifted.',
      userId: updated.id,
    });
  }

  return updated;
};
