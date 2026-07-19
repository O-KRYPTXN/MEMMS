import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

/**
 * Generate JWT token and set it in a cookie
 * @param {object} res Express response object
 * @param {string} userId The user's ID
 * @param {string} role The user's role
 * @returns {string} The generated JWT token
 */
export const generateTokenAndSetCookie = (res, userId, role) => {
  const token = jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

/**
 * Map frontend string role to Prisma Enum format
 * @param {string} role The role string from frontend (e.g. "Administrator")
 * @returns {string} The Prisma Role Enum string (e.g. "ADMIN")
 */
export const mapFrontendRoleToEnum = (role) => {
  const roleMap = {
    'Supervisor': 'SUPERVISOR',
    'Technician': 'TECHNICIAN',

    'Department Supervisor': 'DEPARTMENT',
    'Administrator': 'ADMIN'
  };

  return roleMap[role] || 'TECHNICIAN';
};
