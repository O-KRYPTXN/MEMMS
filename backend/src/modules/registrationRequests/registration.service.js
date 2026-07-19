import prisma from '../../../prisma/prisma.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';
import { AppError } from '../../utils/AppError.js';
import { createAlert } from '../alerts/alerts.service.js';

/**
 * Get paginated registration requests
 */
export const getRegistrationRequests = async (page, limit, filters) => {
    const { status, search } = filters;
    const where = {};

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [data, totalItems] = await Promise.all([
        prisma.registrationRequest.findMany({
            skip,
            take,
            where,
            orderBy: { submittedAt: 'desc' },
            include: {
                department: {
                    select: { name: true }
                }
            }
        }),
        prisma.registrationRequest.count({ where })
    ]);

    return formatPaginatedResponse(data, totalItems, page, limit);
};

/**
 * Approve registration request
 */
export const approveRegistration = async (id) => {
    const request = await prisma.registrationRequest.findUnique({ where: { id } });

    if (!request) {
        throw new AppError('Registration request not found', 404);
    }

    if (request.status !== 'PENDING') {
        throw new AppError(`Request is already ${request.status}`, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: request.email } });

    if (existingUser) {
        throw new AppError('A user with this email already exists', 400);
    }

    const initials = request.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const newUser = await prisma.user.create({
        data: {
            name: request.name,
            email: request.email,
            phone: request.phone,
            passwordHash: request.passwordHash,
            role: request.role,
            departmentId: request.departmentId,
            initials,
        },
    });

    await prisma.registrationRequest.update({
        where: { id },
        data: {
            status: 'APPROVED',
            userId: newUser.id,
            reviewedAt: new Date(),
        },
    });



    await createAlert({
        type: 'SUCCESS',
        title: 'Registration Approved',
        subtitle: 'Your account has been approved and is now active.',
        userId: newUser.id
    });

    return newUser;
};

/**
 * Reject registration request
 */
export const rejectRegistration = async (id, reason) => {
    const request = await prisma.registrationRequest.findUnique({ where: { id } });

    if (!request) {
        throw new AppError('Registration request not found', 404);
    }

    if (request.status !== 'PENDING') {
        throw new AppError(`Request is already ${request.status}`, 400);
    }

    await prisma.registrationRequest.update({
        where: { id },
        data: {
            status: 'DENIED',
            reviewedAt: new Date(),
        },
    });



    return request;
};
