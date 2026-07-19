import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
import { useTranslation } from 'react-i18next'
import workOrderService from '../../api/workOrderService'
import * as usersService from '../../api/usersService'
import deviceService from '../../api/deviceService'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const typeVariantMap = {
  'REPAIR':                 { variant: 'high',   label: 'Repair' },
  'PREVENTIVE_MAINTENANCE': { variant: 'medium', label: 'PM' },
  'DECOMMISSION':           { variant: 'low',    label: 'Decommission' },
}

const TypeBadge = ({ type }) => {
  const cfg = typeVariantMap[type] ?? { variant: 'low', label: type }
  return <StatusBadge variant={cfg.variant} label={cfg.label} />
}

const ROWS_PER_PAGE = 5

const TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'progress' },
  { label: 'Waiting Parts', value: 'waiting' },
  { label: 'Completed', value: 'done' },
]

const DEPT_OPTS = [
  ['', 'All'], ['ICU', 'ICU'], ['ER', 'ER'], ['Surgery', 'Surgery'],
  ['Radiology', 'Radiology'], ['Cardiology', 'Cardiology']
]

const TYPE_OPTS = [
  ['', 'All'], ['REPAIR', 'Repair'], ['PREVENTIVE_MAINTENANCE', 'Preventive Maintenance'], ['DECOMMISSION', 'Decommission']
]

const STATUS_OPTS = [
  ['', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'],
  ['WAITING_PARTS', 'Waiting Parts'], ['PENDING_APPROVAL', 'Pending Approval'], ['DONE', 'Completed'], ['CANCELLED', 'Cancelled']
]

const PRIORITY_OPTS = [
  ['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High'], ['CRITICAL', 'Critical']
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

export default function WorkOrders() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  
  const [woList, setWoList] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [devices, setDevices] = useState([])
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState(null)
  const [editingWO, setEditingWO] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const loadData = async () => {
    try {
      const [woRes, usersRes, devRes] = await Promise.all([
        workOrderService.getWorkOrders({ limit: 500 }),
        usersService.getUsers({ role: 'TECHNICIAN', all: 'true' }),
        deviceService.getDevices({ all: 'true' })
      ])
      setWoList(woRes.items || [])
      setTechnicians(usersRes.data || usersRes.items || [])
      setDevices(devRes.data || [])
    } catch (err) {
      showToast('Failed to load data', TOAST_COLORS.error)
    }
  }

  useEffect(() => { loadData() }, [])

  const TABS = useMemo(() => [
    { label: t('common.allStatuses'), value: '' },
    { label: t('workOrders.open'), value: 'OPEN' },
    { label: t('pm.inProgress'), value: 'IN_PROGRESS' },
    { label: t('workOrders.waitingParts'), value: 'WAITING_PARTS' },
    { label: t('pm.completed'), value: 'DONE' },
  ], [t])

  const tabCounts = useMemo(() => ({
    '': woList.length,
    OPEN: woList.filter(w => w.status === 'OPEN').length,
    IN_PROGRESS: woList.filter(w => w.status === 'IN_PROGRESS').length,
    WAITING_PARTS: woList.filter(w => w.status === 'WAITING_PARTS').length,
    DONE: woList.filter(w => w.status === 'DONE').length,
  }), [woList])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return woList.filter(wo => {
      const matchTab    = !activeTab   || wo.status === activeTab
      const matchStatus = !statusFilter|| wo.status === statusFilter
      const matchType   = !typeFilter  || wo.type === typeFilter
      const matchAssign = !assignedFilter || wo.assignedToId === assignedFilter
      const matchDept   = !deptFilter  || wo.device?.department?.name === deptFilter
      const matchSearch = !q || [wo.workOrderNumber, wo.device?.name, wo.device?.department?.name, wo.assignedTo?.name, wo.description]
        .some(v => String(v).toLowerCase().includes(q))
      return matchTab && matchStatus && matchType && matchAssign && matchDept && matchSearch
    })
  }, [woList, search, activeTab, statusFilter, typeFilter, assignedFilter, deptFilter])

  useEffect(() => setCurrentPage(1), [search, activeTab, statusFilter, typeFilter, assignedFilter, deptFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filtered.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const handleTabClick = (value) => {
    setActiveTab(value)
    setStatusFilter(value)
  }

  const handleStatusFilterChange = (e) => {
    const val = e.target.value
    setStatusFilter(val)
    if (['', 'OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'DONE'].includes(val)) {
      setActiveTab(val)
    } else {
      setActiveTab('')
    }
  }

  const columns = useMemo(() => [
    { key: 'id', label: t('workOrders.woNumber'), render: (_, row) => <span className="font-mono text-[#3B82F6] font-semibold text-[12px]">{row.workOrderNumber}</span> },
    { key: 'device', label: t('devices.deviceName'), render: (_, row) => <span className="text-[var(--text-primary)] font-medium">{row.device?.name}</span> },
    { key: 'dept', label: t('users.department'), render: (_, row) => <span className="inline-block bg-[var(--bg-hover)] border border-[var(--border)] rounded-[6px] px-[9px] py-[2px] text-[11px] text-[var(--text-muted)]">{row.device?.department?.name || '—'}</span> },
    { key: 'issue', label: t('workOrders.issueDescription'), render: (_, row) => <span className="inline-block max-w-[200px] truncate text-[var(--text-muted)] align-middle text-[12px]" title={row.description}>{row.description}</span> },
    { key: 'type', label: t('reports.type'), render: val => <TypeBadge type={val} /> },
    { key: 'assigned', label: t('workOrders.assignedTo'), render: (_, row) => row.assignedTo?.name || 'Unassigned' },
    { key: 'status', label: t('common.status'), render: val => <StatusBadge variant={val.toLowerCase()} label={STATUS_OPTS.find(o => o[0] === val)?.[1] || val} /> },
    { key: 'created', label: t('workOrders.createdDate'), render: (_, row) => formatDate(row.createdAt) },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-1.5">
        <button
          onClick={e => { e.stopPropagation(); setSelectedWO(row); setShowViewModal(true) }}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          title={t('reports.view')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    )},
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

  const onFormSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingWO) {
        await workOrderService.updateWorkOrder(editingWO.id, {
          status: data.status,
          type: data.type,
          priority: data.priority,
          assignedToId: data.assignedToId || null,
          description: data.description,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
        })
        showToast('Work order updated successfully', TOAST_COLORS.success)
      } else {
        await workOrderService.createWorkOrder({
          deviceId: data.deviceId,
          type: data.type,
          priority: data.priority,
          assignedToId: data.assignedToId || null,
          description: data.description,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
        })
        showToast('Work order created successfully', TOAST_COLORS.success)
      }
      setShowFormModal(false)
      reset()
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', TOAST_COLORS.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = () => {
    setShowViewModal(false)
    setEditingWO(selectedWO)
    reset({
      deviceId: selectedWO.deviceId,
      type: selectedWO.type,
      priority: selectedWO.priority,
      status: selectedWO.status,
      assignedToId: selectedWO.assignedToId || '',
      description: selectedWO.description,
      dueDate: selectedWO.dueDate ? new Date(selectedWO.dueDate).toISOString().split('T')[0] : ''
    })
    setShowFormModal(true)
  }

  const openCreateModal = () => {
    setEditingWO(null)
    reset({ deviceId: '', type: 'REPAIR', priority: 'MEDIUM', assignedToId: '', description: '', dueDate: '' })
    setShowFormModal(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('workOrders.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('workOrders.pageSubtitle')}</p>
        </div>
        <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('workOrders.newWorkOrder')}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('workOrders.created')} value={tabCounts['OPEN'] || 0} iconVariant="blue" iconPath="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M10 3h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z M9 12h6 M9 16h4" />
        <KPICard title={t('pm.inProgress')} value={tabCounts['IN_PROGRESS'] || 0} iconVariant="orange" iconPath="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        <div className="[&_.bg-\\[rgba\\(59\\,114\\,246\\,0\\.15\\)\\]]:bg-[rgba(168,85,247,0.15)] [&_.text-\\[\\#5E8FFF\\]]:text-[#C084FC]">
            <KPICard title={t('workOrders.pendingApproval')} value={tabCounts['WAITING_PARTS'] || tabCounts['PENDING_APPROVAL'] || 0} iconVariant="blue" iconPath="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />
        </div>
        <KPICard title={t('pm.completed')} value={tabCounts['DONE'] || 0} iconVariant="green" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" />
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search WO#, device, department…"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          {TYPE_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('reports.type')}: ${l}` : `${t('reports.type')}: All`}</option>)}
        </select>
        <select value={statusFilter} onChange={handleStatusFilterChange} className={selectCls}>
          {STATUS_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('common.status')}: ${l}` : `${t('common.status')}: ${t('common.allStatuses')}`}</option>)}
        </select>
        <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className={selectCls}>
          <option value="">{t('common.allStatuses')}</option>
          {technicians.map(tItem => <option key={tItem.id} value={tItem.id}>{`${t('workOrders.assignedTo')}: ${tItem.name}`}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selectCls}>
          {DEPT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('users.department')}: ${l}` : `${t('users.department')}: All`}</option>)}
        </select>
      </div>

      <div className="flex border-b border-[var(--border)]">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => handleTabClick(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[var(--text-primary)] border-[#3B72F6]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]')}>
            {tab.label}
            <span className="ml-1.5 px-[7px] py-px rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] text-[0.7rem]">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <Panel noPadding>
        <DataTable columns={columns} data={paginated} emptyMessage={t('common.noResults')} />
        {renderPagination()}
      </Panel>

      <Modal
        isOpen={showViewModal && !!selectedWO}
        onClose={() => setShowViewModal(false)}
        title={t('workOrders.workOrderDetails')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={openEditModal} color="#3B72F6">{t('common.edit', 'Edit')}</ModalPrimaryBtn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-[16px]">
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('workOrders.woNumber')}</div><div className="text-[13px] font-mono text-[#3B82F6]">{selectedWO?.workOrderNumber}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('workOrders.createdDate')}</div><div className="text-[13px] text-[var(--text-primary)]">{selectedWO && formatDate(selectedWO.createdAt)}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('devices.deviceName')}</div><div className="text-[13px] text-[var(--text-primary)]">{selectedWO?.device?.name}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('users.department')}</div><div className="text-[13px] text-[var(--text-primary)]">{selectedWO?.device?.department?.name}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('workOrders.priorityType')}</div><div className="mt-1">{selectedWO && <TypeBadge type={selectedWO.type} />}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('common.status')}</div><div className="mt-1">{selectedWO && <StatusBadge variant={selectedWO.status.toLowerCase()} label={STATUS_OPTS.find(o => o[0] === selectedWO.status)?.[1] || selectedWO.status} />}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('workOrders.assignedTo')}</div><div className="text-[13px] text-[var(--text-primary)]">{selectedWO?.assignedTo?.name || 'Unassigned'}</div></div>
          <div><div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">{t('workOrders.dueDate')}</div><div className="text-[13px] text-[var(--text-primary)]">{selectedWO?.dueDate ? formatDate(selectedWO.dueDate) : '—'}</div></div>
          
          <div className="col-span-2 mt-2">
            <div className="text-[11px] text-[var(--text-muted)] uppercase mb-[6px]">{t('workOrders.issueDescription')}</div>
            <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 max-h-[140px] overflow-y-auto text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">
              {selectedWO?.description}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingWO ? t('workOrders.editWorkOrder', { id: editingWO.id }) : t('workOrders.newWorkOrder')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFormModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="wo-form" color="#3B72F6" disabled={isSubmitting}>
              {isSubmitting ? '...' : (editingWO ? t('workOrders.saveChanges') : t('workOrders.createWorkOrder'))}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="wo-form" onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
          <SelectField label={t('devices.deviceName')} name="deviceId" {...register('deviceId', { required: true })} options={devices.map(d => ({value: d.id, label: `${d.assetCode} - ${d.name}`}))} required disabled={!!editingWO} />
          
          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label={t('workOrders.priorityType')} name="type" {...register('type', { required: true })} options={TYPE_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} required disabled={!!editingWO} />
            <SelectField label="Priority" name="priority" {...register('priority')} options={PRIORITY_OPTS.map(([v,l]) => ({value: v, label: l}))} />
          </div>

          {editingWO && (
            <SelectField label={t('common.status')} name="status" {...register('status')} options={STATUS_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} />
          )}

          <InputField type="textarea" label={t('workOrders.issueDescription')} name="description" {...register('description', { required: true })} placeholder="Describe the issue in detail…" required />

          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label={t('workOrders.assignedTo')} name="assignedToId" {...register('assignedToId')} options={[{value: '', label: 'Unassigned'}, ...technicians.map(tItem => ({value: tItem.id, label: tItem.name}))]} />
            <InputField type="date" label={t('workOrders.dueDate')} name="dueDate" {...register('dueDate')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
