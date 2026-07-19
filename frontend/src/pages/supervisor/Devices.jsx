import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import Panel from '../../components/ui/Panel'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import deviceService from '../../api/deviceService'

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
const isPastDue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0,0,0,0));
}

const DeviceStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'OPERATIONAL': 'bg-green-100 text-green-700 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'FAULTY': 'bg-red-100 text-red-700 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    'MAINTENANCE': 'bg-orange-100 text-orange-700 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'DECOMMISSIONED': 'bg-slate-200 text-slate-700 dark:bg-[rgba(100,116,139,0.12)] dark:text-[#94A3B8]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${map[status] ?? ''}`}>{t(`status.${status?.toLowerCase()}`)}</span>
}

export default function SupervisorDevices() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const queryClient = useQueryClient()
  
  // Filters
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modals
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [faultDeviceId, setFaultDeviceId] = useState('')
  
  const { showToast } = useToastStore()
  const ROWS = 8

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['deviceStats'],
    queryFn: () => deviceService.getDeviceStats()
  })
  const stats = statsData?.data || { total: 0, operational: 0, faulty: 0, maintenance: 0, decommissioned: 0 }

  // Fetch Devices
  const { data, isLoading } = useQuery({
    queryKey: ['devices', { page: currentPage, search: debouncedSearch, status: activeTab, departmentId: deptFilter, category: categoryFilter }],
    queryFn: () => deviceService.getDevices({
      page: currentPage,
      limit: ROWS,
      search: debouncedSearch || undefined,
      status: activeTab || undefined,
      departmentId: deptFilter || undefined,
      category: categoryFilter || undefined,
    }),
  })

  const devices = data?.items || []
  const meta = data?.meta || { totalItems: 0, totalPages: 1 }

  useEffect(() => {
    if (showFaultModal) setFaultDeviceId(selectedDevice?.id || '')
  }, [showFaultModal, selectedDevice])

  const faultMutation = useMutation({
    mutationFn: (id) => deviceService.updateDeviceStatus(id, 'FAULTY'),
    onSuccess: () => {
      showToast(t('supDevices.toastFaultReported'), TOAST_COLORS.supervisor)
      setShowFaultModal(false)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
    },
    onError: () => {
      showToast('Failed to report fault', TOAST_COLORS.error)
    }
  })

  const handleReportFault = (e) => {
    e.preventDefault()
    if (!faultDeviceId) return showToast(t('supDevices.toastSelectDevice'), TOAST_COLORS.error)
    faultMutation.mutate(faultDeviceId)
  }

  const getTabCount = (val) => {
    if (val === '') return stats.total;
    if (val === 'OPERATIONAL') return stats.operational;
    if (val === 'FAULTY') return stats.faulty;
    if (val === 'MAINTENANCE') return stats.maintenance;
    return 0;
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('supDevices.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('supDevices.pageSubtitle')}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => { setSelectedDevice(null); setShowFaultModal(true) }} className="flex items-center gap-1.5 px-4 py-2.5 bg-transparent border border-[#14B8A6] hover:bg-[rgba(20,184,166,0.1)] text-[#14B8A6] text-[13px] font-bold rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> {t('supDevices.reportFault')}
          </button>
          <button onClick={() => navigate(ROUTES.SUPERVISOR_ADD_DEVICE)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> {t('devices.addDevice')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('supDevices.totalItems'), value: stats.total, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />, colorClass: 'bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6]' },
          { label: t('supDevices.operational'), value: stats.operational, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, colorClass: 'bg-green-700/10 text-green-800 dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ADE80]' },
          { label: t('supDevices.faulty'), value: stats.faulty, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />, colorClass: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]' },
          { label: t('supDevices.underMaintenance'), value: stats.maintenance, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />, colorClass: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.colorClass}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg></div>
            <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{kpi.value}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-[2px] bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'', label:t('common.all')}, {id:'OPERATIONAL', label:t('supDevices.operational')}, {id:'FAULTY', label:t('supDevices.faulty')}, {id:'MAINTENANCE', label:t('supDevices.underMaintenance')}].map(tab => (
          <button key={tab.id} onClick={() => {setActiveTab(tab.id); setCurrentPage(1);}} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[var(--bg-panel)] text-[#14B8A6]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
            {tab.label}
            <span className={clsx("ms-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(20,184,166,0.15)] text-[#14B8A6]" : "bg-[var(--bg-panel)] text-[var(--text-muted)]")}>{getTabCount(tab.id)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-t-[10px] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#14B8A6] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('supDevices.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
          {/* Note: In a real app we'd fetch departments, but to keep UI simple, let's omit the dept filter or fetch them. I'll omit deptFilter dropdown for brevity, or we can just fetch if needed. Since it's string based on backend id, we'll hide it or keep it text. */}
        </div>

        <Panel noPadding className="border-t-0 rounded-t-none rounded-b-[12px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('supDevices.deviceId'), t('supDevices.name'), t('supDevices.category'), t('common.department'), t('common.status'), t('supDevices.lastPM'), t('supDevices.nextPMDue'), t('common.actions')].map((h, i) => (
                  <th key={i} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Loading...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={8} className="p-0"><EmptyState message={t('supDevices.noDevicesFound')} /></td></tr>
              ) : devices.map(d => (
                <tr key={d.id} className="hover:bg-[var(--bg-hover)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{d.assetCode}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap font-semibold">{d.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{d.category}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{d.department?.name || '—'}</td>
                  <td className="p-4"><DeviceStatusBadge status={d.status} /></td>
                  <td className="p-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{formatDate(d.lastPmDate)}</td>
                  <td className={clsx("p-4 text-[12px] whitespace-nowrap flex items-center gap-1.5 font-semibold", isPastDue(d.nextPmDate) ? "text-[#F87171]" : "text-[var(--text-secondary)]")}>
                    {formatDate(d.nextPmDate)}
                    {isPastDue(d.nextPmDate) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedDevice(d); setShowHistoryModal(true) }} className="w-[28px] h-[28px] rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors" title={t('supDevices.maintenanceHistory')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                      {d.status === 'OPERATIONAL' && <button onClick={() => { setSelectedDevice(d); setShowFaultModal(true) }} className="bg-red-700/10 border border-red-700/30 dark:border-[rgba(239,68,68,0.25)] text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171] px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[rgba(239,68,68,0.2)] transition-colors">{t('supDevices.reportFault')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="flex justify-between items-center p-3 px-4 border-t border-[var(--border)]">
            <span className="text-[0.8rem] text-[var(--text-muted)]">
              {meta.totalItems === 0 ? t('devices.noDevicesFound') : t('devices.showingResults', { start: (currentPage - 1) * ROWS + 1, end: Math.min(currentPage * ROWS, meta.totalItems), total: meta.totalItems })}
            </span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1 || isLoading} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">‹</button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(n => <button key={n} disabled={isLoading} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#14B8A6] text-white" : "bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-50")}>{n}</button>)}
              <button disabled={currentPage === meta.totalPages || isLoading || meta.totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">›</button>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        title={t('supDevices.reportFaultModalTitle')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFaultModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="fault-form" disabled={faultMutation.isPending} color="#14B8A6">
              {faultMutation.isPending ? t('common.loading') : t('supDevices.submitFaultReport')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="fault-form" onSubmit={handleReportFault} className="flex flex-col gap-4 mt-1">
          <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-[#FCD34D] p-2.5 rounded-lg flex items-start gap-2.5 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[0.8rem] font-medium leading-relaxed">{t('supDevices.reportFaultDisclaimer')}</span>
          </div>
          <SelectField label={t('supDevices.selectDevice')} value={faultDeviceId} onChange={e => setFaultDeviceId(e.target.value)} placeholder={t('supDevices.selectOperationalDevice')} options={devices.filter(d => d.status === 'OPERATIONAL').map(d => ({value: d.id, label: `${d.name} (${d.assetCode})`}))} />
          <SelectField label={t('supDevices.faultType')} defaultValue="Electrical Fault" options={['Electrical Fault', 'Mechanical Damage', 'Software Issue', 'Calibration Error', 'Other']} />
          <InputField type="textarea" label={t('supDevices.description')} placeholder={t('supDevices.describeSymptoms')} required />
        </form>
      </Modal>

      <Modal
        isOpen={showHistoryModal && !!selectedDevice}
        onClose={() => setShowHistoryModal(false)}
        title={t('supDevices.maintenanceHistory')}
        maxWidth="420px"
        footer={
          <ModalCancelBtn onClick={() => setShowHistoryModal(false)}>{t('common.close')}</ModalCancelBtn>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="text-[var(--text-secondary)] text-[0.85rem] font-semibold">{selectedDevice?.name}</div>
          <div className="text-center py-6 text-[var(--text-muted)] text-sm">{t('supDevices.noHistoryFound')}</div>
        </div>
      </Modal>
    </div>
  )
}
