const DefaultIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    className="w-full h-full">
    <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"/>
  </svg>
)

export default function EmptyState({ message, icon, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <div className="w-10 h-10 text-[var(--text-muted)]">
        {icon || <DefaultIcon />}
      </div>
      <p className="text-[0.875rem] text-[var(--text-muted)]">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 px-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] text-[0.8125rem] font-semibold hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
