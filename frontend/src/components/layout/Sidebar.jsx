import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import * as registrationService from '../../api/registrationService'

const Icon = ({ d, className = 'w-[17px] h-[17px] shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: ROUTES.ADMIN_DASHBOARD, tKey: 'nav.dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
      { to: ROUTES.ADMIN_DEVICES, tKey: 'nav.devices', icon: 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3' },
      { to: ROUTES.ADMIN_WORK_ORDERS, tKey: 'nav.workOrders', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375' },
      { to: ROUTES.ADMIN_FAULT_REPORTS, tKey: 'nav.faultReports', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: ROUTES.ADMIN_PM, tKey: 'nav.preventiveMaintenance', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },

    ],
  },
  {
    label: 'System',
    items: [
      { to: ROUTES.ADMIN_USERS, tKey: 'nav.users', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
      { to: ROUTES.ADMIN_DEPARTMENTS, tKey: 'nav.departments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { to: ROUTES.ADMIN_REPORTS, tKey: 'nav.reports', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
      { to: '/admin/audit-logs', tKey: 'nav.auditLogs', icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z' },
      { to: '/admin/profile', tKey: 'nav.profile', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
]

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 px-5 py-2 border-s-[3px] text-sm transition-colors',
    isActive
      ? 'border-s-[#3B72F6] bg-blue-600/10 text-blue-700 dark:bg-[rgba(59,114,246,0.08)] dark:text-[#5E8FFF] font-semibold'
      : 'border-s-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
  )

const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const { data: regData } = useQuery({
    queryKey: ['adminBadge', 'registrations', 'PENDING'],
    queryFn: () => registrationService.getRegistrationRequests({ status: 'PENDING', limit: 1 }),
    enabled: !!user && user.role === 'ADMIN'
  })
  const pendingRegsCount = regData?.meta?.totalItems || 0

  return (
    <aside className="flex flex-col w-[240px] h-full shrink-0 bg-[var(--bg-sidebar)] border-e border-[var(--border)]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#3B72F6] shrink-0">
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-primary)] font-bold text-base leading-tight">MEMMS</p>
          <p className="text-[var(--text-secondary)] text-xs leading-tight mt-0.5">Medical Equip. Mgmt.</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2 last:mb-0">
            <p className="px-5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <Icon d={item.icon} />
                {t(item.tKey)}
                {item.to === ROUTES.ADMIN_USERS && pendingRegsCount > 0 && (
                  <span className="ms-auto flex items-center justify-center rounded-full bg-blue-600/15 text-blue-700 dark:bg-[rgba(59,114,246,0.15)] dark:text-[#60A5FA] text-[0.65rem] font-bold px-[7px] py-[1px]">
                    {pendingRegsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#3B72F6] text-white text-xs font-semibold shrink-0">
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-sm font-bold truncate">{user?.name}</p>
          <p className="text-[var(--text-secondary)] text-xs capitalize truncate">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          aria-label="Logout"
        >
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
