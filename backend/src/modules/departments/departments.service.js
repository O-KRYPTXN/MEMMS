import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

import { AppError } from '../../utils/AppError.js';

/**
 * Get all active departments for public dropdowns (Signup page)
 */
export const getPublicActiveDepartments = async () => {
  const data = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return { data };
};

/**
 * Get all departments (supports pagination and fetching all)
 */
export const getAllDepartments = async (page, limit, filters) => {
  const { search, isActive, all } = filters;

  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }

  // If 'all' is true, return the full list without pagination (useful for dropdowns)
  if (all === 'true') {
    const data = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.department.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, devices: true }
        }
      }
    }),
    prisma.department.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

/**
 * Get a single department by ID
 */
export const getDepartmentById = async (id) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, devices: true }
      }
    }
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  return department;
};

/**
 * Create a new department
 */
export const createDepartment = async (data) => {
  const { name, code } = data;

  const existing = await prisma.department.findFirst({
    where: {
      OR: [{ name }, { code }]
    }
  });

  if (existing) {
    throw new AppError('A department with this name or code already exists', 400);
  }

  return prisma.department.create({
    data: { name, code },
  });
};

/**
 * Update department details
 */
export const updateDepartment = async (id, data) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  if (data.name || data.code) {
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          data.name ? { name: data.name } : {},
          data.code ? { code: data.code } : {}
        ],
        NOT: { id }
      }
    });

    if (existing) {
      throw new DepartmentServiceError('Another department is already using this name or code', 400);
    }
  }

  return prisma.department.update({
    where: { id },
    data,
  });
};
