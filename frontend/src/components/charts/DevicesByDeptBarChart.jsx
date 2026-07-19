import clsx from 'clsx'

export default function DevicesByDeptBarChart({ data }) {
  return (
    <div role="list">
      {data.map((d, i) => (
        <div key={d.name} role="listitem"
          className={clsx('flex items-center px-5 py-2.5 gap-2.5 border-b border-[var(--border)]', i === data.length - 1 && 'border-b-0')}
        >
          <span className="flex-1 text-[0.8125rem] text-[var(--text-secondary)]">
            {d.name}
          </span>
          <div className="w-20">
            <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.pct}%`, background: d.color }}
              />
            </div>
          </div>
          <span className="text-[0.8rem] font-bold text-[var(--text-primary)] w-8 text-right">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  )
}
