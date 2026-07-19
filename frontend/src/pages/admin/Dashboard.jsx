import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FaultTrendLineChart from '../../components/charts/FaultTrendLineChart'
import StatusDonutChart from '../../components/charts/StatusDonutChart'
import DevicesByDeptBarChart from '../../components/charts/DevicesByDeptBarChart'
import clsx from 'clsx'
import KPICard from '../../components/ui/KPICard'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import AlertItem from '../../components/ui/AlertItem'
import ProgressBar from '../../components/ui/ProgressBar'
import { ROUTES } from '../../constants/routes'
import { useTranslation } from 'react-i18next'
import { translateAlert } from '../../utils/translateAlert'
import { useQuery } from '@tanstack/react-query'
import { getDashboardMetrics } from '../../api/reportsService'
import { getAlerts } from '../../api/alertsService'

const statusKeyMap = {
  PENDING: 'open',
  IN_PROGRESS: 'inProgress',
  WAITING_PARTS: 'waitingParts',
  DONE: 'done',
  CANCELLED: 'cancelled',
}

const ICON_DEVICE = 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3'
const ICON_WARN = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
const ICON_WO = 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375'
const ICON_BOX = 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'

const svgIcon = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const ALERT_ICONS = {
  crit: svgIcon(ICON_WARN),
  warn: svgIcon('M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'),
  info: svgIcon('M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'),
}

const DEPT_DEVICES = [
  { name: 'ICU', count: 512, pct: 88, color: '#3B72F6' },
  { name: 'Emergency Room', count: 418, pct: 72, color: '#F59E0B' },
  { name: 'Surgery', count: 335, pct: 58, color: '#22C55E' },
  { name: 'Radiology', count: 256, pct: 44, color: '#A855F7' },
  { name: 'Cardiology', count: 187, pct: 32, color: '#EF4444' },
  { name: 'General Ward', count: 128, pct: 22, color: '#94A3B8' },
]



const linkBtn = 'text-[0.8125rem] font-semibold text-[#5E8FFF] hover:text-[#7AA3FF] cursor-pointer bg-transparent border-0'

const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [alertsCleared, setAlertsCleared] = useState(false)

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: getDashboardMetrics,
  })

  const { data: alertsRes } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ limit: 5 }),
    refetchInterval: 30000
  })
  
  const alertsData = alertsRes?.data || [];

  const woColumns = [
    { key: 'id', label: t('dashboard.woNumber'), primary: true },
    { key: 'device', label: t('dashboard.device') },
    { key: 'department', label: t('dashboard.department') },
    { key: 'priority', label: t('common.priority'), render: (val) => <StatusBadge variant={val.toLowerCase()} label={t(`priority.${val.toLowerCase()}`)} /> },
    { key: 'status', label: t('common.status'), render: (val) => <StatusBadge variant={val} label={t(`status.${statusKeyMap[val] || val.toLowerCase()}`)} /> },
  ]



  const totalWOs = metrics?.workOrdersByDept?.reduce((acc, curr) => acc + curr.value, 0) || 0;
  
  const techWorkloads = metrics?.techWorkloads || [];
  const maxTechCount = techWorkloads.length > 0 ? Math.max(...techWorkloads.map(t => t.count), 1) : 1;
  const techColors = ['#EF4444', '#F59E0B', '#3B72F6', '#22C55E', '#A855F7', '#14B8A6', '#EC4899'];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('dashboard.overview')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('dashboard.overviewSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => alert(t('admin.dashboard.pmSuccess', '12 PM Work Orders generated successfully.'))}
          className="inline-flex items-center gap-[7px] py-[9px] px-[18px] rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('dashboard.generatePM')}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-4 p-8 text-center text-[var(--text-muted)] text-sm">{t('common.loading')}</div>
        ) : (
          <>
            <KPICard title={t('dashboard.totalDevices')} value={metrics?.kpis?.totalDevices || 0} iconPath={ICON_DEVICE} iconVariant="blue" trend={{ type: 'up', text: 'Active' }} />
            <KPICard title={t('dashboard.faultRate')} value={metrics?.kpis?.faultRate || '0%'} iconPath={ICON_WARN} iconVariant="red" danger trend={{ type: 'warn', text: 'Avg' }} />
            <KPICard title={t('dashboard.openWorkOrders')} value={metrics?.kpis?.openWorkOrders || 0} iconPath={ICON_WO} iconVariant="orange" trend={{ type: 'warn', text: 'Active' }} />
            <KPICard title={t('dashboard.pmCompliance')} value={metrics?.kpis?.pmCompliance || '0%'} iconPath={ICON_BOX} iconVariant="green" trend={{ type: 'up', text: 'Target: >80%' }} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.faultTrendTitle')} subtitle={t('dashboard.faultTrendSubtitle')}
            action={<button type="button" className={linkBtn}>{t('dashboard.viewReport')}</button>} />
          <div className="p-5">
            {metrics?.faultTrend?.length > 0 ? (
              <FaultTrendLineChart data={metrics.faultTrend} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">{t('admin.dashboard.noFaults30Days', 'No fault reports during the last 30 days.')}</p>
            )}
          </div>
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.woByDeptTitle')} subtitle={t('dashboard.woByDeptSubtitle')} />
          <div className="py-5">
            {metrics?.workOrdersByDept?.length > 0 ? (
              <StatusDonutChart
                data={metrics.workOrdersByDept.map(d => ({ ...d, displayValue: totalWOs ? Math.round((d.value / totalWOs) * 100) + '%' : '0%' }))}
                centerLabel={totalWOs}
                centerSubLabel={t('dashboard.totalWOs')}
              />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">{t('admin.dashboard.noActiveWOs', 'No active work orders.')}</p>
            )}
          </div>
        </Panel>
      </div>

      {/* Work Orders + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.recentUrgentTitle')} subtitle={t('dashboard.recentUrgentSubtitle')}
            action={<button type="button" className={linkBtn} onClick={() => navigate(ROUTES.ADMIN_WORK_ORDERS)}>{t('dashboard.viewAll')}</button>} />
          {metrics?.recentUrgentWOs?.length > 0 ? (
            <DataTable columns={woColumns} data={metrics.recentUrgentWOs} />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">{t('admin.dashboard.noUrgentWOs', 'No urgent work orders.')}</p>
          )}
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.systemAlertsTitle')} subtitle={t('dashboard.systemAlertsSubtitle')}
            action={<button type="button" className={linkBtn} onClick={() => navigate('/admin/notifications')}>{t('dashboard.viewAll')}</button>} />
          {alertsCleared || alertsData.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-[var(--text-muted)]">{t('dashboard.allCaughtUp')}</p>
          ) : (
            alertsData.map((a, i) => {
              const { title, subtitle } = translateAlert(a, t);
              return (
                <AlertItem key={a.id} type={a.type.toLowerCase()} title={title} subtitle={subtitle} time={new Date(a.createdAt).toISOString()}
                  icon={ALERT_ICONS[a.type.toLowerCase()] || ALERT_ICONS.info} isLast={i === alertsData.length - 1} />
              )
            })
          )}
        </Panel>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.technicianWorkloadTitle')} subtitle={t('dashboard.technicianWorkloadSubtitle')} />
          <div className="py-4 px-5 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {techWorkloads.length > 0 ? (
              techWorkloads.map((tech, i) => (
                <ProgressBar key={tech.name} label={tech.name} value={`${tech.count} ${tech.count === 1 ? t('dashboard.task') : t('dashboard.tasks')}`}
                  percentage={Math.round((tech.count / maxTechCount) * 100)} color={techColors[i % techColors.length]} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">{t('admin.dashboard.noTechAssignments', 'No active technician assignments.')}</p>
            )}
          </div>
        </Panel>



        <Panel noPadding>
          <PanelHeader title={t('dashboard.devicesByDeptTitle')} subtitle={t('dashboard.devicesByDeptSubtitle')} />
          <div>
            {metrics?.devicesByDept?.length > 0 ? (
              <DevicesByDeptBarChart data={metrics.devicesByDept} />
            ) : (
              <p className="py-14 text-center text-sm text-[var(--text-muted)]">{t('admin.dashboard.noActiveDevices', 'No active devices.')}</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default Dashboard
