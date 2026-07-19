const ProgressBar = ({ label, value, percentage, color }) => (
  <div>
    <div className="flex items-center justify-between py-[14px] px-[18px] bg-[var(--bg-hover)] rounded-lg mb-1">
      <span className="text-[0.8rem] text-[var(--text-secondary)]">{label}</span>
      <span className="text-[0.9rem] font-bold text-[var(--text-primary)]">{value}</span>
    </div>
    <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden mb-2">
      <div
        className="h-full rounded-full"
        style={{ width: `${percentage}%`, backgroundColor: color }}
        aria-hidden="true"
      />
    </div>
  </div>
)

export default ProgressBar
