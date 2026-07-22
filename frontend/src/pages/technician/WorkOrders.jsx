import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import workOrderService from '../../api/workOrderService'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'IN_PROGRESS': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',

    'OPEN': 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:text-[#60A5FA]',
    'PENDING_APPROVAL': 'bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6]',
    'DONE': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
  }
  const labelMap = {
    'IN_PROGRESS': t('common.statusInProgress', 'In Progress'),

    'OPEN': t('common.statusToDo', 'To Do'),
    'PENDING_APPROVAL': t('supWorkOrders.pendingApproval', 'Pending Approval'),
    'DONE': t('common.statusSolved', 'Done')
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{labelMap[status] || status}</span>
}

const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation()
  const map = { HIGH: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]', MEDIUM: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]', LOW: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]', CRITICAL: 'bg-red-800/10 text-red-900 dark:bg-[rgba(220,38,38,0.12)] dark:text-[#DC2626]' }
  const labelMap = {
    'HIGH': t('common.priorityHigh', 'High'),
    'MEDIUM': t('common.priorityMedium', 'Medium'),
    'LOW': t('common.priorityLow', 'Low'),
    'CRITICAL': 'Critical'
  }
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[0.65rem] font-bold uppercase tracking-wider ${map[priority] || ''}`}>{labelMap[priority] || priority}</span>
}

const TypeBadge = ({ type }) => {
  const { t } = useTranslation()
  const map = {
    'REPAIR': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    'PREVENTIVE_MAINTENANCE': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'DECOMMISSION': 'bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,130,246,0.12)] dark:text-[#60A5FA]',
  }
  const labelMap = {
    'REPAIR': t('common.typeRepair', 'Repair'),
    'PREVENTIVE_MAINTENANCE': t('common.typePM', 'PM'),
    'DECOMMISSION': 'Decommission'
  }
  const label = labelMap[type] || type
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.7rem] font-bold whitespace-nowrap ${map[type] || ''}`}>{label}</span>
}

const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#F59E0B] transition-colors"
const labelCls = "block text-[12px] text-[var(--text-muted)] font-semibold mb-1.5"

export default function TechnicianWorkOrders() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [wos, setWos] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '' })
  
  const { showToast } = useToastStore()
  const ROWS = 8

  const loadData = async () => {
    try {
      const res = await workOrderService.getWorkOrders({ limit: 500 })
      setWos(res.items || [])
    } catch (err) {
      showToast('Failed to load work orders', TOAST_COLORS.error)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return wos.filter(w => {
      const matchTab = activeTab === 'all' || 
                       (activeTab === 'COMPLETED' && (w.status === 'DONE' || w.status === 'PENDING_APPROVAL')) || 
                       w.status === activeTab
      const matchQ = !q || w.workOrderNumber.toLowerCase().includes(q) || w.device?.name?.toLowerCase().includes(q)
      const matchPri = !priorityFilter || w.priority === priorityFilter
      const matchType = !typeFilter || w.type === typeFilter
      return matchTab && matchQ && matchPri && matchType
    })
  }, [wos, activeTab, search, priorityFilter, typeFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, priorityFilter, typeFilter])

  const counts = {
    all: wos.length,
    'IN_PROGRESS': wos.filter(w => w.status === 'IN_PROGRESS').length,
    'COMPLETED': wos.filter(w => w.status === 'DONE' || w.status === 'PENDING_APPROVAL').length,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  const handleOpenUpdate = (row) => {
    setSelectedWO(row)
    let initialStatus = row.status
    if (initialStatus === 'OPEN') initialStatus = 'IN_PROGRESS'
    setUpdateForm({ status: initialStatus, notes: row.notes || '' })
    setShowUpdateModal(true)
  }

  const getStatusOptions = (wo) => {
    if (!wo) return []
    if (wo.type === 'PREVENTIVE_MAINTENANCE') {
      return [
        { value: 'IN_PROGRESS', label: t('common.statusInProgress', 'In Progress') },
        { value: 'DONE', label: t('common.statusDone', 'Done') }
      ]
    }
    return [
      { value: 'IN_PROGRESS', label: t('common.statusInProgress', 'In Progress') },
      { value: 'PENDING_APPROVAL', label: t('supWorkOrders.pendingApproval', 'Pending Approval') }
    ]
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await workOrderService.updateWorkOrder(selectedWO.id, updateForm)
      setShowUpdateModal(false)
      showToast(t('techWorkOrders.toastUpdated', { id: selectedWO.workOrderNumber }), TOAST_COLORS.technician)
      loadData()
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
    } catch (err) {
      showToast('Failed to update work order', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techWorkOrders.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techWorkOrders.pageSubtitle')}</p>
      </div>

      <div className="flex gap-[2px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[10px] p-1 w-fit overflow-x-auto max-w-full">
        {[{id:'all', label:t('techWorkOrders.tabAll')}, {id:'IN_PROGRESS', label:t('techWorkOrders.tabInProgress')}, {id:'COMPLETED', label:t('techWorkOrders.tabCompleted', 'Completed')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
            {tab.label}
            <span className={clsx("ms-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]" : "bg-[var(--bg-hover)] text-[var(--text-muted)]")}>{counts[tab.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-t-[10px] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techWorkOrders.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
            <option value="">{t('common.allPriority')}</option>
            <option value="HIGH">{t('common.priorityHigh')}</option>
            <option value="MEDIUM">{t('common.priorityMedium')}</option>
            <option value="LOW">{t('common.priorityLow')}</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
            <option value="">{t('techWorkOrders.allTypes')}</option>
            <option value="REPAIR">{t('common.typeRepair')}</option>
            <option value="PREVENTIVE_MAINTENANCE">{t('common.typePM')}</option>
            <option value="DECOMMISSION">Decommission</option>
          </select>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border)] border-t-0 rounded-b-[12px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('techWorkOrders.woId'), t('techWorkOrders.device'), t('techWorkOrders.type'), t('common.dept'), t('techWorkOrders.priority'), t('techWorkOrders.status'), t('techWorkOrders.dueDate', 'Due Date'), t('techWorkOrders.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginated.length === 0 ? <tr><td colSpan={8} className="p-0"><EmptyState message={t('techWorkOrders.noWorkOrders')} /></td></tr> : paginated.map(w => (
                <tr key={w.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{w.workOrderNumber}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{w.device?.name}</td>
                  <td className="p-4"><TypeBadge type={w.type} /></td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{w.device?.department?.name}</td>
                  <td className="p-4"><PriorityBadge priority={w.priority} /></td>
                  <td className="p-4"><StatusBadge status={w.status} /></td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{w.dueDate ? formatDate(w.dueDate) : '—'}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedWO(w); setShowViewModal(true) }} className="w-[28px] h-[28px] rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                      {w.status !== 'DONE' && w.status !== 'PENDING_APPROVAL' && <button onClick={() => handleOpenUpdate(w)} className="bg-yellow-700/10 border border-yellow-700/30 dark:border-[rgba(245,158,11,0.25)] text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[rgba(245,158,11,0.2)] transition-colors">{t('techWorkOrders.update')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-3 px-4 border-t border-[var(--border)]">
            <span className="text-[0.8rem] text-[var(--text-muted)]">Showing {filtered.length ? (currentPage - 1) * ROWS + 1 : 0}–{Math.min(currentPage * ROWS, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#F59E0B] text-white" : "bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)]")}>{n}</button>)}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30">›</button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showUpdateModal && !!selectedWO}
        onClose={() => setShowUpdateModal(false)}
        title={selectedWO ? t('techWorkOrders.updateWOModalTitle', { id: selectedWO.workOrderNumber }) : 'Update Work Order'}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowUpdateModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="update-form" color="#F59E0B" disabled={isSubmitting}>
              {isSubmitting ? '...' : t('techWorkOrders.saveUpdate')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="update-form" onSubmit={handleUpdateSubmit} className="flex flex-col gap-[14px] mt-1">
          <SelectField label={t('techWorkOrders.statusLabel')} value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} options={getStatusOptions(selectedWO)} />
          <InputField type="textarea" label={t('techWorkOrders.workNotes')} value={updateForm.notes} onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })} placeholder={t('techWorkOrders.workNotesPlaceholder')} />
        </form>
      </Modal>

      <Modal
        isOpen={showViewModal && !!selectedWO}
        onClose={() => setShowViewModal(false)}
        title={selectedWO ? t('common.woDetailsTitle', { id: selectedWO.workOrderNumber }) : t('common.woDetails', 'Work Order Details')}
        maxWidth="500px"
        footer={
          <ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>
        }
      >
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {[
              { l: t('techWorkOrders.device'), v: selectedWO?.device?.name }, { l: t('common.dept'), v: selectedWO?.device?.department?.name },
              { l: t('techWorkOrders.type'), v: selectedWO ? <TypeBadge type={selectedWO.type} /> : null }, { l: t('techWorkOrders.priority'), v: selectedWO ? <PriorityBadge priority={selectedWO.priority} /> : null },
              { l: t('techWorkOrders.status'), v: selectedWO ? <StatusBadge status={selectedWO.status} /> : null }, { l: t('techWorkOrders.dueDate', 'Due Date'), v: selectedWO?.dueDate ? formatDate(selectedWO.dueDate) : '—' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[var(--bg-input)] rounded-lg p-3">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">{item.l}</div>
                <div className="text-[13px] font-bold text-[var(--text-primary)]">{item.v}</div>
              </div>
            ))}
          </div>
          <div className="bg-[var(--bg-input)] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">Issue Description</div>
            <div className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{selectedWO?.description || 'No description provided.'}</div>
          </div>
          <div className="bg-[var(--bg-input)] rounded-lg p-3 mt-2">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">{t('techWorkOrders.workNotes')}</div>
            <div className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap">{selectedWO?.notes || 'No notes provided yet.'}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
