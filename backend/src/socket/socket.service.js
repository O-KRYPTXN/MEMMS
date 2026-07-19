import { getIO } from './socket.server.js';

/**
 * Emit an event to a specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} payload - Data payload
 */
export const emitToUser = (userId, event, payload) => {
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit(event, payload);
  } catch (error) {
    console.error(`Socket error: Failed to emit ${event} to user_${userId}`, error);
  }
};

/**
 * Emit an event to a specific role
 * @param {string} role - Target role
 * @param {string} event - Event name
 * @param {any} payload - Data payload
 */
export const emitToRole = (role, event, payload) => {
  try {
    const io = getIO();
    io.to(`role_${role}`).emit(event, payload);
  } catch (error) {
    console.error(`Socket error: Failed to emit ${event} to role_${role}`, error);
  }
};

/**
 * Emit an event to multiple users
 * @param {string[]} userIds - Array of target user IDs
 * @param {string} event - Event name
 * @param {any} payload - Data payload
 */
export const emitToUsers = (userIds, event, payload) => {
  try {
    const io = getIO();
    const rooms = userIds.map(id => `user_${id}`);
    if (rooms.length > 0) {
      io.to(rooms).emit(event, payload);
    }
  } catch (error) {
    console.error(`Socket error: Failed to emit ${event} to multiple users`, error);
  }
};

/**
 * Emit an event to multiple roles
 * @param {string[]} roles - Array of target roles
 * @param {string} event - Event name
 * @param {any} payload - Data payload
 */
export const emitToRoles = (roles, event, payload) => {
  try {
    const io = getIO();
    const rooms = roles.map(role => `role_${role}`);
    if (rooms.length > 0) {
      io.to(rooms).emit(event, payload);
    }
  } catch (error) {
    console.error(`Socket error: Failed to emit ${event} to multiple roles`, error);
  }
};

/**
 * Emit an event to a generic list of rooms simultaneously (prevents duplicate delivery if a socket is in multiple of these rooms)
 * @param {string[]} rooms - Array of target room names
 * @param {string} event - Event name
 * @param {any} payload - Data payload
 */
export const emitToRooms = (rooms, event, payload) => {
  try {
    const io = getIO();
    if (rooms && rooms.length > 0) {
      io.to(rooms).emit(event, payload);
    }
  } catch (error) {
    console.error(`Socket error: Failed to emit ${event} to rooms`, error);
  }
};
