import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import clsx from 'clsx'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
import { useTranslation } from 'react-i18next'
import pmTaskService from '../../api/pmTaskService'
import deviceService from '../../api/deviceService'
import * as usersService from '../../api/usersService'
import workOrderService from '../../api/workOrderService'
import * as departmentsService from '../../api/departmentsService'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysUntil(dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - TODAY) / 86400000)
}

const PMTypeBadge = ({ type }) => {
  const map = {
    ROUTINE: 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#5E8FFF]',
    CALIBRATION: 'bg-purple-700/10 text-purple-800 dark:bg-[rgba(168,85,247,0.12)] dark:text-[#C084FC]',
    INSPECTION: 'bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#2DD4BF]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[type] || map.ROUTINE}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {type}
    </span>
  )
}

const PM_STATUS_MAP = {
  SCHEDULED: 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#5E8FFF]',
  OVERDUE: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
  IN_PROGRESS: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
  COMPLETED: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
  CANCELLED: 'bg-[rgba(90,106,133,0.2)] text-[#5A6A85]',
}

const PMStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${PM_STATUS_MAP[status] || ''}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
    {status.replace('_', ' ')}
  </span>
)

const DeptTag = ({ dept }) => (
  <span className="inline-block bg-[var(--bg-hover)] border border-[var(--border)] rounded-md px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
    {dept}
  </span>
)

const ROWS_PER_PAGE = 8

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const selectCls = 'h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none'
const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[13px] px-[13px] py-[10px] outline-none focus:border-[#3B72F6] placeholder:text-[var(--text-muted)]"
const labelCls = "block text-[12px] text-[var(--text-secondary)] uppercase font-semibold tracking-[0.4px] mb-1.5"

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function PreventiveMaintenance() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [calYear, setCalYear] = useState(TODAY.getFullYear())
  const [calMonth, setCalMonth] = useState(TODAY.getMonth())
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPM, setSelectedPM] = useState(null)
  
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, setValue } = useForm()

  const { data: depsData } = useQuery({
    queryKey: ['pmDependencies'],
    queryFn: async () => {
      const [devRes, uRes, dRes] = await Promise.all([
        deviceService.getDevices({ limit: 100 }),
        usersService.getUsers({ role: 'TECHNICIAN', limit: 100 }),
        departmentsService.getDepartments()
      ]);
      return { devices: devRes.items || [], techs: uRes.items || [], departments: dRes.data || [] };
    }
  });
  const { devices = [], techs = [], departments = [] } = depsData || {};

  const { data: pmData, isLoading: loading } = useQuery({
    queryKey: ['pmTasks'],
    queryFn: () => pmTaskService.getPMTasks()
  });
  const tasks = pmData?.items || [];

  const TABS = useMemo(() => [
    { label: t('common.allStatuses'), value: '' },
    { label: t('pm.scheduled'), value: 'SCHEDULED' },
    { label: t('pm.overdue'), value: 'OVERDUE' },
    { label: t('pm.inProgress'), value: 'IN_PROGRESS' },
    { label: t('pm.completed'), value: 'COMPLETED' },
  ], [t])

  const scheduledCount = tasks.filter(t => t.status === 'SCHEDULED').length
  const overdueCount = tasks.filter(t => t.status === 'OVERDUE').length
  const thisMonthCount = tasks.filter(t => {
    if (t.status !== 'COMPLETED') return false
    const d = new Date(t.completedAt || t.updatedAt)
    return d.getMonth() === TODAY.getMonth() && d.getFullYear() === TODAY.getFullYear()
  }).length
  const totalDone = tasks.filter(t => t.status === 'COMPLETED').length
  const compliance = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(pm => {
      const matchTab = !activeTab || pm.status === activeTab
      const matchType = !typeFilter || pm.type === typeFilter
      const matchDept = !deptFilter || pm.device?.department?.id === deptFilter
      const matchTech = !techFilter || pm.assignedToId === techFilter
      const matchQ = !q || [pm.pmNumber, pm.device?.name, pm.device?.department?.name].some(v => v?.toLowerCase().includes(q))
      return matchTab && matchType && matchDept && matchTech && matchQ
    })
  }, [tasks, search, activeTab, typeFilter, deptFilter, techFilter])

  useEffect(() => setCurrentPage(1), [search, activeTab, typeFilter, deptFilter, techFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filtered.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const taskMap = useMemo(() => {
    const map = {}
    tasks.forEach(pm => {
      const d = new Date(pm.scheduledAt)
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(pm)
      }
    })
    return map
  }, [tasks, calYear, calMonth])

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(pm => ['SCHEDULED', 'OVERDUE', 'IN_PROGRESS'].includes(pm.status))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 8)
  }, [tasks])

  const columns = useMemo(() => [
    { key: 'pmNumber', label: t('pm.pmId'), render: val => <span className="font-mono text-[#3B82F6] font-semibold text-xs">{val}</span> },
    { key: 'device.name', label: t('devices.deviceName'), render: (_, row) => row.device?.name || 'Unknown', primary: true },
    { key: 'device.department', label: t('users.department'), render: (_, row) => <DeptTag dept={row.device?.department?.name || '-'} /> },
    { key: 'type', label: t('pm.pmType'), render: val => <PMTypeBadge type={val} /> },
    {
      key: 'scheduledAt', label: t('pm.scheduledDate'), render: (val) => {
        const du = daysUntil(val)
        const duLabel = du === 0
          ? <span className="text-amber-600 dark:text-[#FCD34D] text-[0.72rem]">{t('admin.pm.today', 'Today')}</span>
          : du > 0
            ? <span className="text-[var(--text-muted)] text-[0.72rem]">In {du} days</span>
            : <span className="text-red-600 dark:text-[#F87171] text-[0.72rem]">{Math.abs(du)}d overdue</span>
        return <div><div>{formatDate(val)}</div><div>{duLabel}</div></div>
      }
    },
    { key: 'device.lastPmDate', label: t('pm.lastPm'), render: (_, row) => row.device?.lastPmDate ? formatDate(row.device.lastPmDate) : '-' },
    { key: 'assignedTo', label: t('pm.technician'), render: val => val ? val.name : <span className="text-[var(--text-muted)]">{t('admin.pm.unassigned', 'Unassigned')}</span> },
    { key: 'status', label: t('common.status'), render: val => <PMStatusBadge status={val} /> },
    {
      key: 'id', label: t('users.actions'), render: (val, row) => (
        <button
          onClick={e => { e.stopPropagation(); setSelectedPM(row); setShowViewModal(true) }}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )
    },
  ], [t])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        {filtered.length === 0 ? t('common.noResults') : t('common.showingResults', { start, end, total: filtered.length })}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const createMutation = useMutation({
    mutationFn: (data) => pmTaskService.createPMTask(data),
    onSuccess: () => {
      showToast('PM Task scheduled successfully!', TOAST_COLORS.success)
      setShowModal(false)
      queryClient.invalidateQueries({ queryKey: ['pmTasks'] })
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to schedule PM Task', TOAST_COLORS.error)
  })

  const onFormSubmit = (data) => createMutation.mutate(data)

  const generateWOMutation = useMutation({
    mutationFn: (pm) => workOrderService.createWorkOrder({
      deviceId: pm.deviceId,
      pmTaskId: pm.id,
      type: 'PREVENTIVE_MAINTENANCE',
      priority: 'MEDIUM',
      description: `Auto-generated from PM Task ${pm.pmNumber}`,
      assignedToId: pm.assignedToId || undefined
    }),
    onSuccess: () => {
      showToast('Work Order generated successfully!', TOAST_COLORS.success)
      setShowViewModal(false)
      queryClient.invalidateQueries({ queryKey: ['pmTasks'] })
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to generate Work Order', TOAST_COLORS.error)
  })

  const handleGenerateWO = () => {
    if (!selectedPM) return;
    generateWOMutation.mutate(selectedPM)
  };

  const openCreateModal = () => {
    reset({ deviceId: '', type: 'ROUTINE', scheduledAt: new Date().toISOString().split('T')[0], assignedToId: '', recurrence: '', notes: '' })
    setShowModal(true)
  }

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const firstDay = new Date(calYear, calMonth, 1).getDay()

    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
      <Panel padding="p-[20px] px-[24px]">
        <div className="flex justify-between items-center mb-[18px]">
          <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{t('pm.maintenanceCalendar')}</div>
          <div className="flex items-center">
            <button onClick={handlePrevMonth} className="w-[30px] h-[30px] rounded-[7px] bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center justify-center">‹</button>
            <div className="text-[0.875rem] font-semibold text-[var(--text-primary)] min-w-[130px] text-center">{MONTH_NAMES[calMonth]} {calYear}</div>
            <button onClick={handleNextMonth} className="w-[30px] h-[30px] rounded-[7px] bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center justify-center">›</button>
          </div>
        </div>

        <div className="flex gap-[16px] mb-[12px]">
          <div className="flex items-center gap-[6px]"><div className="w-[8px] h-[8px] rounded-full bg-[#5E8FFF]"></div><span className="text-[0.72rem] text-[var(--text-muted)]">{t('admin.pm.scheduled', 'Scheduled')}</span></div>
          <div className="flex items-center gap-[6px]"><div className="w-[8px] h-[8px] rounded-full bg-[#F87171]"></div><span className="text-[0.72rem] text-[var(--text-muted)]">{t('admin.pm.overdue', 'Overdue')}</span></div>
          <div className="flex items-center gap-[6px]"><div className="w-[8px] h-[8px] rounded-full bg-[#4ADE80]"></div><span className="text-[0.72rem] text-[var(--text-muted)]">{t('admin.pm.completed', 'Completed')}</span></div>
          <div className="flex items-center gap-[6px]"><div className="w-[8px] h-[8px] rounded-full bg-[#C084FC]"></div><span className="text-[0.72rem] text-[var(--text-muted)]">{t('admin.pm.calibration', 'Calibration')}</span></div>
        </div>

        <div className="grid grid-cols-7 gap-[4px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[0.68rem] font-bold text-[var(--text-muted)] uppercase py-1">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square"></div>

            const isToday = day === TODAY.getDate() && calMonth === TODAY.getMonth() && calYear === TODAY.getFullYear()
            const dayTasks = taskMap[day] || []
            const hasTasks = dayTasks.length > 0

            return (
              <div key={day} className={clsx("aspect-square rounded-[8px] min-h-[52px] flex flex-col items-center justify-start p-[6px] px-[4px]", hasTasks && "hover:bg-[rgba(59,114,246,0.08)] cursor-pointer")}>
                <div className={clsx("text-[0.8rem] font-semibold flex items-center justify-center", isToday ? "bg-[#3B72F6] text-white w-[24px] h-[24px] rounded-full" : hasTasks ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                  {day}
                </div>
                {hasTasks && (
                  <div className="flex gap-[2px] flex-wrap justify-center mt-[4px]">
                    {dayTasks.slice(0, 4).map((t, idx) => {
                      let dotColor = '#5E8FFF'
                      if (t.status === 'OVERDUE') dotColor = '#F87171'
                      else if (t.status === 'COMPLETED') dotColor = '#4ADE80'
                      else if (t.type === 'CALIBRATION') dotColor = '#C084FC'

                      return <div key={idx} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: dotColor }}></div>
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('pm.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('pm.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('pm.scheduled')} value={scheduledCount} iconVariant="blue" iconPath="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        <KPICard title={t('pm.overdue')} value={overdueCount} danger iconVariant="red" iconPath="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KPICard title={t('pm.completedThisMonth')} value={thisMonthCount} iconVariant="green" iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <div className="[&_.bg-\\[rgba\\(59\\,114\\,246\\,0\\.15\\)\\]]:bg-[rgba(20,184,166,0.15)] [&_.text-\\[\\#5E8FFF\\]]:text-[#2DD4BF]">
          <KPICard title={t('pm.complianceRate')} value={`${compliance}%`} iconVariant="blue" iconPath="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-[20px]">
        {renderCalendar()}

        <Panel noPadding className="flex flex-col max-h-[460px]">
          <PanelHeader 
            title={t('pm.upcomingOverdue')} 
            action={<span className="text-[0.75rem] text-[var(--text-muted)] font-normal">{upcomingTasks.length} tasks</span>} 
          />
          <div className="flex-1 overflow-y-auto">
            {upcomingTasks.map((t, idx) => {
              let dotColor = '#5E8FFF'
              if (t.status === 'OVERDUE') dotColor = '#F87171'
              else if (t.status === 'IN_PROGRESS') dotColor = '#FCD34D'

              const du = daysUntil(t.scheduledAt)
              const duLabel = du === 0 ? "Today" : du > 0 ? `In ${du} days` : `${Math.abs(du)}d overdue`
              const duClass = du === 0 ? 'text-amber-600 dark:text-[#FCD34D]' : du > 0 ? (du <= 3 ? 'text-amber-600 dark:text-[#FCD34D]' : 'text-green-600 dark:text-[#4ADE80]') : 'text-red-600 dark:text-[#F87171]'

              return (
                <div key={idx} className="flex gap-[12px] p-[12px] px-[18px] border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] cursor-pointer" onClick={() => { setSelectedPM(t); setShowViewModal(true) }}>
                  <div className="w-[8px] h-[8px] rounded-full mt-[5px] shrink-0" style={{ backgroundColor: dotColor }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">{t.device?.name}</div>
                    <div className="text-[0.75rem] text-[var(--text-muted)] mt-[2px]">{t.device?.department?.name || '-'} · {t.type}</div>
                  </div>
                  <div className={`text-[0.75rem] font-semibold whitespace-nowrap ${duClass}`}>
                    {duLabel}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PM#, device, department…"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          <option value="">{t('pm.pmType')}: All</option>
          <option value="ROUTINE">{t('admin.pm.typeRoutine', 'ROUTINE')}</option>
          <option value="CALIBRATION">{t('admin.pm.typeCalibration', 'CALIBRATION')}</option>
          <option value="INSPECTION">{t('admin.pm.typeInspection', 'INSPECTION')}</option>
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selectCls}>
          <option value="">{t('users.department')}: All</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className={selectCls}>
          <option value="">{t('pm.technician')}: All</option>
          {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="w-[1px] h-[20px] bg-[var(--border)]"></div>
        <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('pm.schedulePM')}
        </button>
      </div>

      <div className="flex border-b border-[var(--border)]">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => setActiveTab(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[var(--text-primary)] border-[#3B72F6]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]')}>
            {tab.label}
          </button>
        ))}
      </div>

      <Panel noPadding>
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} emptyMessage={t('common.noResults')} rowClassName={(row) => row.status === 'OVERDUE' ? 'bg-[rgba(239,68,68,0.04)] hover:bg-[rgba(239,68,68,0.08)]' : ''} />
            {renderPagination()}
          </>
        )}
        
        <Modal
          isOpen={showViewModal && !!selectedPM}
          onClose={() => setShowViewModal(false)}
          title={t('pm.pmDetails')}
          maxWidth="480px"
          footer={
            <>
              <ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>
              {selectedPM?.status === 'SCHEDULED' && !selectedPM?.workOrder && (
                <ModalPrimaryBtn color="#3B72F6" onClick={handleGenerateWO} disabled={generateWOMutation.isPending}>
                  {generateWOMutation.isPending ? t('common.loading') : 'Generate Work Order'}
                </ModalPrimaryBtn>
              )}
            </>
          }
        >
          <div className="grid grid-cols-2 gap-[16px]">
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('pm.pmId')}</div><div className="text-[13px] font-mono text-[#3B82F6] mt-1">{selectedPM?.pmNumber}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('devices.deviceName')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedPM?.device?.name}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('users.department')}</div><div className="mt-1">{selectedPM && <DeptTag dept={selectedPM.device?.department?.name || '-'} />}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('pm.pmType')}</div><div className="mt-1">{selectedPM && <PMTypeBadge type={selectedPM.type} />}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('pm.scheduledDate')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedPM && formatDate(selectedPM.scheduledAt)}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('pm.lastPm')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedPM?.device?.lastPmDate ? formatDate(selectedPM.device.lastPmDate) : '-'}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('pm.technician')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedPM?.assignedTo ? selectedPM.assignedTo.name : 'Unassigned'}</div></div>
            <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('common.status')}</div><div className="mt-1">{selectedPM && <PMStatusBadge status={selectedPM.status} />}</div></div>
            {selectedPM?.workOrder && (
               <div className="col-span-2 mt-2 p-3 bg-[rgba(59,114,246,0.05)] rounded-lg border border-[rgba(59,114,246,0.2)] flex items-center justify-between">
                 <div>
                   <div className="text-[11px] font-semibold text-[#5E8FFF] uppercase">{t('admin.pm.linkedWO', 'Linked Work Order')}</div>
                   <div className="text-[13px] font-mono font-medium text-[var(--text-primary)] mt-0.5">{selectedPM.workOrder.workOrderNumber}</div>
                 </div>
                 <div className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                   {selectedPM.workOrder.status}
                 </div>
               </div>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('pm.schedulePM')}
          maxWidth="480px"
          footer={
            <>
              <ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.cancel')}</ModalCancelBtn>
              <ModalPrimaryBtn type="submit" form="pm-form" color="#3B72F6" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.loading') : t('pm.scheduleTask')}
              </ModalPrimaryBtn>
            </>
          }
        >
          <form id="pm-form" onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
            <SelectField label={t('devices.deviceName')} name="deviceId" {...register('deviceId', { required: true })} options={devices.map(d => ({value: d.id, label: `${d.name} (${d.assetCode})`}))} required />

            <div className="grid grid-cols-2 gap-[14px]">
              <SelectField label={t('pm.pmType')} name="type" {...register('type', { required: true })} options={[{value:'ROUTINE',label:'ROUTINE'},{value:'CALIBRATION',label:'CALIBRATION'},{value:'INSPECTION',label:'INSPECTION'}]} required />
              <InputField type="date" label={t('pm.scheduledDate')} name="scheduledAt" {...register('scheduledAt', { required: true })} required />
            </div>

            <div className="grid grid-cols-2 gap-[14px]">
              <SelectField label={t('pm.assignTechnician')} name="assignedToId" {...register('assignedToId')} placeholder={t('pm.selectAssignee')} options={techs.map(t => ({value: t.id, label: t.name}))} />
              <SelectField label={t('pm.recurrence')} name="recurrence" {...register('recurrence')} placeholder="Select Recurrence" options={[{value: '', label: t('pm.oneTime')}, {value: 'MONTHLY', label: t('pm.monthly')}, {value: 'QUARTERLY', label: t('pm.quarterly')}, {value: 'SEMI_ANNUAL', label: t('pm.semiAnnual')}, {value: 'ANNUAL', label: t('pm.annual')}]} />
            </div>

            <InputField type="textarea" label={t('addDevice.notes')} name="notes" {...register('notes')} placeholder="Any special instructions…" />
          </form>
        </Modal>
      </Panel>
    </div>
  )
}
