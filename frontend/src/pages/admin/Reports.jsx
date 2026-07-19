import React, { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as reportsService from '../../api/reportsService'

const FAULT_COLORS = ['#4ADE80', '#FCD34D', '#3B82F6', '#F87171', '#C084FC']

// We only support specific report types for the MVP
const quickReports = [
  { icon: '#8B5CF6', label: 'Comprehensive General Report', sub: 'All metrics combined', format: 'PDF', category: 'COMPLIANCE' },
  { icon: '#3b82f6', label: 'Preventive Maintenance Performance', sub: 'Compliance & Workloads', format: 'PDF', category: 'MAINTENANCE' },
  { icon: '#F87171', label: 'Fault Analysis Report', sub: 'Device failure rates & trends', format: 'PDF', category: 'EQUIPMENT' },
  { icon: '#4ADE80', label: 'Technician Performance Report', sub: 'Work order distribution', format: 'PDF', category: 'MAINTENANCE' }
];

function FormatBadge({ format }) {
  const map = {
    PDF: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171] border-red-700/30 dark:border-[rgba(239,68,68,0.25)]',
    EXCEL: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80] border-green-700/30 dark:border-[rgba(34,197,94,0.25)]',
    CSV: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] border-yellow-700/30 dark:border-[rgba(245,158,11,0.25)]',
  }
  const cls = map[format] || 'bg-slate-700/10 text-slate-800 dark:bg-[rgba(148,163,184,0.12)] dark:text-[#94A3B8] border-[rgba(148,163,184,0.25)]'
  return <span className={`inline-block px-2 py-[1px] rounded-[4px] text-[10px] uppercase font-bold tracking-wide border ${cls}`}>{format}</span>
}

function CategoryBadge({ category }) {
  const map = {
    EQUIPMENT: 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA]',
    MAINTENANCE: 'bg-[rgba(168,85,247,0.15)] text-[#D8B4FE]',

    FINANCIAL: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]',
    COMPLIANCE: 'bg-[rgba(248,113,113,0.15)] text-[#F87171]',
  }
  const cls = map[category] || 'bg-[rgba(148,163,184,0.15)] text-[#94A3B8]'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {category}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    PENDING: 'text-[#FCD34D]',
    COMPLETED: 'text-[#4ADE80]',
    FAILED: 'text-[#F87171]'
  }
  return <span className={`font-bold text-[10px] uppercase ${map[status] || 'text-gray-400'}`}>{status}</span>
}

const ROWS_PER_PAGE = 8

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const selectCls = 'h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none'

export default function Reports() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { showToast } = useToastStore()

  const { data: dashboard, isLoading: isDashLoading } = useQuery({
    queryKey: ['reportsAnalytics'],
    queryFn: reportsService.getAnalyticsMetrics
  });

  const { data: reportsData, isLoading: isReportsLoading } = useQuery({
    queryKey: ['reportsList', currentPage, search, categoryFilter, formatFilter],
    queryFn: () => reportsService.getReports({
      page: currentPage,
      limit: ROWS_PER_PAGE,
      search,
      category: categoryFilter || undefined,
      format: formatFilter || undefined
    })
  });

  const reportsList = reportsData?.data || [];
  const meta = reportsData?.meta || { total: 0, totalPages: 1 };
  const totalPages = Math.max(1, meta.totalPages);

  useEffect(() => setCurrentPage(1), [search, categoryFilter, formatFilter])

  const generateMutation = useMutation({
    mutationFn: reportsService.generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries(['reportsList'])
      showToast('Report generated successfully!', TOAST_COLORS.success)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to generate report', TOAST_COLORS.error)
    }
  });

  const handleQuickGenerate = (req) => {
    generateMutation.mutate({
      title: req.label,
      category: req.category,
      format: req.format
    })
  }

  const handleDownload = async (report) => {
    if (report.status !== 'COMPLETED') {
      showToast('Report is not completed yet.', TOAST_COLORS.error);
      return;
    }
    showToast(`Downloading ${report.title}...`, TOAST_COLORS.admin);
    try {
      const blob = await reportsService.downloadReportBlob(report.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RPT-${report.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      showToast('Failed to download file.', TOAST_COLORS.error);
    }
  }

  const columns = useMemo(() => [
    { key: 'id', label: t('reports.reportId', 'ID'), render: (val) => <span className="font-mono text-[#3B82F6] font-semibold text-xs">{val.slice(-6).toUpperCase()}</span> },
    { key: 'title', label: t('reports.reportName', 'Name'), render: val => <div className="truncate max-w-[260px] font-medium text-[var(--text-primary)]">{val}</div> },
    { key: 'category', label: t('reports.category', 'Category'), render: val => <CategoryBadge category={val} /> },
    { key: 'format', label: t('reports.format', 'Format'), render: val => <FormatBadge format={val} /> },
    { key: 'status', label: t('common.status', 'Status'), render: val => <StatusBadge status={val} /> },
    { key: 'generatedAt', label: t('reports.date', 'Date'), render: val => <span className="text-[#94A3B8]">{formatDate(val)}</span> },
    { key: 'requestedBy', label: t('reports.generatedBy', 'By'), render: val => val?.name || 'System' },
    { key: 'sizeBytes', label: t('reports.size', 'Size'), render: val => val ? <span className="text-[var(--text-muted)] text-xs font-mono">{(val / 1024).toFixed(1)} KB</span> : '-' },
    { key: 'actions', label: t('reports.actions', 'Actions'), align: 'right',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <button 
            onClick={() => handleDownload(row)} 
            disabled={row.status !== 'COMPLETED'}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50" 
            title={t('reports.download', 'Download')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
        </div>
      )
    }
  ], [t])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        {meta.total === 0 ? t('reports.noReports', 'No reports') : t('reports.showingResults', 'Showing results')} ({meta.total} total)
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {getPageNums(currentPage, totalPages).map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)} className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-panel)] border border-[var(--border)] p-2 rounded shadow-lg text-xs">
          <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const kpis = dashboard?.kpis || { totalDevices: 0, criticalAlerts: 0, woCompletionRate: '0%', recordsTracked: 0 };
  const complianceData = dashboard?.complianceData || [];
  const faultData = dashboard?.faultData || [];
  const categoryData = dashboard?.categoryData || [];
  const sparePartsData = dashboard?.sparePartsData || [];

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('reports.pageTitle', 'Analytics & Reports')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('reports.pageSubtitle', 'System-wide insights and exportable analytical reports.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('reports.recordsTracked', 'Records')} value={kpis.recordsTracked} iconVariant="blue" iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        <KPICard title={t('reports.woCompletionRate', 'WO Completion')} value={kpis.woCompletionRate} iconVariant="green" iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KPICard title={t('reports.totalDevices', 'Devices')} value={kpis.totalDevices} iconVariant="orange" iconPath="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
        <KPICard title={t('reports.criticalAlerts', 'Alerts')} value={kpis.criticalAlerts} danger={kpis.criticalAlerts > 0} iconVariant="red" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </div>

      {isDashLoading ? (
        <div className="text-center py-10 text-[var(--text-muted)]">{t('common.loading', 'Loading charts...')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Panel padding="p-5" className="lg:col-span-2 flex flex-col">
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-4">{t('reports.pmComplianceTrend', 'PM Compliance Trend')}</div>
            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={90} stroke="#F87171" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel padding="p-5" className="lg:col-span-1 flex flex-col items-center">
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-4 w-full text-left">{t('reports.monthlyFaultSummary', 'Faults by Department')}</div>
            <div className="relative w-full flex-1 flex items-center justify-center min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={faultData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value" stroke="none">
                    {faultData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FAULT_COLORS[index % FAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[var(--text-primary)]">{faultData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">{t('admin.reports.faults', 'Faults')}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap justify-center">
              {faultData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FAULT_COLORS[i % FAULT_COLORS.length] }}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </Panel>

          <Panel padding="p-5" className="lg:col-span-2 flex flex-col">
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-4">{t('reports.wosByCategory', 'Work Orders by Device Category')}</div>
            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.4 }} content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey="completed" name="Completed WOs" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="open" name="Open WOs" stackId="a" fill="#3B72F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel padding="p-5" className="lg:col-span-1 flex flex-col">
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-5">{t('reports.sparePartsConsumption', 'Lowest Stock Parts')}</div>
            <div className="flex flex-col gap-4 flex-1 justify-center">
              {sparePartsData.length === 0 && <span className="text-sm text-[var(--text-muted)]">{t('admin.reports.noPartsData', 'No parts data')}</span>}
              {sparePartsData.map((part) => (
                <div key={part.name} className="w-full">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[12px] font-medium text-[var(--text-primary)]">{part.name}</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">{part.count} <span className="text-[var(--text-muted)] font-normal">/ {part.max}</span></span>
                  </div>
                  <div className="w-full h-[6px] rounded-full bg-[var(--bg-input)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((part.count / part.max) * 100, 100)}%`, backgroundColor: part.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 mt-2">
        <Panel noPadding className="flex flex-col">
          <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-[220px] h-[34px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[14px] h-[14px] text-[var(--text-muted)] shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('reports.searchPlaceholder', 'Search...')}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectCls + " h-[34px]"}>
              <option value="">{t('reports.allCategories', 'All Categories')}</option>
              <option value="EQUIPMENT">{t('admin.reports.categoryEquipment', 'Equipment')}</option>
              <option value="MAINTENANCE">{t('admin.reports.categoryMaintenance', 'Maintenance')}</option>

              <option value="FINANCIAL">{t('admin.reports.categoryFinancial', 'Financial')}</option>
              <option value="COMPLIANCE">{t('admin.reports.categoryCompliance', 'Compliance')}</option>
            </select>
          </div>
          <div className="flex-1">
            <DataTable columns={columns} data={reportsList} isLoading={isReportsLoading} emptyMessage={t('reports.noReports', 'No reports found')} />
          </div>
          {renderPagination()}
        </Panel>

        <Panel noPadding className="flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)]">{t('reports.generateReport', 'Generate PDF Report')}</div>
          </div>
          <div className="flex flex-col p-2 gap-1 overflow-y-auto max-h-[460px]">
            {quickReports.map((r, i) => (
              <button 
                key={i} 
                onClick={() => handleQuickGenerate(r)} 
                disabled={generateMutation.isPending}
                className="group flex items-center text-left gap-3 p-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: `${r.icon}18`, color: r.icon }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">{r.label}</div>
                  <div className="text-[0.7rem] text-[var(--text-muted)] truncate mt-0.5">{r.sub}</div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <FormatBadge format={r.format} />
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
