import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useTranslation } from 'react-i18next'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import faultReportService from '../../api/faultReportService'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

export default function DeptDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToastStore()
  
  const { data: statsData } = useQuery({
    queryKey: ['faultReportStats'],
    queryFn: () => faultReportService.getFaultReportStats()
  })

  const stats = statsData?.data || {
    TOTAL: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
    SOLVED: 0
  }

  const total = stats.TOTAL || 0
  const pending = stats.PENDING || 0
  const prog = stats.IN_PROGRESS || 0
  const solved = stats.SOLVED || 0



  const kpis = [
    { label: t('deptDashboard.totalReports'), value: total, bg: 'bg-pink-900/10 dark:bg-[rgba(236,72,153,0.15)]', color: 'text-pink-900 dark:text-[#F472B6]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375"/> },
    { label: t('deptDashboard.pendingReview'), value: pending, bg: 'bg-blue-600/10 dark:bg-[rgba(59,114,246,0.15)]', color: 'text-blue-700 dark:text-[#60A5FA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 1.5h.01M2.25 12a9 9 0 1118 0 9 9 0 01-18 0z"/> },
    { label: t('deptDashboard.inProgress'), value: prog, bg: 'bg-amber-600/10 dark:bg-[rgba(245,158,11,0.15)]', color: 'text-amber-700 dark:text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 1.5h.01M2.25 12a9 9 0 1118 0 9 9 0 01-18 0z"/> },
    { label: t('deptDashboard.solvedReports'), value: solved, bg: 'bg-green-600/10 dark:bg-[rgba(34,197,94,0.15)]', color: 'text-green-700 dark:text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('deptDashboard.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('deptDashboard.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] p-[18px] flex flex-row gap-[14px] items-center">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                {kpi.icon}
              </svg>
            </div>
            <div>
              <div className="text-[1.5rem] font-[800] text-[var(--text-primary)] leading-none">{kpi.value}</div>
              <div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Panel noPadding>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[1rem] font-bold text-[var(--text-primary)]">{t('deptDashboard.quickActions')}</h2>
        </div>
        <div className="p-5 flex flex-row gap-4 flex-wrap">
          <button 
            onClick={() => navigate(ROUTES.DEPT_REQUESTS + '?new=true')} 
            className="bg-pink-900/10 border border-pink-900/25 rounded-lg px-4 py-2 text-pink-900 dark:bg-[rgba(236,72,153,0.12)] dark:text-[#F472B6] text-[0.8125rem] font-semibold hover:bg-pink-900/20 transition-colors"
          >
            {t('deptDashboard.reportProblemBtn')}
          </button>
          <button 
            onClick={() => navigate(ROUTES.DEPT_REQUESTS)} 
            className="bg-transparent border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-secondary)] text-[0.8125rem] font-semibold hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t('deptDashboard.viewAllReportsBtn')}
          </button>
        </div>
      </Panel>
    </div>
  )
}
