import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as auditLogsService from '../../api/auditLogsService'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
import { useDebounce } from '../../hooks/useDebounce'
import { useTranslation } from 'react-i18next'

const formatAction = (action) => {
  return action.replace(/_/g, ' ')
}

const AuditLogs = () => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, entityFilter, actionFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, limit, debouncedSearch, entityFilter, actionFilter],
    queryFn: () => auditLogsService.getAuditLogs({ 
      page, 
      limit, 
      search: debouncedSearch, 
      entity: entityFilter, 
      action: actionFilter 
    }),
    keepPreviousData: true
  })

  const columns = useMemo(() => [
    { 
      key: 'createdAt', 
      label: t('admin.audit.timestamp', 'Timestamp'), 
      render: val => <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">{formatDate(val)}</span> 
    },
    { 
      key: 'user', 
      label: t('admin.audit.user', 'User'), 
      render: val => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{val?.name || t('admin.audit.system', 'System')}</div>
          {val?.role && <div className="text-xs text-[var(--text-muted)]">{val.role}</div>}
        </div>
      ) 
    },
    { 
      key: 'action', 
      label: t('admin.audit.action', 'Action'), 
      render: val => <span className="px-2.5 py-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-md text-xs font-medium uppercase tracking-wider">{formatAction(val)}</span> 
    },
    { 
      key: 'entity', 
      label: t('admin.audit.entity', 'Entity'), 
      render: (val, row) => (
        <div>
          <span className="font-medium text-[var(--text-primary)]">{val}</span>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">#{row.entityId}</div>
        </div>
      ) 
    },
    { 
      key: 'description', 
      label: t('admin.audit.description', 'Description'), 
      render: val => <span className="text-[var(--text-secondary)]">{val}</span> 
    },
    {
      key: 'actions',
      label: t('admin.audit.details', 'Details'),
      align: 'right',
      render: (_, row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title={t('admin.audit.viewDetails', 'View Details')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      )
    }
  ], [t])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
          {t('admin.audit.title', 'Audit Logs')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t('admin.audit.subtitle', 'Track system activity and operational compliance')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t('admin.audit.searchPlaceholder', 'Search action, entity, user...')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" 
          />
        </div>
        <select 
          value={entityFilter} 
          onChange={e => setEntityFilter(e.target.value)} 
          className="h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none"
        >
          <option value="">{t('admin.audit.entityAll', 'Entity: All')}</option>
          <option value="WorkOrder">{t('admin.audit.entityWorkOrder', 'WorkOrder')}</option>
          <option value="PMTask">{t('admin.audit.entityPMTask', 'PMTask')}</option>

          <option value="Device">{t('admin.audit.entityDevice', 'Device')}</option>
          <option value="User">{t('admin.audit.entityUser', 'User')}</option>
        </select>
        <select 
          value={actionFilter} 
          onChange={e => setActionFilter(e.target.value)} 
          className="h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none"
        >
          <option value="">{t('admin.audit.actionAll', 'Action: All')}</option>
          <option value="CREATED">{t('admin.audit.actionCreated', 'Created')}</option>
          <option value="UPDATED">{t('admin.audit.actionUpdated', 'Updated')}</option>
          <option value="STATUS_CHANGED">{t('admin.audit.actionStatusChanged', 'Status Changed')}</option>
          <option value="COMPLETED">{t('admin.audit.actionCompleted', 'Completed')}</option>
          <option value="APPROVED">{t('admin.audit.actionApproved', 'Approved')}</option>
          <option value="REJECTED">{t('admin.audit.actionRejected', 'Rejected')}</option>
          <option value="FULFILLED">{t('admin.audit.actionFulfilled', 'Fulfilled')}</option>
          <option value="DELIVERED">{t('admin.audit.actionDelivered', 'Delivered')}</option>
        </select>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          pagination={{
            page,
            limit,
            total: data?.meta?.total || 0,
            totalPages: data?.meta?.totalPages || 1,
            onPageChange: setPage,
            onLimitChange: setLimit
          }}
        />
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t('admin.audit.detailsTitle', 'Audit Log Details')}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{formatDate(selectedLog.createdAt)}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-hover)] p-3 rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('admin.audit.actor', 'Actor')}</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedLog.user?.name || t('admin.audit.system', 'System')}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{selectedLog.user?.role}</div>
                </div>
                <div className="bg-[var(--bg-hover)] p-3 rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('admin.audit.targetEntity', 'Target Entity')}</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedLog.entity}</div>
                  <div className="text-sm font-mono text-[var(--text-secondary)]">#{selectedLog.entityId}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('admin.audit.description', 'Description')}</div>
                <p className="text-[var(--text-primary)]">{selectedLog.description}</p>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('admin.audit.previousState', 'Previous State')}</div>
                  <pre className="bg-[#111827] text-[#A7F3D0] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-[var(--border)]">
                    {typeof selectedLog.oldValue === 'string' && selectedLog.oldValue.startsWith('{') 
                      ? JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)
                      : selectedLog.oldValue}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('admin.audit.newState', 'New State')}</div>
                  <pre className="bg-[#111827] text-[#60A5FA] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-[var(--border)]">
                    {typeof selectedLog.newValue === 'string' && selectedLog.newValue.startsWith('{')
                      ? JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)
                      : selectedLog.newValue}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
