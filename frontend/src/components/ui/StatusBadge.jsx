import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

const FALLBACK = {
  bg: 'bg-slate-200 dark:bg-[rgba(148,163,184,0.12)]',
  text: 'text-slate-700 dark:text-[#94A3B8]',
  dot: 'bg-slate-500 dark:bg-[#94A3B8]',
}

const StatusBadge = ({ variant, label }) => {
  const { t } = useTranslation()
  const variantMap = {
    high: { bg: 'bg-red-100 dark:bg-[rgba(239,68,68,0.12)]', text: 'text-red-700 dark:text-[#F87171]', dot: 'bg-red-500 dark:bg-[#F87171]' },
    medium: { bg: 'bg-orange-100 dark:bg-[rgba(245,158,11,0.12)]', text: 'text-orange-700 dark:text-[#FCD34D]', dot: 'bg-orange-500 dark:bg-[#FCD34D]' },
    low: { bg: 'bg-green-100 dark:bg-[rgba(34,197,94,0.12)]', text: 'text-green-700 dark:text-[#4ADE80]', dot: 'bg-green-500 dark:bg-[#4ADE80]' },
    open: { bg: 'bg-blue-100 dark:bg-[rgba(59,114,246,0.12)]', text: 'text-blue-700 dark:text-[#5E8FFF]', dot: 'bg-blue-500 dark:bg-[#5E8FFF]' },
    progress: { bg: 'bg-orange-100 dark:bg-[rgba(245,158,11,0.12)]', text: 'text-orange-700 dark:text-[#FCD34D]', dot: 'bg-orange-500 dark:bg-[#FCD34D]' },
    done: { bg: 'bg-green-100 dark:bg-[rgba(34,197,94,0.12)]', text: 'text-green-700 dark:text-[#4ADE80]', dot: 'bg-green-500 dark:bg-[#4ADE80]' },
    waiting: { bg: 'bg-purple-100 dark:bg-[rgba(168,85,247,0.12)]', text: 'text-purple-700 dark:text-[#C084FC]', dot: 'bg-purple-500 dark:bg-[#C084FC]' },
    operational: { bg: 'bg-green-100 dark:bg-[rgba(34,197,94,0.12)]', text: 'text-green-700 dark:text-[#4ADE80]', dot: 'bg-green-500 dark:bg-[#4ADE80]' },
    faulty: { bg: 'bg-red-100 dark:bg-[rgba(239,68,68,0.12)]', text: 'text-red-700 dark:text-[#F87171]', dot: 'bg-red-500 dark:bg-[#F87171]' },
    maintenance: { bg: 'bg-orange-100 dark:bg-[rgba(245,158,11,0.12)]', text: 'text-orange-700 dark:text-[#FCD34D]', dot: 'bg-orange-500 dark:bg-[#FCD34D]' },
    decommissioned: { bg: 'bg-slate-200 dark:bg-[rgba(148,163,184,0.12)]', text: 'text-slate-700 dark:text-[#94A3B8]', dot: 'bg-slate-500 dark:bg-[#94A3B8]' },
  }

  const defaultLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    open: 'Open',
    progress: 'In Progress',
    done: 'Done',
    waiting: 'Waiting Parts',
    operational: 'Operational',
    faulty: 'Faulty',
    maintenance: 'Under Maintenance',
    decommissioned: 'Decommissioned',
  }

  const styles = variantMap[variant] ?? FALLBACK
  
  // If a label is explicitly passed and it isn't a raw translation key, use it.
  // Otherwise, attempt to translate the variant, then fallback to defaultLabels.
  const isRawKey = typeof label === 'string' && label.startsWith('status.');
  const displayLabel = (label && !isRawKey) ? label : (t(`status.${variant}`, defaultLabels[variant] ?? variant))

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[5px] py-[3px] px-[9px] rounded-full text-[0.7rem] font-semibold',
        styles.bg,
        styles.text
      )}
    >
      <span className={clsx('w-[5px] h-[5px] rounded-full shrink-0', styles.dot)} />
      {displayLabel}
    </span>
  )
}

export default StatusBadge
