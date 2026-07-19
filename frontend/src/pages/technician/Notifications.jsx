import { useEffect } from 'react'
import clsx from 'clsx'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import * as alertsService from '../../api/alertsService'
import { useNotificationStore } from '../../store/notificationStore'
import { formatDate } from '../../utils/formatDate'

import Panel from '../../components/ui/Panel'

const getTypeConfig = (type) => {
  switch (type) {
    case 'SUCCESS':
      return {
        bgIcon: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
        bgBtn: 'bg-green-700/10 border-green-700/30 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:border-[rgba(34,197,94,0.25)] dark:text-[#4ADE80] hover:bg-green-700/20 dark:hover:bg-[rgba(34,197,94,0.2)]',
        borderPanel: 'hover:border-[rgba(34,197,94,0.3)]',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      };
    case 'INFO':
      return {
        bgIcon: 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:text-[#60A5FA]',
        bgBtn: 'bg-blue-700/10 border-blue-700/30 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:border-[rgba(59,130,246,0.25)] dark:text-[#60A5FA] hover:bg-blue-700/20 dark:hover:bg-[rgba(59,130,246,0.2)]',
        borderPanel: 'hover:border-[rgba(59,130,246,0.3)]',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      };
    case 'WARNING':
      return {
        bgIcon: 'bg-amber-700/10 text-amber-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
        bgBtn: 'bg-amber-700/10 border-amber-700/30 text-amber-800 dark:bg-[rgba(245,158,11,0.12)] dark:border-[rgba(245,158,11,0.25)] dark:text-[#FCD34D] hover:bg-amber-700/20 dark:hover:bg-[rgba(245,158,11,0.2)]',
        borderPanel: 'hover:border-[rgba(245,158,11,0.3)]',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      };
    case 'CRITICAL':
      return {
        bgIcon: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
        bgBtn: 'bg-red-700/10 border-red-700/30 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:border-[rgba(239,68,68,0.25)] dark:text-[#F87171] hover:bg-red-700/20 dark:hover:bg-[rgba(239,68,68,0.2)]',
        borderPanel: 'hover:border-[rgba(239,68,68,0.3)]',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      };
    default:
      return {
        bgIcon: 'bg-gray-500/10 text-gray-800 dark:bg-[rgba(156,163,175,0.12)] dark:text-[#D1D5DB]',
        bgBtn: 'bg-gray-500/10 border-gray-500/30 text-gray-800 dark:bg-[rgba(156,163,175,0.12)] dark:border-[rgba(156,163,175,0.25)] dark:text-[#D1D5DB] hover:bg-gray-500/20 dark:hover:bg-[rgba(156,163,175,0.2)]',
        borderPanel: 'hover:border-[rgba(156,163,175,0.3)]',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      };
  }
}

export default function TechnicianNotifications() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const decrementUnread = useNotificationStore(state => state.decrementUnread)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts', { unreadOnly: true }],
    queryFn: () => alertsService.getAlerts({ unreadOnly: true, limit: 50 })
  })

  useEffect(() => {
    if (isError) {
      showToast(t('common.errorOccurred', 'An error occurred loading notifications'), TOAST_COLORS.error)
    }
  }, [isError, showToast, t])

  const markAsReadMutation = useMutation({
    mutationFn: alertsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      decrementUnread()
      showToast(t('techNotifications.toastMarkedRead', 'Notification marked as read'), TOAST_COLORS.success)
    },
    onError: () => {
      showToast(t('common.errorOccurred', 'An error occurred'), TOAST_COLORS.error)
    }
  })

  const handleAcknowledge = (e, id) => {
    e.stopPropagation()
    markAsReadMutation.mutate(id)
  }

  const handleNavigate = (alert) => {
    if (alert.workOrderId) navigate(ROUTES.TECH_WORK_ORDERS)

    else if (alert.deviceId) navigate(ROUTES.TECH_DEVICES)
  }

  const unreadNotifications = data?.data || []

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techNotifications.pageTitle', 'Notifications')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techNotifications.pageSubtitle', 'Review your recent alerts and updates')}</p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <Panel className="text-center py-12 text-[var(--text-muted)]">
            {t('common.loading', 'Loading...')}
          </Panel>
        ) : unreadNotifications.length === 0 ? (
          <Panel className="text-center py-12 text-[var(--text-muted)] flex flex-col items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-[var(--text-muted)] opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[0.9rem] font-semibold">{t('techNotifications.allCaughtUp', "You're all caught up. No unread notifications.")}</p>
          </Panel>
        ) : (
          unreadNotifications.map(alert => {
            const config = getTypeConfig(alert.type)
            const isClickable = !!(alert.workOrderId || alert.deviceId)
            
            return (
            <Panel 
              key={alert.id} 
              className={clsx(
                "p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-colors",
                config.borderPanel,
                isClickable && "cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
              )}
              onClick={() => isClickable && handleNavigate(alert)}
            >
              <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0", config.bgIcon)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">{config.icon}</svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[1.05rem] font-bold text-[var(--text-primary)] mb-1">{alert.title}</h3>
                <p className="text-[0.85rem] text-[var(--text-secondary)] leading-relaxed">
                  {alert.subtitle}
                </p>
                <div className="text-[0.7rem] text-[var(--text-muted)] font-bold tracking-wide uppercase mt-3">
                  {formatDate(alert.createdAt, 'MMM DD, YYYY HH:mm')}
                </div>
              </div>

              <button 
                onClick={(e) => handleAcknowledge(e, alert.id)} 
                disabled={markAsReadMutation.isPending}
                className={clsx(
                  "border px-4 py-2 rounded-lg text-[0.8rem] font-bold transition-colors shrink-0 w-full sm:w-auto",
                  config.bgBtn,
                  markAsReadMutation.isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                {t('techNotifications.acknowledge', 'Acknowledge')}
              </button>
            </Panel>
          )})
        )}
      </div>
    </div>
  )
}
