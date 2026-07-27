import { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../socket/socket';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useToastStore, TOAST_COLORS } from '../store/toastStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  
  const isConnected = useRef(false);

  // ── Connection lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (user && !isConnected.current) {
      socket.connect();
      isConnected.current = true;
    }

    if (!user && isConnected.current) {
      socket.disconnect();
      isConnected.current = false;
    }
  }, [user]);

  // ── Event handlers ───────────────────────────────────────────────────────
  useEffect(() => {
    // ── Connection events ────────────────────────────────────────────────
    const onConnect = () => {
      // Resynchronize stale data that may have changed while disconnected
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    const onDisconnect = () => {
      // No action needed — React Query will refetch on next window focus
    };

    // ── Notification events (existing) ──────────────────────────────────
    const onNotificationNew = (alert) => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });

      // Toast for high-priority alerts
      if (alert?.type === 'CRITICAL' || alert?.type === 'WARNING') {
        const color = alert.type === 'CRITICAL' ? TOAST_COLORS.error : TOAST_COLORS.warning;
        showToast(alert.title || 'Important Alert', color);
      }
    };

    const onNotificationRead = () => {
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    const onNotificationReadAll = () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    const onNotificationCount = (data) => {
      if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    };

    // ── Fault Report events ──────────────────────────────────────────────
    const onFaultReportCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['faultReports'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    const onFaultReportUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['faultReports'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // ── Work Order events ────────────────────────────────────────────────
    const onWorkOrderCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onWorkOrderAssigned = () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
    };

    const onWorkOrderUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onWorkOrderCompleted = () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      queryClient.invalidateQueries({ queryKey: ['faultReports'] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
      queryClient.invalidateQueries({ queryKey: ['pmTasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    };

    // ── Device events ────────────────────────────────────────────────────
    const onDeviceUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    };

    // ── Register listeners ───────────────────────────────────────────────
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
    socket.on(SOCKET_EVENTS.NOTIFICATION_READ, onNotificationRead);
    socket.on(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onNotificationReadAll);
    socket.on(SOCKET_EVENTS.NOTIFICATION_COUNT, onNotificationCount);

    socket.on(SOCKET_EVENTS.FAULT_REPORT_CREATED, onFaultReportCreated);
    socket.on(SOCKET_EVENTS.FAULT_REPORT_UPDATED, onFaultReportUpdated);

    socket.on(SOCKET_EVENTS.WORK_ORDER_CREATED, onWorkOrderCreated);
    socket.on(SOCKET_EVENTS.WORK_ORDER_ASSIGNED, onWorkOrderAssigned);
    socket.on(SOCKET_EVENTS.WORK_ORDER_UPDATED, onWorkOrderUpdated);
    socket.on(SOCKET_EVENTS.WORK_ORDER_COMPLETED, onWorkOrderCompleted);

    socket.on(SOCKET_EVENTS.DEVICE_UPDATED, onDeviceUpdated);

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);

      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
      socket.off(SOCKET_EVENTS.NOTIFICATION_READ, onNotificationRead);
      socket.off(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onNotificationReadAll);
      socket.off(SOCKET_EVENTS.NOTIFICATION_COUNT, onNotificationCount);

      socket.off(SOCKET_EVENTS.FAULT_REPORT_CREATED, onFaultReportCreated);
      socket.off(SOCKET_EVENTS.FAULT_REPORT_UPDATED, onFaultReportUpdated);

      socket.off(SOCKET_EVENTS.WORK_ORDER_CREATED, onWorkOrderCreated);
      socket.off(SOCKET_EVENTS.WORK_ORDER_ASSIGNED, onWorkOrderAssigned);
      socket.off(SOCKET_EVENTS.WORK_ORDER_UPDATED, onWorkOrderUpdated);
      socket.off(SOCKET_EVENTS.WORK_ORDER_COMPLETED, onWorkOrderCompleted);

      socket.off(SOCKET_EVENTS.DEVICE_UPDATED, onDeviceUpdated);
    };
  }, [queryClient, incrementUnread, decrementUnread, setUnreadCount, showToast]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
