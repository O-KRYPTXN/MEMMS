import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import { ROUTES } from '../../constants/routes'
import { useTranslation } from 'react-i18next'
import deviceService from '../../api/deviceService'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import * as departmentsService from '../../api/departmentsService'

const ROWS_PER_PAGE = 5

// Status maps
const STATUS_OPTIONS = [
  { value: 'OPERATIONAL', tKey: 'status.operational', color: 'green' },
  { value: 'FAULTY', tKey: 'status.faulty', color: 'red' },
  { value: 'MAINTENANCE', tKey: 'status.maintenance', color: 'orange' },
  { value: 'DECOMMISSIONED', tKey: 'status.decommissioned', color: 'gray' },
]

const TABS = [
  { tKey: 'devices.tabAll', value: '' },
  { tKey: 'status.operational', value: 'OPERATIONAL' },
  { tKey: 'status.faulty', value: 'FAULTY' },
  { tKey: 'devices.tabMaintenance', value: 'MAINTENANCE' },
  { tKey: 'devices.tabRetired', value: 'DECOMMISSIONED' },
]

// Icons
const ICON_GRID = 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
const ICON_CHECK = 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
const ICON_WARN = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
const ICON_WRENCH = 'M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1h12.76'
const ICON_TABLE = 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5'

const selectCls = 'h-9 px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem]'
const monoCls = 'font-mono text-[var(--text-muted)]'

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const Devices = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()
  
  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  
  const [view, setView] = useState('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [viewDevice, setViewDevice] = useState(null)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDevice, setEditDevice] = useState(null)
  const { register, handleSubmit, reset } = useForm()

  const [showRetireModal, setShowRetireModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [actionDevice, setActionDevice] = useState(null)
  const { register: retireRegister, handleSubmit: retireHandleSubmit, reset: retireReset, formState: { errors: retireErrors } } = useForm()
  const { register: restoreRegister, handleSubmit: restoreHandleSubmit, reset: restoreReset } = useForm()

  const { data: deptsData } = useQuery({
    queryKey: ['departmentOptions'],
    queryFn: () => departmentsService.getDepartmentOptions()
  })
  const departments = deptsData?.data || []

  const invalidateDevices = () => {
    queryClient.invalidateQueries({ queryKey: ['devices'] })
    queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
  }

  const updateMutation = useMutation({
    mutationFn: (data) => deviceService.updateDevice(editDevice.id, data),
    onSuccess: () => {
      showToast(t('common.toastSaved', 'Saved successfully'), TOAST_COLORS.admin)
      setShowEditModal(false)
      invalidateDevices()
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('common.toastError', 'An error occurred'), TOAST_COLORS.error)
    }
  })

  const retireMutation = useMutation({
    mutationFn: ({ id, reason }) => deviceService.retireDevice(id, reason),
    onSuccess: () => {
      showToast('Device retired successfully', TOAST_COLORS.admin)
      setShowRetireModal(false)
      invalidateDevices()
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to retire device', TOAST_COLORS.error)
    }
  })

  const restoreMutation = useMutation({
    mutationFn: ({ id, status }) => deviceService.restoreDevice(id, status),
    onSuccess: () => {
      showToast('Device restored successfully', TOAST_COLORS.admin)
      setShowRestoreModal(false)
      invalidateDevices()
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to restore device', TOAST_COLORS.error)
    }
  })

  const openEdit = useCallback((row) => {
    setEditDevice(row)
    reset({
      name: row.name,
      category: row.category,
      serialNumber: row.serialNumber,
      departmentId: row.departmentId,
      purchaseDate: row.purchaseDate ? row.purchaseDate.split('T')[0] : '',
      notes: row.notes || ''
    })
    setShowEditModal(true)
  }, [reset])

  const openRetire = useCallback((row) => {
    setActionDevice(row)
    retireReset({ reason: '' })
    setShowRetireModal(true)
  }, [retireReset])

  const openRestore = useCallback((row) => {
    setActionDevice(row)
    restoreReset({ status: 'OPERATIONAL' })
    setShowRestoreModal(true)
  }, [restoreReset])

  const onEditSubmit = (data) => {
    const payload = { ...data }
    if (payload.purchaseDate) {
      payload.purchaseDate = new Date(payload.purchaseDate).toISOString()
    } else {
      payload.purchaseDate = undefined
    }
    updateMutation.mutate(payload)
  }

  // Hardcode categories for now, or fetch dynamically if needed
  const categories = ['Respiratory', 'Monitoring', 'Resuscitation', 'Pumps', 'Other']

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
    queryKey: ['devices', { page: currentPage, search: debouncedSearch, status: activeTab || statusFilter, category: categoryFilter }],
    queryFn: () => deviceService.getDevices({
      page: currentPage,
      limit: ROWS_PER_PAGE,
      search: debouncedSearch || undefined,
      status: activeTab || statusFilter || undefined,
      category: categoryFilter || undefined,
    }),
  })

  const devices = data?.items || []
  const meta = data?.meta || { totalItems: 0, totalPages: 1 }

  const openDevice = useCallback((row) => { setViewDevice(row); setShowModal(true) }, [])

  const columns = useMemo(() => [
    { key: 'assetCode', label: t('devices.assetId'), render: (val) => <span className={monoCls}>{val}</span> },
    { key: 'name', label: t('devices.deviceName'), primary: true },
    { key: 'category', label: t('devices.category') },
    { key: 'serialNumber', label: t('devices.serialNo'), render: (val) => <span className={monoCls}>{val}</span> },
    { key: 'department', label: t('devices.department'), render: (val) => val?.name || '—' },
    { key: 'status', label: t('devices.status'), render: (val) => <StatusBadge variant={val.toLowerCase()} label={t(`status.${val?.toLowerCase()}`)} /> },
    { key: 'lastPmDate', label: t('devices.lastPM'), render: (val) => formatDate(val) },
    { key: 'nextPmDate', label: t('devices.nextPM'), render: (val) => formatDate(val) },
    { key: 'actions', label: t('devices.actions'), render: (_, row) => (
      <div className="flex items-center gap-2">
        {/* View */}
        <button type="button" onClick={(e) => { e.stopPropagation(); openDevice(row) }}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="View details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {/* Edit — disabled for decommissioned */}
        <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row) }}
          disabled={row.status === 'DECOMMISSIONED'}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#3B72F6] hover:bg-blue-50 dark:hover:bg-[rgba(59,114,246,0.1)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={row.status === 'DECOMMISSIONED' ? 'Restore device to edit' : 'Edit device'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </button>
        {/* Retire / Restore */}
        {row.status === 'DECOMMISSIONED' ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); openRestore(row) }}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-[rgba(16,185,129,0.1)] transition-colors"
            title="Restore device">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
        ) : (
          <button type="button" onClick={(e) => { e.stopPropagation(); openRetire(row) }}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-[rgba(239,68,68,0.1)] transition-colors"
            title="Retire device">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
        )}
      </div>
    ) },
  ], [openDevice, openEdit, openRetire, openRestore, t])

  const handleTab = (value) => { setActiveTab(value); setStatusFilter(''); setCurrentPage(1) }

  const startIdx = meta.totalItems === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const endIdx = Math.min(currentPage * ROWS_PER_PAGE, meta.totalItems)
  const pageNums = getPageNums(currentPage, meta.totalPages)

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        {meta.totalItems === 0 ? t('devices.noDevicesFound') : t('devices.showingResults', { start: startIdx, end: endIdx, total: meta.totalItems })}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1 || isLoading} onClick={() => setCurrentPage((p) => p - 1)}
          className={clsx('w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default')}>‹</button>
        {pageNums.map((n) => (
          <button key={n} type="button" disabled={isLoading} onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-50')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === meta.totalPages || isLoading || meta.totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)}
          className={clsx('w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default')}>›</button>
      </div>
    </div>
  )

  const modalFields = viewDevice && [
    [t('devices.deviceId'), viewDevice.assetCode], [t('devices.name'), viewDevice.name], [t('devices.category'), viewDevice.category],
    [t('devices.serialNo'), viewDevice.serialNumber], [t('devices.department'), viewDevice.department?.name || '—'],
    [t('devices.status'), <StatusBadge key="s" variant={viewDevice.status.toLowerCase()} label={t(`status.${viewDevice.status?.toLowerCase()}`)} />], [t('devices.lastPM'), formatDate(viewDevice.lastPmDate)], [t('devices.nextPMDue'), formatDate(viewDevice.nextPmDate)],
  ]

  const getTabCount = (val) => {
    if (val === '') return stats.total;
    if (val === 'OPERATIONAL') return stats.operational;
    if (val === 'FAULTY') return stats.faulty;
    if (val === 'MAINTENANCE') return stats.maintenance;
    if (val === 'DECOMMISSIONED') return stats.decommissioned;
    return 0;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('devices.catalogTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('devices.catalogSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title={t('devices.totalDevices')} value={stats.total} iconPath={ICON_GRID} iconVariant="blue" />
        <KPICard title={t('devices.operational')} value={stats.operational} iconPath={ICON_CHECK} iconVariant="green" />
        <KPICard title={t('devices.faulty')} value={stats.faulty} iconPath={ICON_WARN} iconVariant="red" danger />
        <KPICard title={t('devices.underMaintenance')} value={stats.maintenance} iconPath={ICON_WRENCH} iconVariant="orange" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 w-60 h-9 px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg focus-within:border-[#3B72F6]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('devices.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className={selectCls}>
          <option value="">{t('devices.allStatuses')}</option>
          {STATUS_OPTIONS.map((opt) => (
             <option key={opt.value} value={opt.value}>{t(opt.tKey)}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className={selectCls}>
          <option value="">{t('devices.allCategories')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="w-px h-6 bg-[var(--border)]" />
        <div className="flex gap-1">
          {['table', 'grid'].map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} title={v === 'table' ? t('devices.tableView') : t('devices.gridView')} aria-label={v === 'table' ? t('devices.tableView') : t('devices.gridView')}
              className={clsx('w-8 h-8 rounded-md flex items-center justify-center', view === v ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={v === 'table' ? ICON_TABLE : ICON_GRID} />
              </svg>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate(ROUTES.ADMIN_ADD_DEVICE)}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors ml-auto shadow-sm shadow-blue-500/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('devices.addDevice')}
        </button>
      </div>

      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.tKey} type="button" onClick={() => handleTab(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.value ? 'text-[var(--text-primary)] border-[#3B72F6]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]')}>
            {t(tab.tKey)}
            <span className="ms-1.5 px-[7px] py-px rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] text-[0.7rem]">{getTabCount(tab.value)}</span>
          </button>
        ))}
      </div>

      <Panel noPadding>
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-[var(--text-muted)]">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : view === 'table' ? (
          <DataTable columns={columns} data={devices} emptyMessage={t('devices.noResults')} />
        ) : devices.length === 0 ? (
          <p className="py-8 text-center text-[0.8125rem] text-[var(--text-muted)]">{t('devices.noResults')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {devices.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{d.name}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-mono">{d.assetCode} · {d.serialNumber}</div></div>
                  <StatusBadge variant={d.status.toLowerCase()} label={t(`status.${d.status?.toLowerCase()}`)} />
                </div>
                <div className="flex justify-between text-[0.8rem]"><span className="text-[var(--text-muted)]">{t('devices.department')}</span><span className="text-[var(--text-primary)]">{d.department?.name || '—'}</span></div>
                <div className="flex justify-between text-[0.8rem]"><span className="text-[var(--text-muted)]">{t('devices.category')}</span><span className="text-[var(--text-primary)]">{d.category}</span></div>
                <div className="flex justify-between pt-3 border-t border-[var(--border)]"><span className="text-[0.75rem] text-[var(--text-muted)]">{t('devices.nextPM')}</span><span className="text-[0.8rem] font-semibold text-[var(--text-primary)]">{formatDate(d.nextPmDate)}</span></div>
              </div>
            ))}
          </div>
        )}
        {renderPagination()}
      </Panel>

      <Modal
        isOpen={showModal && !!viewDevice}
        onClose={() => setShowModal(false)}
        title={t('devices.deviceDetails')}
        maxWidth="400px"
        footer={<ModalCancelBtn onClick={() => setShowModal(false)}>{t('devices.close')}</ModalCancelBtn>}
      >
        <div className="grid grid-cols-2 gap-3 mt-2">
          {modalFields?.map(([label, val]) => (
            <div key={label}><div className="text-[0.75rem] text-[var(--text-muted)]">{label}</div><div className="text-[var(--text-primary)] font-semibold mt-0.5">{val}</div></div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal && !!editDevice}
        onClose={() => setShowEditModal(false)}
        title={t('devices.editDevice', 'Edit Device')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowEditModal(false)}>{t('common.cancel', 'Cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="edit-device-form" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.loading', 'Loading...') : t('common.save', 'Save Changes')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="edit-device-form" onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4 mt-2">
          <InputField label={t('devices.deviceName', 'Device Name')} {...register('name', { required: true })} required />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label={t('devices.category', 'Category')} {...register('category', { required: true })} required options={categories} />
            <InputField label={t('devices.serialNo', 'Serial Number')} {...register('serialNumber', { required: true })} required />
          </div>
          <SelectField label={t('devices.department', 'Department')} {...register('departmentId', { required: true })} required options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <InputField type="date" label={t('devices.purchaseDate', 'Purchase Date')} {...register('purchaseDate')} />
          <InputField type="textarea" label={t('devices.notes', 'Notes')} {...register('notes')} />
        </form>
      </Modal>

      {/* ── Retire Device Modal ──────────────────────────────── */}
      <Modal
        isOpen={showRetireModal && !!actionDevice}
        onClose={() => setShowRetireModal(false)}
        title="Retire Device"
        maxWidth="440px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowRetireModal(false)}>Cancel</ModalCancelBtn>
            <ModalPrimaryBtn
              type="submit"
              form="retire-device-form"
              disabled={retireMutation.isPending}
              color="#DC2626"
            >
              {retireMutation.isPending ? 'Retiring...' : 'Retire Device'}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="retire-device-form" onSubmit={retireHandleSubmit((data) => retireMutation.mutate({ id: actionDevice.id, reason: data.reason }))} className="flex flex-col gap-4 mt-1">
          {/* Warning notice */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-[0.8125rem] font-semibold text-amber-600 dark:text-amber-400 mb-1">Retire Device — {actionDevice?.name}?</p>
            <p className="text-[0.775rem] text-amber-700 dark:text-amber-300 leading-relaxed">
              This device will be removed from active maintenance operations.
              New work orders, fault reports, and preventive maintenance tasks cannot be created until the device is restored.
              Historical maintenance records will be preserved.
            </p>
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">Retirement Reason <span className="text-red-500">*</span></label>
            <select {...retireRegister('reason', { required: 'Reason is required' })} className={clsx(selectCls, 'w-full h-9')}>
              <option value="">Select a reason...</option>
              <option value="Beyond economical repair">Beyond economical repair</option>
              <option value="End of lifecycle">End of lifecycle</option>
              <option value="Replaced by new equipment">Replaced by new equipment</option>
              <option value="Obsolete technology">Obsolete technology</option>
              <option value="Safety concerns">Safety concerns</option>
            </select>
            {retireErrors.reason && <p className="mt-1 text-[0.75rem] text-red-500">{retireErrors.reason.message}</p>}
          </div>
        </form>
      </Modal>

      {/* ── Restore Device Modal ──────────────────────────────── */}
      <Modal
        isOpen={showRestoreModal && !!actionDevice}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Device"
        maxWidth="440px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowRestoreModal(false)}>Cancel</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="restore-device-form" disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? 'Restoring...' : 'Restore Device'}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="restore-device-form" onSubmit={restoreHandleSubmit((data) => restoreMutation.mutate({ id: actionDevice.id, status: data.status }))} className="flex flex-col gap-4 mt-1">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-[0.8125rem] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Restore — {actionDevice?.name}</p>
            <p className="text-[0.775rem] text-emerald-700 dark:text-emerald-300 leading-relaxed">
              Confirm that this device has been inspected and is ready to re-enter active maintenance operations.
              Select its current operational condition below.
            </p>
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">Current Device Condition <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...restoreRegister('status', { required: true })} value="OPERATIONAL" className="accent-[#3B72F6]" />
                <span className="text-[0.8125rem] text-[var(--text-primary)]">Operational</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...restoreRegister('status', { required: true })} value="FAULTY" className="accent-[#3B72F6]" />
                <span className="text-[0.8125rem] text-[var(--text-primary)]">Faulty</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Devices
