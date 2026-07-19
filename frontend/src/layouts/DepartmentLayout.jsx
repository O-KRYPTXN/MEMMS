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

const pageTitles = {
  '/department/dashboard': 'Department Supervisor Dashboard',
  '/department/requests': 'Problem Reports',
  '/department/devices': 'Department Devices',
  '/department/profile': 'My Profile',
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
      ? 'border-s-[#BE185D] bg-pink-900/10 text-pink-900 dark:border-s-[#EC4899] dark:bg-[rgba(236,72,153,0.08)] dark:text-[#F472B6] font-semibold'
      : 'border-s-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
  )

const DeptSidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex flex-col w-[240px] min-h-screen shrink-0 bg-[var(--bg-sidebar)] border-e border-[var(--border)]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #BE185D, #9D174D)' }}>
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-primary)] font-bold text-base leading-tight">MEMMS</p>
          <p className="text-[#BE185D] dark:text-[#EC4899] font-semibold text-xs leading-tight mt-0.5">Dept Portal</p>
        </div>
      </div>

      <div className="mx-5 my-2.5 text-center mt-3">
        <div className="inline-block px-3 py-1.5 rounded-lg bg-pink-900/10 border border-pink-900/25 text-pink-900 dark:border-[rgba(236,72,153,0.25)] dark:bg-[rgba(236,72,153,0.12)] dark:text-[#F472B6] text-[0.7rem] font-bold uppercase tracking-[0.08em]">
          DEPT SUPERVISOR
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Department</p>
          <NavLink to={ROUTES.DEPT_DASHBOARD} className={navLinkClass}>
            <Icon d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to={ROUTES.DEPT_REQUESTS} className={navLinkClass}>
            <Icon d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375" />
            {t('nav.problemReports')}
          </NavLink>
        </div>

        <div className="mb-4">
          <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account</p>
          <NavLink to="/department/profile" className={navLinkClass}>
            <Icon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            {t('nav.profile')}
          </NavLink>
        </div>
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full text-white text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #BE185D, #9D174D)' }}>
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-sm font-bold truncate">{user?.name}</p>
          <p className="text-[#BE185D] dark:text-[#F472B6] text-xs font-semibold truncate">Dept Supervisor</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0" aria-label="Logout">
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

const DeptTopbar = ({ title }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [showNotifications, setShowNotifications] = useState(false)
  const containerRef = useRef(null)
  const dateString = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), [])
  const { user } = useAuthStore()

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
      {user?.department && (
        <span className="bg-pink-900/10 text-pink-900 dark:bg-[rgba(236,72,153,0.12)] dark:text-[#F472B6] px-2.5 py-1 rounded-md text-[0.7rem] font-bold tracking-wide border border-pink-900/20 dark:border-[rgba(236,72,153,0.25)]">
          {user.department.name}
        </span>
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

const DepartmentLayout = () => {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'Department Portal'

  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      <div className="hidden md:block fixed top-0 start-0 h-screen z-30">
        <DeptSidebar />
      </div>
      <main className="flex-1 flex flex-col min-h-screen ms-0 md:ms-[240px] bg-[var(--bg-body)]">
        <DeptTopbar title={pageTitle} />
        <div className="flex-1 flex flex-col gap-6 p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DepartmentLayout
