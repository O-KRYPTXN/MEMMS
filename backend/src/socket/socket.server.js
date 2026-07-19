import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../../prisma/prisma.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173', // Exact match for credentials
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) return next(new Error('Authentication error: No cookies'));

      // Parse jwt cookie
      const match = cookieHeader.match(/(^| )jwt=([^;]+)/);
      const token = match ? match[2] : null;

      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true, isSuspended: true }
      });

      if (!user || !user.isActive || user.isSuspended) {
        return next(new Error('Authentication error: User inactive or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      if (env.NODE_ENV !== 'production') {
        console.error('Socket authentication failed:', err.message);
      }
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    
    // Automatically join rooms
    socket.join(`user_${user.id}`);
    socket.join(`role_${user.role}`);
    
    if (env.NODE_ENV !== 'production') {
      console.log(`🔌 Socket connected: ${user.id} (${user.role})`);
    }

    socket.on('disconnect', () => {
      if (env.NODE_ENV !== 'production') {
        console.log(`🔌 Socket disconnected: ${user.id}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
