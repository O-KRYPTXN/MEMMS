/**
 * Frontend mirror of backend SOCKET_EVENTS constants.
 * Import from here — never hardcode event name strings.
 */
export const SOCKET_EVENTS = {
  // ── Notifications ────────────────────────────────────────────────────────
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:read-all',
  NOTIFICATION_COUNT: 'notification:count',

  // ── Fault Reports ────────────────────────────────────────────────────────
  FAULT_REPORT_CREATED: 'faultReport:created',
  FAULT_REPORT_UPDATED: 'faultReport:updated',

  // ── Work Orders ──────────────────────────────────────────────────────────
  WORK_ORDER_CREATED: 'workOrder:created',
  WORK_ORDER_ASSIGNED: 'workOrder:assigned',
  WORK_ORDER_UPDATED: 'workOrder:updated',
  WORK_ORDER_COMPLETED: 'workOrder:completed',

  // ── Devices ──────────────────────────────────────────────────────────────
  DEVICE_UPDATED: 'device:updated',
};
