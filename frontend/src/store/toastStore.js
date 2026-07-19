import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toast: {
    show:  false,
    msg:   '',
    color: '#3B72F6',
  },

  showToast: (msg, color = '#3B72F6') => {
    set({ toast: { show: true, msg, color } })
    setTimeout(() => {
      set(state => ({
        toast: { ...state.toast, show: false }
      }))
    }, 3000)
  },

  hideToast: () =>
    set(state => ({
      toast: { ...state.toast, show: false }
    })),
}))

// Convenience color presets
export const TOAST_COLORS = {
  success: '#14B8A6',   // teal
  error:   '#EF4444',   // red
  warning: '#F59E0B',   // amber
  info:    '#3B72F6',   // blue
  admin:   '#3B72F6',   // blue
  supervisor: '#14B8A6',// teal
  technician: '#F59E0B',// amber
  department: '#EC4899',// pink
  store:   '#8B5CF6',   // purple
}
