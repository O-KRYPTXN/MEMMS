import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import Panel from '../../components/ui/Panel'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import workOrderService from '../../api/workOrderService'
import * as usersService from '../../api/usersService'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const TypeBadge = ({ type }) => {
  const { t } = useTranslation()
  const map = {
    'REPAIR': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    'PREVENTIVE_MAINTENANCE': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'DECOMMISSION': 'bg-purple-700/10 text-purple-800 dark:bg-[rgba(168,85,247,0.12)] dark:text-[#C084FC]',
  }
  const labelMap = {
    'REPAIR': t('supervisor.repair', 'Repair'),
    'PREVENTIVE_MAINTENANCE': t('supervisor.pm', 'PM'),
    'DECOMMISSION': 'Decommission',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[type] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{labelMap[type] || type}</span>
}

const WOStatusBadge = ({ status, isAssigned }) => {
  const { t } = useTranslation()
  const map = {
    'OPEN': isAssigned 
      ? 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:text-[#60A5FA]' 
      : 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    'IN_PROGRESS': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'PENDING_APPROVAL': 'bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6]',
    'WAITING_PARTS': 'bg-purple-700/10 text-purple-800 dark:bg-[rgba(168,85,247,0.12)] dark:text-[#C084FC]',
    'DONE': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'CANCELLED': 'bg-gray-700/10 text-gray-800 dark:bg-[rgba(156,163,175,0.12)] dark:text-[#9CA3AF]'
  }
  const labelMap = {
    'OPEN': isAssigned ? t('supWorkOrders.assigned', 'Assigned') : t('supWorkOrders.unassigned', 'Unassigned'),
    'IN_PROGRESS': t('supWorkOrders.inProgress', 'In Progress'),
    'WAITING_PARTS': t('common.waitingParts', 'Waiting Parts'),
    'PENDING_APPROVAL': t('supWorkOrders.pendingApproval', 'Pending Approval'),
    'DONE': t('supWorkOrders.closed', 'Done'),
    'CANCELLED': t('common.cancelled', 'Cancelled')
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[status] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{labelMap[status]}</span>
}

const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation()
  const map = { HIGH: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]', MEDIUM: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]', LOW: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]', CRITICAL: 'bg-red-800/10 text-red-900 dark:bg-[rgba(220,38,38,0.12)] dark:text-[#DC2626]' }
  const labelMap = { HIGH: t('priority.high'), MEDIUM: t('priority.medium'), LOW: t('priority.low'), CRITICAL: 'Critical' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[priority] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{labelMap[priority]}</span>
}

const inputCls = "bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] focus:border-[#14B8A6] outline-none"

export default function WorkOrders() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [wos, setWos] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  
  const [assignTargetId, setAssignTargetId] = useState(null)
  const [activeApproval, setActiveApproval] = useState(null)
  const [viewWO, setViewWO] = useState(null)
  const { showToast } = useToastStore()
  
  const [assignForm, setAssignForm] = useState({ woId: '', tech: '', priority: 'MEDIUM', notes: '' })
  const [approveNotes, setApproveNotes] = useState('')
  const ROWS = 8

  const loadData = async () => {
    try {
      const [woRes, usersRes] = await Promise.all([
        workOrderService.getWorkOrders({ limit: 500 }),
        usersService.getUsers({ role: 'TECHNICIAN', all: 'true' })
      ])
      setWos(woRes.items || [])
      setTechnicians(usersRes.data || usersRes.items || [])
    } catch (err) {
      showToast('Failed to load work orders', TOAST_COLORS.error)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return wos.filter(w => {
      const matchTab = activeTab === 'all' || w.status === activeTab
      const matchQ = !q || w.workOrderNumber.toLowerCase().includes(q) || w.device?.name?.toLowerCase().includes(q) || w.assignedTo?.name?.toLowerCase().includes(q)
      const matchType = !typeFilter || w.type === typeFilter
      const matchPri = !priorityFilter || w.priority === priorityFilter
      return matchTab && matchQ && matchType && matchPri
    })
  }, [wos, activeTab, search, typeFilter, priorityFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, typeFilter, priorityFilter])

  const counts = useMemo(() => ({
    all: wos.length,
    OPEN: wos.filter(w => w.status === 'OPEN').length,
    IN_PROGRESS: wos.filter(w => w.status === 'IN_PROGRESS').length,
    PENDING_APPROVAL: wos.filter(w => w.status === 'PENDING_APPROVAL').length,
    DONE: wos.filter(w => w.status === 'DONE').length,
  }), [wos])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  useEffect(() => {
    if (showAssignModal) setAssignForm({ woId: assignTargetId || '', tech: '', priority: 'MEDIUM', notes: '' })
  }, [showAssignModal, assignTargetId])

  const handleAssign = async () => {
    if (!assignForm.woId) return showToast(t('supWorkOrders.toastSelectWO'), TOAST_COLORS.error)
    if (!assignForm.tech) return showToast(t('supWorkOrders.toastSelectTech'), TOAST_COLORS.error)
    
    setIsSubmitting(true)
    try {
      await workOrderService.updateWorkOrder(assignForm.woId, {
        assignedToId: assignForm.tech,
        priority: assignForm.priority,
        notes: assignForm.notes,
        status: 'IN_PROGRESS'
      })
      showToast(t('supWorkOrders.toastAssignedSuccess'), TOAST_COLORS.supervisor)
      setShowAssignModal(false)
      loadData()
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await workOrderService.updateWorkOrder(activeApproval.id, {
        status: 'DONE',
        notes: approveNotes ? activeApproval.notes + '\n\nSupervisor Approval: ' + approveNotes : activeApproval.notes
      })
      showToast(t('supWorkOrders.toastApprovedSuccess'), TOAST_COLORS.supervisor)
      setShowApproveModal(false)
      setApproveNotes('')
      loadData()
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
    } catch (err) {
      showToast('Failed to approve', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await workOrderService.updateWorkOrder(activeApproval.id, {
        status: 'IN_PROGRESS',
        notes: approveNotes ? activeApproval.notes + '\n\nSupervisor Rejection: ' + approveNotes : activeApproval.notes
      })
      showToast(t('supWorkOrders.toastReturnedForRevision'), TOAST_COLORS.warning)
      setShowApproveModal(false)
      setApproveNotes('')
      loadData()
    } catch (err) {
      showToast('Failed to reject', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('supWorkOrders.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('supWorkOrders.pageSubtitle')}</p>
        </div>
        <button onClick={() => { setAssignTargetId(null); setShowAssignModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {t('supWorkOrders.assignWOModalTitle')}
        </button>
      </div>

      <div className="flex gap-[2px] bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[10px] p-1 w-fit overflow-x-auto max-w-full">
        {[{id:'all', label:t('common.all')}, {id:'OPEN', label:t('common.open', 'Open')}, {id:'IN_PROGRESS', label:t('supWorkOrders.inProgress', 'In Progress')}, {id:'PENDING_APPROVAL', label:t('supWorkOrders.pendingApproval', 'Pending')}, {id:'DONE', label:t('supWorkOrders.closed', 'Done')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("whitespace-nowrap px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center", activeTab === tab.id ? "bg-[var(--bg-panel)] text-[#14B8A6]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
            {tab.label}
            <span className={clsx("ms-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(20,184,166,0.15)] text-[#14B8A6]" : "bg-[rgba(239,68,68,0.15)] text-[var(--text-secondary)]")}>
              {counts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-t-[10px] p-3 px-4 flex gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 max-w-[280px] h-[34px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#14B8A6] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('supWorkOrders.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">{t('supWorkOrders.typeAll')}</option>
            <option value="REPAIR">Repair</option>
            <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
            <option value="DECOMMISSION">Decommission</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">{t('supWorkOrders.priorityAll')}</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <Panel noPadding className="border-t-0 rounded-t-none rounded-b-[12px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('supWorkOrders.woNumber'), t('supWorkOrders.device'), t('supWorkOrders.type'), t('supWorkOrders.dept'), t('common.priority'), t('supWorkOrders.assignedTo'), t('common.status'), t('common.actions')].map((h, i) => (
                  <th key={i} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginated.length === 0 ? <tr><td colSpan={8} className="p-0"><EmptyState message={t('supWorkOrders.noWorkOrdersFound')} /></td></tr> : paginated.map(w => (
                <tr key={w.id} className="hover:bg-[var(--bg-hover)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)]">{w.workOrderNumber}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{w.device?.name}</td>
                  <td className="p-4"><TypeBadge type={w.type} /></td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{w.device?.department?.name}</td>
                  <td className="p-4"><PriorityBadge priority={w.priority} /></td>
                  <td className={clsx("p-4 text-[13px]", !w.assignedToId ? 'text-[#F87171]' : 'text-[var(--text-secondary)]')}>{w.assignedTo?.name || 'Unassigned'}</td>
                  <td className="p-4"><WOStatusBadge status={w.status} isAssigned={!!w.assignedToId} /></td>
                  <td className="p-4 flex gap-1.5">
                    {!w.assignedToId && w.status === 'OPEN' && <button onClick={() => { setAssignTargetId(w.id); setShowAssignModal(true) }} className="bg-blue-700/10 border border-blue-700/30 dark:border-[rgba(59,114,246,0.25)] text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#5E8FFF] rounded-md px-[10px] py-[4px] text-[0.72rem] font-bold hover:bg-[rgba(59,114,246,0.2)]">{t('common.assign')}</button>}
                    {w.status === 'PENDING_APPROVAL' && <button onClick={() => { setActiveApproval(w); setShowApproveModal(true) }} className="bg-teal-700/10 border border-teal-700/30 dark:border-[rgba(20,184,166,0.25)] text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6] rounded-md px-[10px] py-[4px] text-[0.72rem] font-bold hover:bg-[rgba(20,184,166,0.2)]">{t('common.approve')}</button>}
                    {(w.status !== 'OPEN' || w.assignedToId) && <button onClick={() => { setViewWO(w); setShowViewModal(true) }} className="w-[30px] h-[30px] rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-3 px-4 border-t border-[var(--border)]">
            <span className="text-[0.8rem] text-[var(--text-muted)]">{t('supWorkOrders.showingResults', { start: filtered.length ? (currentPage - 1) * ROWS + 1 : 0, end: Math.min(currentPage * ROWS, filtered.length), total: filtered.length })}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#14B8A6] text-white" : "bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]")}>{n}</button>)}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">›</button>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={t('supWorkOrders.assignWOModalTitle')}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAssignModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={handleAssign} color="#14B8A6" disabled={isSubmitting}>
              {isSubmitting ? '...' : t('supWorkOrders.assignTechnician')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-4 mt-1">
          <SelectField label={t('supWorkOrders.workOrder')} name="woId" value={assignForm.woId} onChange={e => setAssignForm({ ...assignForm, woId: e.target.value })} placeholder={t('supWorkOrders.selectWorkOrder')} options={wos.filter(w => w.status === 'OPEN').map(w => ({value: w.id, label: `${w.workOrderNumber} — ${w.device?.name}`}))} />
          <SelectField label={t('supWorkOrders.assignToTechnician')} name="tech" value={assignForm.tech} onChange={e => setAssignForm({ ...assignForm, tech: e.target.value })} placeholder={t('supWorkOrders.selectTechnician')} options={technicians.map(tItem => ({value: tItem.id, label: tItem.name}))} />
          <SelectField label={t('common.priority')} name="priority" value={assignForm.priority} onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })} placeholder="Select Priority" options={[{value: 'HIGH', label: 'High'}, {value: 'MEDIUM', label: 'Medium'}, {value: 'LOW', label: 'Low'}]} />
          <InputField type="textarea" label={t('supWorkOrders.notes')} name="notes" value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} placeholder={t('supWorkOrders.specialInstructions')} />
        </div>
      </Modal>

      <Modal
        isOpen={showApproveModal && !!activeApproval}
        onClose={() => setShowApproveModal(false)}
        title={activeApproval ? t('supWorkOrders.approveSpecificWO', { id: activeApproval.id }) : t('supWorkOrders.approveWOModalTitle')}
        maxWidth="460px"
        footer={
          <>
            <button onClick={handleReject} disabled={isSubmitting} className="px-4 py-2 border border-[rgba(239,68,68,0.3)] rounded-lg text-[#F87171] text-[13px] font-bold hover:bg-[rgba(239,68,68,0.05)] transition-colors disabled:opacity-50">{t('supWorkOrders.reject')}</button>
            <ModalCancelBtn onClick={() => setShowApproveModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={handleApprove} color="#14B8A6" disabled={isSubmitting}>
              {isSubmitting ? '...' : t('supWorkOrders.approveAndClose')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {[[t('supWorkOrders.workOrder'), activeApproval?.workOrderNumber], [t('supWorkOrders.device'), activeApproval?.device?.name], [t('supWorkOrders.assignedTo'), activeApproval?.assignedTo?.name], [t('supWorkOrders.type'), activeApproval?.type]].map(([l, v]) => (
              <div key={l} className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg p-3"><div className="text-[0.72rem] text-[var(--text-muted)] uppercase">{l}</div><div className="text-[0.875rem] font-semibold text-[var(--text-primary)] mt-1">{v}</div></div>
            ))}
          </div>
          <InputField type="textarea" label={t('supWorkOrders.supervisorNotes')} name="approveNotes" value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder={t('supWorkOrders.addApprovalNotes')} />
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal && !!viewWO}
        onClose={() => setShowViewModal(false)}
        title={viewWO ? t('supWorkOrders.viewSpecificWO', { id: viewWO.id }) : t('supWorkOrders.viewWOModalTitle')}
        maxWidth="460px"
        footer={
          <ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>
        }
      >
        <div className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {[[t('supWorkOrders.workOrder'), viewWO?.workOrderNumber], [t('supWorkOrders.device'), viewWO?.device?.name], [t('supWorkOrders.assignedTo'), viewWO?.assignedTo?.name || 'Unassigned'], [t('supWorkOrders.type'), viewWO?.type], [t('supWorkOrders.department'), viewWO?.device?.department?.name], [t('common.status'), viewWO?.status]].map(([l, v]) => (
              <div key={l} className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg p-3"><div className="text-[0.72rem] text-[var(--text-muted)] uppercase">{l}</div><div className="text-[0.875rem] font-semibold text-[var(--text-primary)] mt-1">{v}</div></div>
            ))}
          </div>
          <div>
            <label className="block text-[12px] text-[var(--text-muted)] font-semibold mb-1.5">{t('supWorkOrders.descriptionNotes')}</label>
            <div className="bg-[var(--bg-input)] border border-[var(--border)] p-2.5 rounded-md text-[0.85rem] text-[var(--text-secondary)] whitespace-pre-wrap">{viewWO?.notes || viewWO?.description || t('supWorkOrders.noAdditionalNotes')}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
