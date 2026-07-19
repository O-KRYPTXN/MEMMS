export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DEVICES: '/admin/devices',
  ADMIN_ADD_DEVICE: '/admin/devices/add',
  ADMIN_WORK_ORDERS: '/admin/work-orders',
  ADMIN_PM: '/admin/preventive-maintenance',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_FAULT_REPORTS: '/admin/fault-reports',
  ADMIN_DEPARTMENTS: '/admin/departments',

  // Supervisor
  SUPERVISOR_DASHBOARD: '/supervisor/dashboard',
  SUPERVISOR_TEAM: '/supervisor/team',
  SUPERVISOR_WORK_ORDERS: '/supervisor/work-orders',
  SUPERVISOR_DEVICES: '/supervisor/devices',
  SUPERVISOR_ADD_DEVICE: '/supervisor/devices/add',
  SUPERVISOR_INVENTORY: '/supervisor/inventory',
  SUPERVISOR_FAULT_REPORTS: '/supervisor/fault-reports',

  // Technician
  TECH_DASHBOARD: '/technician/dashboard',
  TECH_WORK_ORDERS: '/technician/work-orders',
  TECH_DEVICES: '/technician/devices',
  TECH_NOTIFICATIONS: '/technician/notifications',
  TECH_INVENTORY: '/technician/inventory',

  // Department
  DEPT_DASHBOARD: '/department/dashboard',
  DEPT_REQUESTS: '/department/requests',



  // Shared
  PROFILE: '/profile',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
}