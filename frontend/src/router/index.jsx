import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES, } from '../constants/routes'
import { ROLES } from '../constants/roles'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import AdminLayout from '../layouts/AdminLayout'
import SupervisorLayout from '../layouts/SupervisorLayout'
import TechnicianLayout from '../layouts/TechnicianLayout'
import DepartmentLayout from '../layouts/DepartmentLayout'

// Auth
import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard'
import AdminDevices from '../pages/admin/Devices'
import AdminAddDevice from '../pages/admin/AddDevice'
import AdminWorkOrders from '../pages/admin/WorkOrders'
import AdminPM from '../pages/admin/PreventiveMaintenance'
import AdminUsers from '../pages/admin/Users'
import AdminReports from '../pages/admin/Reports'
import AdminAuditLogs from '../pages/admin/AuditLogs'
import AdminDepartments from '../pages/admin/Departments'

// Supervisor pages
import SupervisorDashboard from '../pages/supervisor/Dashboard'
import SupervisorTeam from '../pages/supervisor/Team'
import SupervisorWorkOrders from '../pages/supervisor/WorkOrders'
import SupervisorDevices from '../pages/supervisor/Devices'
import SupervisorAddDevice from '../pages/supervisor/AddDevice'

// Technician pages
import TechDashboard from '../pages/technician/Dashboard'
import TechWorkOrders from '../pages/technician/WorkOrders'
import TechDevices from '../pages/technician/Devices'
import TechNotifications from '../pages/technician/Notifications'

// Department pages
import DeptDashboard from '../pages/department/Dashboard'
import DeptRequests from '../pages/department/Requests'

// Shared pages
import Profile from '../pages/shared/Profile'
import NotFound from '../pages/shared/NotFound'
import Unauthorized from '../pages/shared/Unauthorized'
import SharedFaultReports from '../pages/shared/FaultReports'
import ErrorBoundry from '../components/ui/ErrorBoundry'

const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to={ROUTES.LOGIN} replace />,
    errorElement: <ErrorBoundry />,
  },

  // Public routes
  { path: ROUTES.LOGIN, element: <Login /> },
  { path: ROUTES.SIGNUP, element: <Signup /> },
  { path: ROUTES.UNAUTHORIZED, element: <Unauthorized /> },

  // Admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundry />,
    children: [
      { index: true, element: <Navigate to={ROUTES.ADMIN_DASHBOARD} replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'devices', element: <AdminDevices /> },
      { path: 'devices/add', element: <AdminAddDevice /> },
      { path: 'work-orders', element: <AdminWorkOrders /> },
      { path: 'preventive-maintenance', element: <AdminPM /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'departments', element: <AdminDepartments /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
      { path: 'fault-reports', element: <SharedFaultReports /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Supervisor routes
  {
    path: '/supervisor',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPERVISOR]}>
        <SupervisorLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundry />,
    children: [
      { index: true, element: <Navigate to={ROUTES.SUPERVISOR_DASHBOARD} replace /> },
      { path: 'dashboard', element: <SupervisorDashboard /> },
      { path: 'team', element: <SupervisorTeam /> },
      { path: 'work-orders', element: <SupervisorWorkOrders /> },
      { path: 'devices', element: <SupervisorDevices /> },
      { path: 'devices/add', element: <SupervisorAddDevice /> },
      { path: 'fault-reports', element: <SharedFaultReports /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Technician routes
  {
    path: '/technician',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]}>
        <TechnicianLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundry />,
    children: [
      { index: true, element: <Navigate to={ROUTES.TECH_DASHBOARD} replace /> },
      { path: 'dashboard', element: <TechDashboard /> },
      { path: 'work-orders', element: <TechWorkOrders /> },
      { path: 'devices', element: <TechDevices /> },
      { path: 'notifications', element: <TechNotifications /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Department routes
  {
    path: '/department',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
        <DepartmentLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundry />,
    children: [
      { index: true, element: <Navigate to={ROUTES.DEPT_DASHBOARD} replace /> },
      { path: 'dashboard', element: <DeptDashboard /> },
      { path: 'requests', element: <DeptRequests /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // 404
  { path: '*', element: <NotFound /> },
])

export default router