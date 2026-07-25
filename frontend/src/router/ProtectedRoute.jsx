import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { useNotificationStore } from '../store/notificationStore'
import { useAuthStore } from '../store/authStore'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, user } = useAuth()
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount)
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount])

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  // Check if password change is forced
  const isForcePasswordChangePath = location.pathname === ROUTES.FORCE_PASSWORD_CHANGE

  if (user?.requiresPasswordChange && !isForcePasswordChangePath) {
    return <Navigate to={ROUTES.FORCE_PASSWORD_CHANGE} replace />
  }

  if (!user?.requiresPasswordChange && isForcePasswordChangePath) {
    return <Navigate to={ROUTES.LOGIN} replace /> // or dashboard
  }

  return children
}

export default ProtectedRoute