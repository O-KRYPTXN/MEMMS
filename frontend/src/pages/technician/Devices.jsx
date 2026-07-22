import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import deviceService from '../../api/deviceService'
import faultReportService from '../../api/faultReportService'

const isPastDue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const DeviceStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'OPERATIONAL': 'bg-green-100 text-green-700 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'FAULTY': 'bg-red-100 text-red-700 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    'MAINTENANCE': 'bg-orange-100 text-orange-700 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'DECOMMISSIONED': 'bg-slate-200 text-slate-700 dark:bg-[rgba(100,116,139,0.12)] dark:text-[#94A3B8]',
  }
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold", map[status])}>
      {t(`status.${status?.toLowerCase()}`)}
    </span>
  )
}

export default function TechDevices() {
  const { t } = useTranslation()
  
  const queryClient = useQueryClient()
  
  
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [showManualsModal, setShowManualsModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  
  const [faultDesc, setFaultDesc] = useState('')
  const [faultUrgency, setFaultUrgency] = useState('MEDIUM')
  
  const { showToast } = useToastStore()
  const ROWS = 10

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['devices', { page: currentPage, search: debouncedSearch }],
    queryFn: () => deviceService.getDevices({
      page: currentPage,
      limit: ROWS,
      search: debouncedSearch || undefined,
    }),
  })

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['deviceHistory', selectedDevice?.id],
    queryFn: () => deviceService.getDeviceById(selectedDevice.id),
    enabled: !!selectedDevice && showHistoryModal,
  })
  const historyList = historyData?.data?.workOrders || []

  const devices = data?.items || []
  const meta = data?.meta || { totalItems: 0, totalPages: 1 }

  const faultMutation = useMutation({
    mutationFn: (data) => faultReportService.createFaultReport(data),
    onSuccess: () => {
      showToast(t('common.toastFaultLogged', { id: selectedDevice?.assetCode }), TOAST_COLORS.technician)
      setShowFaultModal(false)
      setFaultDesc('')
      setFaultUrgency('MEDIUM')
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to report fault', TOAST_COLORS.error)
    }
  })

  const handleReportFault = (e) => {
    e.preventDefault()
    if (!selectedDevice || !faultDesc.trim()) return
    faultMutation.mutate({
      deviceId: selectedDevice.id,
      description: faultDesc,
      urgency: faultUrgency
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techDevices.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techDevices.pageSubtitle')}</p>
      </div>

      <Panel noPadding className="flex flex-col">
        <div className="border-b border-[var(--border)] p-4 flex items-center">
          <div className="flex items-center gap-2 w-full max-w-[280px] h-[36px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techDevices.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('techDevices.id'), t('techDevices.deviceInfo'), t('techDevices.department'), t('techDevices.status'), t('techDevices.lastMaintenance'), t('techDevices.nextPM', 'Next PM'), t('techDevices.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr><td colSpan={7} className="p-10 text-center text-[var(--text-muted)]">Loading...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={7} className="p-0"><EmptyState message={t('techDevices.noDevicesFound')} /></td></tr>
              ) : devices.map(d => (
                <tr key={d.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{d.assetCode}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{d.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{d.department?.name || '—'}</td>
                  <td className="p-4"><DeviceStatusBadge status={d.status} /></td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(d.lastPmDate)}</td>
                  <td className={clsx("p-4 text-[12px] whitespace-nowrap", isPastDue(d.nextPmDate) ? "text-[#F87171] font-bold" : "text-[var(--text-muted)]")}>{formatDate(d.nextPmDate)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedDevice(d); setShowHistoryModal(true) }} className="w-[28px] h-[28px] rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors" title={t('devices.maintenanceHistory', 'Maintenance History')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                      <button disabled={d.status === 'FAULTY'} onClick={() => { setSelectedDevice(d); setShowFaultModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600 border-red-200 hover:bg-red-50 dark:text-[#F87171] dark:border-[rgba(239,68,68,0.3)] dark:hover:bg-[rgba(239,68,68,0.1)]">{t('common.reportFault', 'Report Fault')}</button>
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
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(n => <button key={n} disabled={isLoading} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#F59E0B] text-white" : "bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-50")}>{n}</button>)}
            <button disabled={currentPage === meta.totalPages || isLoading || meta.totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">›</button>
          </div>
        </div>
      </Panel>

      <Modal
        isOpen={showFaultModal && !!selectedDevice}
        onClose={() => setShowFaultModal(false)}
        title={selectedDevice ? t('common.reportFaultTitle', { id: selectedDevice.assetCode }) : t('common.reportFault')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFaultModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <button type="submit" form="fault-form" disabled={faultMutation.isPending} className="px-4 py-2 bg-red-700/10 border border-red-700/30 dark:border-[rgba(239,68,68,0.25)] text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171] hover:bg-[rgba(239,68,68,0.2)] rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50">{faultMutation.isPending ? t('common.loading') : t('common.submitFault')}</button>
          </>
        }
      >
        <form id="fault-form" onSubmit={handleReportFault} className="flex flex-col gap-[14px] mt-1">
          <SelectField 
            label={t('common.urgency', 'Urgency')} 
            value={faultUrgency} 
            onChange={(e) => setFaultUrgency(e.target.value)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' }
            ]} 
          />
          <InputField 
            type="textarea" 
            label={t('common.description')} 
            placeholder={t('common.describeFault')} 
            value={faultDesc}
            onChange={(e) => setFaultDesc(e.target.value)}
            required 
          />
        </form>
      </Modal>

      <Modal
        isOpen={showManualsModal && !!selectedDevice}
        onClose={() => setShowManualsModal(false)}
        title={selectedDevice ? t('common.manualsTitle', { name: selectedDevice.name }) : t('common.manuals')}
        maxWidth="460px"
      >
        <div className="flex flex-col gap-3 mt-2">
          {[
            { title: t('common.userManual', 'User Manual'), size: '2.4 MB', iconColor: 'text-[#F87171]' },
            { title: t('common.serviceManual', 'Service Manual'), size: '18.1 MB', iconColor: 'text-[#3B72F6]' },
          ].map((m, i) => (
            <div key={i} className="flex flex-row justify-between items-center p-4 border border-[var(--border)] rounded-lg bg-[var(--bg-input)]">
              <div className="flex flex-row items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${m.iconColor}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <div><div className="font-semibold text-[var(--text-primary)] text-sm">{m.title}</div><div className="text-xs text-[var(--text-muted)]">PDF • {m.size}</div></div>
              </div>
              <button onClick={() => showToast(t('common.toastDownloadStarted', { title: m.title }), TOAST_COLORS.info)} className="px-3 py-1.5 text-[11.5px] font-bold bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">{t('common.download')}</button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showHistoryModal && !!selectedDevice}
        onClose={() => setShowHistoryModal(false)}
        title={t('devices.maintenanceHistory', 'Maintenance History')}
        maxWidth="500px"
        footer={
          <ModalCancelBtn onClick={() => setShowHistoryModal(false)}>{t('common.close')}</ModalCancelBtn>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="text-[var(--text-secondary)] text-[0.85rem] font-semibold">{selectedDevice?.name} ({selectedDevice?.assetCode})</div>
          
          {isLoadingHistory ? (
            <div className="text-center py-6 text-[var(--text-muted)] text-sm">{t('common.loading')}</div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-muted)] text-sm">{t('devices.noHistoryFound', 'No maintenance history found.')}</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
              {historyList.map(wo => (
                <div key={wo.id} className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">{wo.workOrderNumber}</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{formatDate(wo.resolvedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-1.5 py-0.5 bg-gray-500/10 text-[var(--text-secondary)] text-[10px] font-bold rounded">{wo.type}</span>
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      {wo.assignedTo?.name ? `Resolved by ${wo.assignedTo.name}` : 'Resolved'}
                    </span>
                  </div>
                  {wo.notes && (
                    <div className="text-[12px] text-[var(--text-muted)] mt-1 italic border-l-2 border-[var(--border)] pl-2">
                      "{wo.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
