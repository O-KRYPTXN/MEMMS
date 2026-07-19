import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function StatusDonutChart({
  data,
  size = 200,
  innerRadius = 60,
  outerRadius = 80,
  centerLabel,
  centerSubLabel = 'Total',
  showLegend = true
}) {
  return (
    <div className="relative flex flex-col items-center gap-4 w-full">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} stroke="none">
              {data.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{centerLabel}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{centerSubLabel}</div>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 w-full px-5 pb-5">
          {data.map(d => (
            <div key={d.name} className="flex justify-between items-center text-[0.8125rem]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[var(--text-secondary)]">{d.name}</span>
              </div>
              <span className="font-bold text-[var(--text-primary)]">{d.displayValue ?? d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
