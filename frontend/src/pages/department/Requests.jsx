import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import Panel from '../../components/ui/Panel'
import faultReportService from '../../api/faultReportService'
import deviceService from '../../api/deviceService'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'PENDING': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'IN_PROGRESS': 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:text-[#60A5FA]',
    'SOLVED': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'REJECTED': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
  }
  const labelMap = {
    'PENDING': t('deptRequests.statusPending', 'Pending'),
    'IN_PROGRESS': t('deptRequests.inProgress', 'In Progress'),
    'SOLVED': t('deptRequests.solved', 'Solved'),
    'REJECTED': t('common.reject', 'Rejected')
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{labelMap[status]}</span>
}

export default function DeptRequests() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ deviceId: '', desc: '' })
  
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: initialData } = useQuery({
    queryKey: ['deptRequestsInitialData'],
    queryFn: async () => {
      const [reportsRes, devicesRes] = await Promise.all([
        faultReportService.getFaultReports({ limit: 100 }),
        deviceService.getDevices({ all: 'true' })
      ])
      return { requests: reportsRes.items || [], devices: devicesRes.data || [] }
    }
  })
  
  const requests = initialData?.requests || []
  const devices = initialData?.devices || []

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (activeTab === 'all') return true
      return r.status === activeTab
    })
  }, [requests, activeTab])

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    progress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    solved: requests.filter(r => r.status === 'SOLVED').length,
  }

  const createMutation = useMutation({
    mutationFn: (data) => faultReportService.createFaultReport(data),
    onSuccess: () => {
      setShowModal(false)
      setFormData({ deviceId: '', desc: '' })
      showToast(t('deptRequests.toastSubmitSuccess'), TOAST_COLORS.department)
      queryClient.invalidateQueries({ queryKey: ['deptRequestsInitialData'] })
      queryClient.invalidateQueries({ queryKey: ['faultReportStats'] })
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to submit report', TOAST_COLORS.error)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.deviceId || !formData.desc.trim()) return
    createMutation.mutate({
      deviceId: formData.deviceId,
      description: formData.desc
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('deptRequests.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('deptRequests.pageSubtitle')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#BE185D] hover:bg-[#9D174D] text-white rounded-lg text-[0.8125rem] font-bold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {t('deptRequests.reportNewBtn')}
        </button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        {[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'PENDING', label: t('deptRequests.pending'), count: counts.pending },
          { id: 'IN_PROGRESS', label: t('deptRequests.inProgress'), count: counts.progress },
          { id: 'SOLVED', label: t('deptRequests.solved'), count: counts.solved }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab.id ? "bg-[var(--bg-hover)] text-pink-800 dark:text-[#F472B6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
            <span className={clsx(
              "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
              activeTab === tab.id ? "bg-pink-900/10 text-pink-900 dark:bg-[rgba(236,72,153,0.12)] dark:text-[#F472B6]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Panel noPadding className="-mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('deptRequests.reportId'), t('deptRequests.device'), t('deptRequests.description'), t('deptRequests.dateSubmitted'), t('common.status'), t('deptRequests.messageFromTech')].map((h, i) => (
                  <th key={i} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">{t('deptRequests.noReports')}</td></tr> : filtered.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap" title={r.id}>FR-{r.id.slice(-4).toUpperCase()}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{r.device?.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] max-w-[280px]"><div className="truncate" title={r.description}>{r.description}</div></td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4">
                    {r.workOrder?.notes ? (
                      <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] text-[var(--text-secondary)] rounded-md px-2.5 py-1.5 text-xs inline-block max-w-[250px] truncate" title={r.workOrder.notes}>
                        {r.workOrder.notes}
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)] block text-center w-[50px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('deptRequests.reportModalTitle')}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="report-problem-form" color="#BE185D" disabled={createMutation.isPending}>
              {createMutation.isPending ? '...' : t('deptRequests.submitReportBtn')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="report-problem-form" onSubmit={handleSubmit} className="flex flex-col gap-[14px] mt-1">
          <SelectField label={t('deptRequests.affectedDevice')} name="deviceId" value={formData.deviceId} onChange={e => setFormData({ ...formData, deviceId: e.target.value })} placeholder={t('deptRequests.selectDevicePlaceholder')} options={devices.map(d => ({ value: d.id, label: `${d.name} (${d.assetCode})` }))} required />
          <InputField type="textarea" label={t('deptRequests.problemDescription')} name="desc" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} placeholder={t('deptRequests.descriptionPlaceholder')} required />
        </form>
      </Modal>
    </div>
  )
}
