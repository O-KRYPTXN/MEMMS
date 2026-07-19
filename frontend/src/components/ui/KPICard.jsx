import clsx from 'clsx'

const ICON_VARIANTS = {
  blue: 'bg-blue-600/15 text-blue-700 dark:bg-[rgba(59,114,246,0.15)] dark:text-[#5E8FFF]',
  red: 'bg-red-600/15 text-red-700 dark:bg-[rgba(239,68,68,0.15)] dark:text-[#F87171]',
  orange: 'bg-amber-600/15 text-amber-700 dark:bg-[rgba(245,158,11,0.15)] dark:text-[#FCD34D]',
  green: 'bg-green-600/15 text-green-700 dark:bg-[rgba(34,197,94,0.15)] dark:text-[#4ADE80]',
}

const TREND_VARIANTS = {
  up: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
  down: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
  warn: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
}

const TREND_ARROWS = {
  up: 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18',
  down: 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3',
}

const KPICard = ({
  title,
  value,
  iconPath,
  iconVariant = 'blue',
  trend,
  danger = false,
}) => {
  const showTrendIcon =
    trend && trend.type !== 'warn' && trend.showIcon !== false

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 p-5 rounded-xl border bg-[var(--bg-card)] border-[var(--border)]',
        danger && 'bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.3)]'
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={clsx(
            'flex items-center justify-center w-[38px] h-[38px] rounded-lg shrink-0',
            ICON_VARIANTS[iconVariant]
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="w-[18px] h-[18px]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>

        {trend && (
          <span
            className={clsx(
              'flex items-center gap-[3px] py-0.5 px-[7px] rounded-full text-[0.7rem] font-semibold',
              TREND_VARIANTS[trend.type]
            )}
            aria-label={trend.ariaLabel ?? trend.text}
          >
            {showTrendIcon && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-[11px] h-[11px]"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={TREND_ARROWS[trend.type]}
                />
              </svg>
            )}
            {trend.text}
          </span>
        )}
      </div>

      <div>
        <div
          className={clsx(
            'text-[1.75rem] font-extrabold leading-none text-[var(--text-primary)]',
            danger && 'text-[#F87171]'
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 text-[0.8rem] font-medium text-[var(--text-muted)]">{title}</div>
      </div>
    </div>
  )
}

export default KPICard
