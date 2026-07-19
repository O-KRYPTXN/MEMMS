import clsx from 'clsx'

export const PanelHeader = ({ title, subtitle, action, className }) => (
  <div
    className={clsx(
      'flex items-center justify-between',
      'px-5 py-4 border-b border-[var(--border)]',
      className
    )}
  >
    <div>
      <h3 className="text-[0.9rem] font-bold text-[var(--text-primary)]">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {action && (
      <div className="text-[0.75rem] font-semibold">
        {action}
      </div>
    )}
  </div>
)

const Panel = ({ children, className, noPadding = false, padding }) => (
  <div
    className={clsx(
      'bg-[var(--bg-panel)] border border-[var(--border)]',
      'rounded-xl overflow-hidden',
      !noPadding && (padding ?? 'p-5'),
      className
    )}
  >
    {children}
  </div>
)

export default Panel
