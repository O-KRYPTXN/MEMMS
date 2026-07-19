import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, markAsRead, markAllAsRead } from '../../api/alertsService';
import { useNotificationStore } from '../../store/notificationStore';
import AlertItem from '../ui/AlertItem';
import { formatDate } from '../../utils/formatDate';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { translateAlert } from '../../utils/translateAlert';

import { useTranslation } from 'react-i18next';

const ICONS = {
  CRITICAL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  WARNING: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  INFO: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  SUCCESS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const TYPE_MAP = {
  CRITICAL: 'crit',
  WARNING: 'warn',
  INFO: 'info',
  SUCCESS: 'info'
};

const NotificationCenter = ({ onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchUnreadCount = useNotificationStore(s => s.fetchUnreadCount);
  
  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ limit: 50 }),
    refetchInterval: 30000 // refetch every 30s while open
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      fetchUnreadCount();
    }
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      fetchUnreadCount();
    }
  });

  const handleAlertClick = (alert) => {
    if (!alert.isRead) {
      markReadMutation.mutate(alert.id);
    }

    if (alert.workOrderId) {
      navigate(`/admin/work-orders?search=${alert.workOrderId}`);
    } else if (alert.pmTaskId) {
      navigate(`/admin/pm-tasks?search=${alert.pmTaskId}`);
    } else if (alert.faultReportId) {
      navigate(`/admin/fault-reports?search=${alert.faultReportId}`);

    } else if (alert.deviceId) {
      navigate(`/admin/devices?search=${alert.deviceId}`);

    }
    
    onClose();
  };

  const alerts = data?.data || [];

  return (
    <div className="absolute top-[calc(100%+8px)] end-0 w-[380px] bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">{t('nav.notifications')}</h3>
        {alerts.some(a => !a.isRead) && (
          <button 
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isLoading}
            className="text-[0.75rem] text-[#3B72F6] hover:underline font-medium"
          >
            {t('dashboard.markAllRead')}
          </button>
        )}
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">{t('common.loading')}</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-[var(--text-muted)] opacity-50 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-[var(--text-secondary)] text-sm font-medium">{t('dashboard.allCaughtUp')}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {alerts.map((alert, idx) => {
              const { title, subtitle } = translateAlert(alert, t);
              return (
                <div 
                  key={alert.userAlertId} 
                  onClick={() => handleAlertClick(alert)}
                  className={clsx(
                    "cursor-pointer transition-colors relative",
                    !alert.isRead ? "bg-[rgba(59,114,246,0.03)] hover:bg-[rgba(59,114,246,0.06)]" : "hover:bg-[var(--bg-hover)]"
                  )}
                >
                  {!alert.isRead && (
                    <div className="absolute start-0 top-0 bottom-0 w-[3px] bg-[#3B72F6]" />
                  )}
                  <AlertItem 
                    type={TYPE_MAP[alert.type] || 'info'}
                    title={title}
                    subtitle={subtitle}
                    time={formatDate(alert.createdAt)}
                    icon={ICONS[alert.type] || ICONS.INFO}
                    isLast={idx === alerts.length - 1}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
