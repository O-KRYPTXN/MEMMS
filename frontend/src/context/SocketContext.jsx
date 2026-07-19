import { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../socket/socket';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useToastStore, TOAST_COLORS } from '../store/toastStore';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  
  const isConnected = useRef(false);

  useEffect(() => {
    // Connect only if user is logged in
    if (user && !isConnected.current) {
      socket.connect();
      isConnected.current = true;
    }

    // Disconnect if user logs out
    if (!user && isConnected.current) {
      socket.disconnect();
      isConnected.current = false;
    }
  }, [user]);

  useEffect(() => {
    const onConnect = () => {
      console.log('🔌 Socket connected successfully');
      // Resynchronize on reconnect
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    const onDisconnect = () => {
      console.log('🔌 Socket disconnected');
    };

    const onNotificationNew = (alert) => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });


      // Toast for high priority alerts
      if (alert?.type === 'CRITICAL' || alert?.type === 'HIGH' || alert?.type === 'WARNING') {
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotificationNew);
    socket.on('notification:read', onNotificationRead);
    socket.on('notification:read-all', onNotificationReadAll);
    socket.on('notification:count', onNotificationCount);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:read', onNotificationRead);
      socket.off('notification:read-all', onNotificationReadAll);
      socket.off('notification:count', onNotificationCount);
    };
  }, [queryClient, incrementUnread, decrementUnread, setUnreadCount, showToast]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
