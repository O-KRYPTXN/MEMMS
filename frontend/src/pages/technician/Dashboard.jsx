import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import clsx from 'clsx'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useTranslation } from 'react-i18next'
import workOrderService from '../../api/workOrderService'

const TaskStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'IN_PROGRESS': 'bg-amber-500/15 text-amber-700 dark:bg-[rgba(245,158,11,0.15)] dark:text-[#FCD34D]',

    'PENDING_APPROVAL': 'bg-amber-500/15 text-amber-700 dark:bg-[rgba(245,158,11,0.15)] dark:text-[#FCD34D]',
    'OPEN': 'bg-blue-500/15 text-blue-700 dark:bg-[rgba(59,114,246,0.15)] dark:text-[#60A5FA]',
    'DONE': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'CANCELLED': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]'
  }
  const labelMap = {
    'IN_PROGRESS': t('techDashboard.statusInProgress', 'In Progress'),

    'PENDING_APPROVAL': t('techDashboard.statusCompletedSolved', 'Pending Approval'),
    'OPEN': t('status.OPEN', 'Open'),
    'DONE': t('status.DONE', 'Done'),
    'CANCELLED': t('status.CANCELLED', 'Cancelled')
  }
  return <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${map[status] || map['OPEN']}`}>{labelMap[status] || status}</span>
}


export default function TechnicianDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const nameFirst = user?.name?.split(' ')[0] || 'Technician'
  const queryClient = useQueryClient()
  const { showToast } = useToastStore()

  const [showModal, setShowModal] = useState(false)
  const [activeWO, setActiveWO] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS')
  const [hours, setHours] = useState('1.0')
  const [notes, setNotes] = useState('')

  const { data: woData, isLoading } = useQuery({
    queryKey: ['workOrders', { assignedToId: user?.id }],
    queryFn: () => workOrderService.getWorkOrders({ assignedToId: user?.id, limit: 500 }),
    enabled: !!user?.id
  })

  const tasks = woData?.items || []

  // Derived State (KPIs)
  const { activeTasks, completedCount, pendingCount } = useMemo(() => {
    const active = tasks.filter(task => task.status !== 'DONE' && task.status !== 'CANCELLED')
    const completed = tasks.filter(task => task.status === 'DONE' || task.status === 'PENDING_APPROVAL').length
    const pending = active.filter(task => task.status === 'PENDING_APPROVAL').length

    return { activeTasks: active, completedCount: completed, pendingCount: pending }
  }, [tasks])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => workOrderService.updateWorkOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workOrders'])
      setShowModal(false)
      const displayId = activeWO?.workOrderNumber || activeWO?.id?.slice(-6).toUpperCase()
      showToast(t('techDashboard.toastUpdated', { id: displayId }), TOAST_COLORS.technician)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update work order', TOAST_COLORS.error)
    }
  })

  const handleUpdate = (e) => {
    e.preventDefault()
    if (!activeWO) return

    updateMutation.mutate({
      id: activeWO.id,
      data: {
        status: updateStatus,
        completionNotes: notes || undefined
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techDashboard.pageTitle', { name: nameFirst })}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techDashboard.pageSubtitle', { count: activeTasks.length })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('techDashboard.activeTasks'), value: activeTasks.length, icon: <path d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>, bg: 'bg-amber-600/10 text-amber-700 dark:bg-[rgba(245,158,11,0.15)] dark:text-[#FCD34D]' },
          { label: t('supWorkOrders.pendingApproval', 'Pending Approval'), value: pendingCount, icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>, bg: 'bg-purple-600/10 text-purple-700 dark:bg-[rgba(168,85,247,0.15)] dark:text-[#C084FC]' },
          { label: t('techDashboard.completedMonth'), value: completedCount, icon: <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>, bg: 'bg-green-600/10 text-green-700 dark:bg-[rgba(34,197,94,0.15)] dark:text-[#4ADE80]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-[18px] flex flex-row items-center gap-[14px]">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg></div>
            <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{kpi.value}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div></div>
          </div>
        ))}
      </div>

      <Panel noPadding>
        <PanelHeader title={t('techDashboard.myTaskQueue')} action={<button onClick={() => navigate(ROUTES.TECH_WORK_ORDERS)} className="px-2.5 py-1 text-[0.75rem] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors">{t('techDashboard.viewAll')}</button>} />
        <div className="flex flex-col">
          {isLoading ? (
            <div className="p-8 text-center text-[var(--text-muted)]">{t('common.loading', 'Loading tasks...')}</div>
          ) : activeTasks.length === 0 ? (
            <EmptyState message={t('techDashboard.noActiveTasks')} />
          ) : (
            activeTasks.map(task => {
              const displayId = task.workOrderNumber || task.id.slice(-6).toUpperCase()
              return (
              <div key={task.id} className="flex flex-row items-center gap-4 p-4 px-5 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors">
                <div className={`w-1 h-8 rounded shrink-0 ${task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-[#F87171]' : task.priority === 'MEDIUM' ? 'bg-[#F59E0B]' : 'bg-[#4ADE80]'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.9rem] font-bold text-[var(--text-primary)] truncate">{displayId} — {task.device?.name || 'Unknown Device'}</div>
                  <div className="flex flex-row gap-3 items-center mt-1">
                    <TaskStatusBadge status={task.status} />
                    <span className="text-[var(--text-muted)] text-[0.78rem]">{t(`priority.${task.priority?.toLowerCase()}`, task.priority)} {t('techDashboard.priority', 'Priority')}</span>
                    <span className="text-[var(--text-muted)] text-[0.78rem]">{task.device?.department?.name || ''}</span>
                  </div>
                </div>
                <button onClick={() => { setActiveWO(task); setUpdateStatus(task.status === 'OPEN' ? 'IN_PROGRESS' : task.status); setNotes(''); setShowModal(true) }} className="bg-yellow-700/10 border border-yellow-700/30 dark:border-[rgba(245,158,11,0.25)] text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] px-3.5 py-1.5 rounded-lg text-[0.75rem] font-bold hover:bg-[rgba(245,158,11,0.2)] transition-colors shrink-0">{t('techDashboard.quickUpdate')}</button>
              </div>
            )})
          )}
        </div>
      </Panel>

      <Modal
        isOpen={showModal && !!activeWO}
        onClose={() => setShowModal(false)}
        title={activeWO ? t('techDashboard.updateWOModalTitle', { id: activeWO.workOrderNumber || activeWO.id.slice(-6).toUpperCase() }) : t('techDashboard.updateWOModalTitleFallback')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="update-wo-form" color="#F59E0B" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.loading', 'Loading...') : t('techDashboard.saveUpdate')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="update-wo-form" onSubmit={handleUpdate} className="flex flex-col gap-[14px] mt-1">
          <SelectField 
            label={t('techDashboard.status')} 
            name="updateStatus" 
            value={updateStatus} 
            onChange={e => setUpdateStatus(e.target.value)} 
            options={[
              { value: 'IN_PROGRESS', label: t('techDashboard.statusInProgress', 'In Progress') }, 

              { value: 'PENDING_APPROVAL', label: t('techDashboard.statusCompletedSolved', 'Completed / Solved (Sent for Approval)') }
            ]} 
          />
          <InputField type="textarea" label={t('techDashboard.workNotes')} name="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('techDashboard.workNotesPlaceholder')} />
        </form>
      </Modal>
    </div>
  )
}
