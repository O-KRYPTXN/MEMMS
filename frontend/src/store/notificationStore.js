import { create } from 'zustand'
import { getUnreadCount } from '../api/alertsService'

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  
  setUnreadCount: (count) => set({ unreadCount: count }),

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount();
      set({ unreadCount: res.data.count });
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  },

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
}))