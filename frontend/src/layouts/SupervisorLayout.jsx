import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { ROUTES } from '../constants/routes'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import ThemeToggle from '../components/ui/ThemeToggle'
import NotificationCenter from '../components/layout/NotificationCenter'
import { useQuery } from '@tanstack/react-query'
import workOrderService from '../api/workOrderService'
import faultReportService from '../api/faultReportService'

const pageTitles = {
  '/supervisor/dashboard': 'Supervisor Dashboard',
  '/supervisor/work-orders': 'Work Orders',
  '/supervisor/devices': 'Department Devices',

  '/supervisor/team': 'My Team',
  '/supervisor/profile': 'My Profile',
}

const Icon = ({ d, className = 'w-[17px] h-[17px] shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 px-5 py-2.5 border-s-[3px] text-sm transition-colors relative',
    isActive
      ? 'border-s-[#14B8A6] bg-teal-600/10 text-teal-700 dark:bg-[rgba(20,184,166,0.08)] dark:text-[#2DD4BF] font-semibold'
      : 'border-s-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
  )

const SupervisorSidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const queryParams = user?.departmentId ? { departmentId: user.departmentId } : {}
  const { data: woData } = useQuery({
    queryKey: ['workOrders', queryParams], // shares cache with Dashboard
    queryFn: () => workOrderService.getWorkOrders({ ...queryParams, limit: 1000 }),
    enabled: !!user,
  })
  const pendingApprovalsCount = (woData?.items || []).filter(wo => wo.status === 'PENDING_APPROVAL').length

  const { data: frData } = useQuery({
    queryKey: ['faultReports', 'PENDING', queryParams], // shares cache with Dashboard
    queryFn: () => faultReportService.getFaultReports({ ...queryParams, status: 'PENDING', limit: 1 }),
    enabled: !!user
  })
  const pendingFaultsCount = frData?.meta?.totalItems || 0

  return (
    <aside className="flex flex-col w-[240px] min-h-screen shrink-0 bg-[var(--bg-sidebar)] border-e border-[var(--border)]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}>
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-primary)] font-bold text-base leading-tight">MEMMS</p>
          <p className="text-[#14B8A6] font-semibold text-xs leading-tight mt-0.5">Supervisor Portal</p>
        </div>
      </div>

      <div className="mx-5 my-2.5 text-center mt-3">
        <div className="inline-block px-3 py-1.5 rounded-lg bg-teal-700/10 border border-teal-700/30 dark:border-[rgba(20,184,166,0.25)] text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6] text-[0.7rem] font-bold uppercase tracking-[0.08em]">
          TECHNICAL SUPERVISOR
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Overview</p>
          <NavLink to={ROUTES.SUPERVISOR_DASHBOARD} className={navLinkClass}>
            <Icon d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            {t('nav.dashboard')}
          </NavLink>
        </div>

        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">My Department</p>
          <NavLink to={ROUTES.SUPERVISOR_WORK_ORDERS} className={navLinkClass}>
            <Icon d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375" />
            {t('nav.workOrders')}
            {pendingApprovalsCount > 0 && (
              <span className="ms-auto flex items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)] text-[#F87171] text-[0.65rem] font-bold px-[7px] py-[1px]">
                {pendingApprovalsCount}
              </span>
            )}
          </NavLink>
          <NavLink to={ROUTES.SUPERVISOR_FAULT_REPORTS} className={navLinkClass}>
            <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            {t('nav.faultReports', 'Fault Reports')}
            {pendingFaultsCount > 0 && (
              <span className="ms-auto flex items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)] text-[#F87171] text-[0.65rem] font-bold px-[7px] py-[1px]">
                {pendingFaultsCount}
              </span>
            )}
          </NavLink>
          <NavLink to={ROUTES.SUPERVISOR_DEVICES} className={navLinkClass}>
            <Icon d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
            {t('nav.devices')}
          </NavLink>
        </div>


        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Team</p>
          <NavLink to={ROUTES.SUPERVISOR_TEAM} className={navLinkClass}>
            <Icon d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            {t('nav.team')}
          </NavLink>
        </div>

        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account</p>
          <NavLink to="/supervisor/profile" className={navLinkClass}>
            <Icon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            {t('nav.profile')}
          </NavLink>

        </div>
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full text-white text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}>
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-sm font-bold truncate">{user?.name}</p>
          <p className="text-[#14B8A6] text-xs font-semibold truncate">Technical Supervisor</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0" aria-label="Logout">
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

const SupervisorTopbar = ({ title }) => {
  const { user } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [showNotifications, setShowNotifications] = useState(false)
  const containerRef = useRef(null)
  const dateString = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 h-[60px] px-7 bg-[var(--bg-sidebar)] border-b border-[var(--border)]">
      <h1 className="text-base font-bold text-[var(--text-primary)]">{title}</h1>
      <div className="flex-1" />
      
      {user?.department?.name && (
        <div className="flex items-center justify-center bg-[rgba(20,184,166,0.12)] border border-teal-700/30 dark:border-[rgba(20,184,166,0.25)] rounded-full px-[10px] py-[4px] text-[0.72rem] font-bold text-[#14B8A6]">
          {user.department.name}
        </div>
      )}

      <ThemeToggle />
      <LanguageSwitcher />

      <div className="relative" ref={containerRef}>
        <button 
          type="button" 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0" 
          aria-label="Notifications"
        >
          <Icon d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          {unreadCount > 0 && <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#EF4444] border-2 border-[var(--bg-sidebar)]" />}
        </button>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
      </div>

      <span className="text-[0.8rem] text-[var(--text-muted)] whitespace-nowrap shrink-0">{dateString}</span>
    </header>
  )
}

const SupervisorLayout = () => {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'Supervisor Portal'

  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      <div className="hidden md:block fixed top-0 start-0 h-screen z-30">
        <SupervisorSidebar />
      </div>

      <main className="flex-1 flex flex-col min-h-screen ms-0 md:ms-[240px] bg-[var(--bg-body)]">
        <SupervisorTopbar title={pageTitle} />
        <div className="flex-1 flex flex-col gap-6 p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default SupervisorLayout
