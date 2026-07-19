import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import faultReportService from '../../api/faultReportService'
import workOrderService from '../../api/workOrderService'
import * as usersService from '../../api/usersService'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
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

export default function SharedFaultReports() {
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [convertForm, setConvertForm] = useState({ priority: 'MEDIUM', type: 'REPAIR', assignedToId: '', notes: '' })
  const { showToast } = useToastStore()
  const ROWS = 10

  const loadData = async () => {
    try {
      const [reportsRes, techRes] = await Promise.all([
        faultReportService.getFaultReports({ limit: 500 }),
        usersService.getUsers({ role: 'TECHNICIAN', all: 'true' })
      ])
      setReports(reportsRes.items || [])
      setTechnicians(techRes.data || techRes.items || [])
    } catch (err) {
      showToast('Failed to load fault reports', TOAST_COLORS.error)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (activeTab === 'all') return true
      return r.status === activeTab
    })
  }, [reports, activeTab])

  useEffect(() => setCurrentPage(1), [activeTab])

  const counts = useMemo(() => ({
    all: reports.length,
    PENDING: reports.filter(r => r.status === 'PENDING').length,
    IN_PROGRESS: reports.filter(r => r.status === 'IN_PROGRESS').length,
    SOLVED: reports.filter(r => r.status === 'SOLVED').length,
    REJECTED: reports.filter(r => r.status === 'REJECTED').length,
  }), [reports])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  const handleOpenConvert = (report) => {
    setSelectedReport(report)
    setConvertForm({ priority: 'MEDIUM', type: 'REPAIR', assignedToId: '', notes: '' })
    setShowConvertModal(true)
  }

  const handleConvertSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await workOrderService.createWorkOrder({
        faultReportId: selectedReport.id,
        deviceId: selectedReport.deviceId,
        type: convertForm.type,
        priority: convertForm.priority,
        assignedToId: convertForm.assignedToId || null,
        description: convertForm.notes || selectedReport.description
      })
      
      showToast('Successfully converted to Work Order!', TOAST_COLORS.success)
      setShowConvertModal(false)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to convert to Work Order', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('nav.faultReports', 'Fault Reports')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">Triage and manage fault reports submitted by departments.</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        {[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'PENDING', label: t('deptRequests.statusPending', 'Pending'), count: counts.PENDING },
          { id: 'IN_PROGRESS', label: t('deptRequests.inProgress', 'In Progress'), count: counts.IN_PROGRESS },
          { id: 'SOLVED', label: t('deptRequests.solved', 'Solved'), count: counts.SOLVED },
          { id: 'REJECTED', label: t('common.reject', 'Rejected'), count: counts.REJECTED }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab.id ? "bg-[var(--bg-hover)] text-[#14B8A6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
            <span className={clsx(
              "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
              activeTab === tab.id ? "bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"
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
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('deptRequests.reportId', 'ID')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('deptRequests.device', 'Device')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('users.department', 'Department')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('deptRequests.description', 'Issue Description')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('deptRequests.dateSubmitted', 'Reported At')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('common.status', 'Status')}</th>
                <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider text-right">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginated.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('deptRequests.noReports', 'No fault reports found.')}</td></tr> : paginated.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap" title={r.id}>FR-{r.id.slice(-4).toUpperCase()}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{r.device?.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{r.device?.department?.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] max-w-[240px]"><div className="truncate" title={r.description}>{r.description}</div></td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4 text-right">
                    {r.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleOpenConvert(r)}
                        className="px-3 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-[11.5px] font-bold transition-colors shadow-sm"
                      >
                        Convert to WO
                      </button>
                    ) : (
                      r.workOrder ? (
                        <span className="text-[12px] font-mono text-[#3B82F6] font-semibold">{r.workOrder.workOrderNumber}</span>
                      ) : (
                        <span className="text-[12px] text-[var(--text-muted)]">—</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-3 px-4 border-t border-[var(--border)]">
          <span className="text-[0.8rem] text-[var(--text-muted)]">Showing {filtered.length ? (currentPage - 1) * ROWS + 1 : 0}–{Math.min(currentPage * ROWS, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#14B8A6] text-white" : "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)]")}>{n}</button>)}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">›</button>
          </div>
        </div>
      </Panel>

      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convert to Work Order"
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowConvertModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="convert-wo-form" color="#14B8A6" disabled={isSubmitting}>
              {isSubmitting ? '...' : 'Create Work Order'}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 mb-4 mt-2 text-[13px]">
          <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
            <div className="text-[var(--text-muted)] font-semibold">Device:</div>
            <div className="text-[var(--text-primary)] font-medium">{selectedReport?.device?.name}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
            <div className="text-[var(--text-muted)] font-semibold">Department:</div>
            <div className="text-[var(--text-primary)]">{selectedReport?.device?.department?.name}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div className="text-[var(--text-muted)] font-semibold">Reported Issue:</div>
            <div className="text-[var(--text-secondary)] whitespace-pre-wrap">{selectedReport?.description}</div>
          </div>
        </div>

        <form id="convert-wo-form" onSubmit={handleConvertSubmit} className="flex flex-col gap-[14px]">
          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label={t('workOrders.priorityType')} value={convertForm.type} onChange={e => setConvertForm({ ...convertForm, type: e.target.value })} options={[
              {value: 'REPAIR', label: 'Repair'},
              {value: 'PREVENTIVE_MAINTENANCE', label: 'Preventive Maintenance'},
              {value: 'DECOMMISSION', label: 'Decommission'}
            ]} required />
            <SelectField label="Priority" value={convertForm.priority} onChange={e => setConvertForm({ ...convertForm, priority: e.target.value })} options={[
              {value: 'LOW', label: 'Low'},
              {value: 'MEDIUM', label: 'Medium'},
              {value: 'HIGH', label: 'High'},
              {value: 'CRITICAL', label: 'Critical'}
            ]} />
          </div>

          <SelectField label={t('workOrders.assignedTo')} value={convertForm.assignedToId} onChange={e => setConvertForm({ ...convertForm, assignedToId: e.target.value })} options={[
            {value: '', label: 'Leave Unassigned (Open)'},
            ...technicians.map(tItem => ({value: tItem.id, label: tItem.name}))
          ]} />

          <InputField type="textarea" label="Work Order Description (Optional)" value={convertForm.notes} onChange={e => setConvertForm({ ...convertForm, notes: e.target.value })} placeholder="Add extra details or leave blank to use the reported issue description..." />
        </form>
      </Modal>
    </div>
  )
}
