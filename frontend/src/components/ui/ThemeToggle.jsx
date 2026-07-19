import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => toggleTheme(user?.id)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
    >
      {isDark ? (
        /* Sun icon — shown in dark mode to switch to light */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.8} className="w-[17px] h-[17px]">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386
            6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591
            1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75
            3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
        </svg>
      ) : (
        /* Moon icon — shown in light mode to switch to dark */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.8} className="w-[17px] h-[17px]">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75
            c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597
            .748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365
            21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
