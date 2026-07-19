import { env } from '../config/env.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If the error has a statusCode property (like our AppError), use it
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Handle Prisma Specific Errors (Example: Unique constraint violation)
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'A record with that value already exists.';
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, token failed';
  }

  res.status(statusCode).json({
    message,
    // Only show stack trace in development
    stack: env.NODE_ENV === 'production' ? null : err.stack,
  });
};
