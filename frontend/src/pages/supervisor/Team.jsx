import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import Panel from '../../components/ui/Panel'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import * as usersService from '../../api/usersService'
import workOrderService from '../../api/workOrderService'

const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation()
  const map = { HIGH: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]', CRITICAL: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]', MEDIUM: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]', LOW: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]' }
  const labelMap = { HIGH: t('priority.high'), CRITICAL: t('priority.critical'), MEDIUM: t('priority.medium'), LOW: t('priority.low') }
  
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${map[priority] || map.MEDIUM}`}>{labelMap[priority] || priority}</span>
}

const StatusDot = ({ status, className }) => {
  const bg = status === 'online' ? 'bg-[#4ADE80]' : status === 'busy' ? 'bg-[#FCD34D]' : 'bg-[#5A6A85]'
  return <div className={clsx("rounded-full", bg, className)}></div>
}

const StatusPill = ({ status }) => {
  const { t } = useTranslation()
  const colors = {
    online: 'bg-green-700/10 border-[rgba(74,222,128,0.25)] text-green-800 dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ADE80]',
    busy: 'bg-yellow-700/10 border-[rgba(252,211,77,0.25)] text-yellow-800 dark:bg-[rgba(252,211,77,0.12)] dark:text-[#FCD34D]',
    offline: 'bg-slate-700/10 border-[rgba(90,106,133,0.25)] text-slate-800 dark:bg-[rgba(90,106,133,0.12)] dark:text-[#5A6A85]'
  }
  const labelMap = {
    online: t('supTeam.available'),
    busy: t('supTeam.busy'),
    offline: t('supTeam.offline')
  }
  return <div className={clsx("px-2 py-0.5 rounded-full border text-[0.65rem] font-bold uppercase tracking-wider", colors[status])}>{labelMap[status]}</div>
}

export default function SupervisorTeam() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { showToast } = useToastStore()
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [activeTech, setActiveTech] = useState(null)

  const queryParams = user?.departmentId ? { departmentId: user.departmentId } : {}

  // 1. Fetch Technicians
  const { data: techsData, isLoading: isLoadingTechs } = useQuery({
    queryKey: ['users', 'TECHNICIAN', queryParams],
    queryFn: () => usersService.getUsers({ role: 'TECHNICIAN', ...queryParams, limit: 100 })
  })
  const rawTechnicians = techsData?.items || []

  // 2. Fetch Work Orders
  const { data: woData, isLoading: isLoadingWOs } = useQuery({
    queryKey: ['workOrders', queryParams],
    queryFn: () => workOrderService.getWorkOrders({ ...queryParams, limit: 1000 })
  })
  const workOrders = woData?.items || []

  // Derived state mapping
  const team = useMemo(() => {
    return rawTechnicians.map(tech => {
      const assignedWOs = workOrders.filter(wo => wo.assignedToId === tech.id)
      
      const activeAssignments = assignedWOs.filter(wo => !['DONE', 'CANCELLED'].includes(wo.status))
      const completedTasks = assignedWOs.filter(wo => wo.status === 'DONE').length
      
      const initials = (tech.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      const isOnline = tech.isActive
      const isBusy = activeAssignments.length > 0 && isOnline

      return {
        id: tech.id,
        name: tech.name,
        initials,
        title: t('roles.TECHNICIAN'),
        color: isOnline ? '#14B8A6' : '#5A6A85',
        status: isBusy ? 'busy' : isOnline ? 'online' : 'offline',
        phone: (tech.phone && tech.phone.trim() !== '') ? tech.phone : t('supTeam.noPhone', 'No phone provided'),
        email: tech.email,
        shift: t('supTeam.standardShift', 'Standard Shift'), // Not in schema, keeping generic
        tasksActive: activeAssignments.length,
        tasksCompleted: completedTasks,
        maxTasks: 10,
        tasks: activeAssignments
      }
    }).sort((a, b) => b.tasksActive - a.tasksActive)
  }, [rawTechnicians, workOrders, t])

  const totalTechs = team.length
  const activeTechs = team.filter(t => t.status !== 'offline').length
  const totalTasks = team.reduce((sum, t) => sum + t.tasksActive, 0)

  // Unassigned active work orders to populate assignment dropdown
  const availableWorkOrders = useMemo(() => {
    return workOrders.filter(wo => !['DONE', 'CANCELLED'].includes(wo.status))
  }, [workOrders])

  const assignMutation = useMutation({
    mutationFn: ({ id, data }) => workOrderService.updateWorkOrder(id, data),
    onError: (err) => showToast(err.response?.data?.message || 'Failed to assign task', TOAST_COLORS.error)
  })

  const handleAssignTask = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const woId = formData.get('wo')
    const priority = formData.get('priority')
    
    if (!woId) return showToast(t('supTeam.toastSelectWo'), TOAST_COLORS.error)

    const selectedWO = availableWorkOrders.find(w => w.id === woId)
    const woDisplay = selectedWO?.workOrderNumber || woId.slice(-6).toUpperCase()

    assignMutation.mutate({
      id: woId,
      data: {
        assignedToId: activeTech.id,
        priority: priority
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries(['workOrders'])
        showToast(t('supTeam.toastTaskAssigned', { wo: woDisplay, name: activeTech?.name }), TOAST_COLORS.supervisor)
        setShowAssignModal(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('supTeam.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('supTeam.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg px-4 py-2">
            {[ {s:'online', l:t('supTeam.available')}, {s:'busy', l:t('supTeam.busy')}, {s:'offline', l:t('supTeam.offline')} ].map(lg => (
              <div key={lg.s} className="flex items-center gap-1.5"><StatusDot status={lg.s} className="w-2.5 h-2.5" /><span className="text-[11px] font-semibold text-[var(--text-secondary)]">{lg.l}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-700/10 text-teal-800 dark:bg-[rgba(20,184,166,0.12)] dark:text-[#14B8A6] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{totalTechs}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{t('supTeam.totalTechnicians')}</div></div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-700/10 text-green-800 dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{activeTechs}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{t('supTeam.onShiftActive')}</div></div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{totalTasks}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{t('supTeam.totalActiveTasks')}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.length === 0 && !isLoadingTechs ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-[var(--text-muted)]">
            {t('supTeam.noTechniciansFound', 'No technicians found in your department.')}
          </div>
        ) : team.map(tItem => (
          <Panel key={tItem.id} noPadding className="hover:-translate-y-[2px] hover:border-[#14B8A6] transition-all duration-300 flex flex-col group">
            <div className="p-5 flex items-start gap-4 relative">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[15px] font-bold" style={{ backgroundColor: tItem.color }}>{tItem.initials}</div>
                <StatusDot status={tItem.status} className="w-3.5 h-3.5 absolute bottom-0 end-0 border-2 border-[var(--bg-panel)]" />
              </div>
              <div className="flex-1 min-w-0 pr-5">
                <div className="text-[0.95rem] font-bold text-[var(--text-primary)] truncate">{tItem.name}</div>
                <div className="text-[0.75rem] text-[#14B8A6] truncate mt-0.5" title={tItem.email}>{tItem.email}</div>
                <div className="text-[0.75rem] text-[var(--text-secondary)] truncate mt-0.5">{tItem.phone}</div>
                <div className="mt-2"><StatusPill status={tItem.status} /></div>
              </div>
            </div>
            
            <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-center text-[12.5px] border-b border-[var(--border)] pb-2"><span className="text-[var(--text-muted)] font-semibold">{t('supTeam.tasksCompleted')}</span><span className="text-[var(--text-primary)] font-bold">{tItem.tasksCompleted}</span></div>
              
              <div className="mt-1">
                <div className="flex justify-between items-center mb-1.5"><span className="text-[12px] text-[var(--text-primary)] font-bold">{t('supTeam.activeTasks')}</span><span className="text-[11px] text-[var(--text-secondary)] font-semibold">{tItem.tasksActive}</span></div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((tItem.tasksActive / tItem.maxTasks) * 100, 100)}%`, backgroundColor: tItem.color }}></div>
                </div>
              </div>

              <div className="mt-3 flex-1">
                <div className="text-[0.72rem] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2">{t('supTeam.currentAssignments')}</div>
                {tItem.tasks.length === 0 ? (
                  <div className="py-4 text-center text-[var(--text-muted)] text-[12px] bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">{t('supTeam.noActiveTasks')}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tItem.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border)] p-2 rounded-lg">
                        <div className="text-[11.5px] font-bold text-[#14B8A6] font-mono shrink-0">{task.workOrderNumber || task.id.slice(-6).toUpperCase()}</div>
                        <div className="text-[11.5px] text-[var(--text-secondary)] truncate flex-1" title={task.device?.name || '-'}>{task.device?.name || '-'}</div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-3 px-5 flex gap-2">
              <button onClick={() => { setActiveTech(tItem); setShowAssignModal(true) }} className="flex-1 py-1.5 rounded-lg bg-[rgba(20,184,166,0.1)] border border-teal-700/30 dark:border-[rgba(20,184,166,0.25)] text-[#14B8A6] text-[12.5px] font-bold hover:bg-[rgba(20,184,166,0.15)] transition-colors">{t('supTeam.assignTask')}</button>
            </div>
          </Panel>
        ))}
      </div>

      <Modal
        isOpen={showAssignModal && !!activeTech}
        onClose={() => setShowAssignModal(false)}
        title={activeTech ? t('supTeam.assignTaskTo', { name: activeTech.name }) : t('supTeam.assignTaskModalTitle')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAssignModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="assign-task-form" color="#14B8A6">
              {t('supTeam.assignTask')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="assign-task-form" onSubmit={handleAssignTask} className="flex flex-col gap-4 mt-1">
          <SelectField label={t('supTeam.selectWorkOrder')} name="wo" defaultValue="" placeholder={t('supTeam.selectWOPlaceholder')} options={availableWorkOrders.map(wo => ({ value: wo.id, label: `${wo.workOrderNumber || wo.id.slice(-6).toUpperCase()} — ${wo.device?.name || 'Device'} (${wo.device?.department?.name || 'Dept'})` }))} />
          <SelectField label={t('common.priority')} name="priority" defaultValue="MEDIUM" placeholder="Select Priority" options={[{value: 'HIGH', label: t('priority.high')}, {value: 'MEDIUM', label: t('priority.medium')}, {value: 'LOW', label: t('priority.low')}]} />
          <InputField type="textarea" label={t('supTeam.notesOptional')} name="notes" placeholder={t('supTeam.specialInstructions')} />
        </form>
      </Modal>

    </div>
  )
}
