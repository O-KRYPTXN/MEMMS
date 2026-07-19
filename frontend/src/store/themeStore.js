import { create } from 'zustand'

const getStoredTheme = (userId) => {
  if (!userId) return 'dark'
  return localStorage.getItem(`mems_theme_${userId}`) || 'dark'
}

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

export const useThemeStore = create((set, get) => ({
  theme: 'dark',

  initTheme: (userId) => {
    const stored = getStoredTheme(userId)
    applyTheme(stored)
    set({ theme: stored })
  },

  toggleTheme: (userId) => {
    const current = get().theme
    const next = current === 'light' ? 'dark' : 'light'
    applyTheme(next)
    if (userId) {
      localStorage.setItem(`mems_theme_${userId}`, next)
    }
    set({ theme: next })
  },
}))
