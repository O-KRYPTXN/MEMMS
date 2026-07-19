import { create } from 'zustand'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import { useThemeStore } from './themeStore'
import api from '../api/axios'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isCheckingAuth: true, // true by default so we can show a loading spinner on initial load
  error: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null })
    try {
      const response = await api.get('/auth/me')
      set({ user: response.data.user, isCheckingAuth: false })
      useThemeStore.getState().initTheme(response.data.user.id)
    } catch (error) {
      set({ user: null, isCheckingAuth: false })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/auth/login', { email, password })
      const userData = response.data.user
      set({ user: userData, isLoading: false })
      useThemeStore.getState().initTheme(userData.id)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/signup', userData)
      set({ isLoading: false })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed'
      let errors = error.response?.data?.errors || null
      set({ error: message, isLoading: false })
      return { success: false, message, errors }
    }
  },


  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.patch('/auth/me', profileData)
      const userData = response.data.user
      set({ user: userData, isLoading: false })
      return { success: true, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.patch('/auth/me/password', passwordData)
      set({ isLoading: false })
      return { success: true, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error', error)
    } finally {
      set({ user: null, isLoading: false })
    }
  },

  clearError: () => set({ error: null })
}))

// Helper: returns the home route for a given role
export const getHomeRoute = (role) => {
  const map = {
    [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    [ROLES.SUPERVISOR]: ROUTES.SUPERVISOR_DASHBOARD,
    [ROLES.TECHNICIAN]: ROUTES.TECH_DASHBOARD,
    [ROLES.DEPARTMENT]: ROUTES.DEPT_DASHBOARD,
    [ROLES.VIEWER]: ROUTES.VIEWER_REPORTS,
  }
  return map[role] ?? ROUTES.LOGIN
}