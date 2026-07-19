import jwt from 'jsonwebtoken';
import { getUserForMiddleware } from '../modules/auth/auth.service.js';
import { env } from '../config/env.js';

/**
 * Middleware to protect routes by verifying JWT in cookies
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in cookies
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Fetch user from database using service
      req.user = await getUserForMiddleware(decoded.userId);

      // If user no longer exists
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if role changed since token was issued
      if (decoded.role && decoded.role !== req.user.role) {
        res.cookie('jwt', '', {
          httpOnly: true,
          expires: new Date(0)
        });
        return res.status(401).json({ message: 'Session expired due to role change. Please log in again.' });
      }

      // If user is suspended, they shouldn't be allowed access
      if (req.user.isSuspended) {
        // Clear cookie if suspended
        res.cookie('jwt', '', {
          httpOnly: true,
          expires: new Date(0)
        });
        return res.status(403).json({ message: 'Not authorized, account is suspended' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

