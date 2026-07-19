import { useAuthStore, getHomeRoute } from '../store/authStore'

export const useAuth = () => {
  const { user, login, logout } = useAuthStore()

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    homeRoute: user ? getHomeRoute(user.role) : '/login',
    login,
    logout,
  }
}