import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../../prisma/prisma.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';
import { createAlert } from '../alerts/alerts.service.js';

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      department: {
        select: { name: true, code: true }
      }
    }
  });

  if (!user) {
    // Check if the user is still in the registration queue
    const request = await prisma.registrationRequest.findUnique({
      where: { email },
    });

    if (request) {
      if (request.status === 'PENDING') {
        throw new AppError('Your registration request is still pending admin approval.', 403);
      }
      if (request.status === 'REJECTED') {
        throw new AppError('Your registration request has been rejected. Please contact an administrator.', 403);
      }
    }

    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  if (user.isSuspended) {
    throw new AppError('Account is suspended', 403);
  }


  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  return user;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      initials: true,
      theme: true,
      language: true,
      departmentId: true,
      department: {
        select: { name: true, code: true }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const getUserForMiddleware = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      isActive: true,
      isSuspended: true,
    },
  });

  return user;
};

export const createRegistrationRequest = async (data) => {
  const { firstName, lastName, email, password, dbRole, department, phone } = data;

  if (dbRole === 'ADMIN') {
    throw new AppError('Signups for administrator roles are forbidden', 403);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const existingRequest = await prisma.registrationRequest.findUnique({
    where: { email },
  });

  if (existingRequest && existingRequest.status === 'PENDING') {
    throw new AppError('A registration request for this email is already pending review', 400);
  }

  const bmeRoles = ['TECHNICIAN', 'SUPERVISOR'];
  let dbDepartment = null;

  if (bmeRoles.includes(dbRole)) {
    dbDepartment = await prisma.department.findFirst({
      where: { name: 'Biomedical Engineering' },
    });
    
    if (!dbDepartment) {
      throw new AppError('Server Error: Biomedical Engineering department seed data is missing.', 500);
    }
  } else if (dbRole === 'DEPARTMENT') {
    if (!department) {
      throw new AppError('Department is required for clinical staff', 400);
    }
    
    dbDepartment = await prisma.department.findUnique({
      where: { id: department },
    });

    if (!dbDepartment || !dbDepartment.isActive) {
      throw new AppError('Invalid or inactive department specified', 400);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newRequest = await prisma.registrationRequest.upsert({
    where: { email },
    update: {
      name: `${firstName} ${lastName}`.trim(),
      passwordHash,
      phone: phone || null,
      role: dbRole,
      departmentId: dbDepartment ? dbDepartment.id : null,
      status: 'PENDING',
      submittedAt: new Date(),
      reviewedAt: null,
      userId: null
    },
    create: {
      name: `${firstName} ${lastName}`.trim(),
      email,
      passwordHash,
      phone: phone || null,
      role: dbRole,
      departmentId: dbDepartment ? dbDepartment.id : null,
      status: 'PENDING',
    },
  });

  await createAlert({
    type: 'INFO',
    title: 'New Registration Request',
    subtitle: `${newRequest.name} requested access as ${newRequest.role}`,
    targetRoles: ['ADMIN'],
  });

  return newRequest;
};

export const updateProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const updateData = {};
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email is already in use by another account', 400);
    updateData.email = data.email;
  }

  let newName = user.name;
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const currentParts = user.name.split(' ');
    const first = data.firstName !== undefined ? data.firstName : (currentParts[0] || '');
    const last = data.lastName !== undefined ? data.lastName : (currentParts.slice(1).join(' ') || '');
    newName = `${first} ${last}`.trim();
    updateData.name = newName;
    updateData.initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  if (Object.keys(updateData).length === 0) return user;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      initials: true,
      theme: true,
      language: true,
      departmentId: true,
      department: { select: { name: true, code: true } }
    }
  });

  await logAction({
    userId,
    action: 'UPDATED',
    entity: 'User',
    entityId: updatedUser.email,
    oldValue: { name: user.name, email: user.email },
    newValue: { name: updatedUser.name, email: updatedUser.email }
  });

  return updatedUser;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError('Incorrect current password', 401);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  await logAction({
    userId,
    action: 'PASSWORD_CHANGED',
    entity: 'User',
    entityId: user.email
  });

  return true;
};
