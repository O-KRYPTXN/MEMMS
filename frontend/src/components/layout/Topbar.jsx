import { useMemo, useState, useRef, useEffect } from 'react'
import { useNotificationStore } from '../../store/notificationStore'
import ThemeToggle from '../ui/ThemeToggle'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import NotificationCenter from './NotificationCenter'

const Topbar = ({ title }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [showNotifications, setShowNotifications] = useState(false)
  const containerRef = useRef(null)

  const dateString = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  )

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
      <h1 className="flex-1 text-base font-bold text-[var(--text-primary)] truncate">{title}</h1>

      <ThemeToggle />
      <LanguageSwitcher />

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[17px] h-[17px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-[6px] end-[6px] w-2 h-2 rounded-full bg-[#EF4444] border-2 border-[var(--bg-sidebar)]" />
          )}
        </button>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
      </div>

      <span className="text-[0.8rem] text-[var(--text-muted)] whitespace-nowrap shrink-0">{dateString}</span>
    </header>
  )
}

export default Topbar
