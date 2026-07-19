import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function FaultTrendLineChart({
  data,
  height = 220,
  color = '#3B72F6',
  dataKey = 'faults',
  xKey = 'day'
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="0" />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--text-secondary)' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
