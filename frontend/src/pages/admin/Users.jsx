import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import InputField from '../../components/forms/InputField';
import SelectField from '../../components/forms/SelectField';
import clsx from 'clsx';
import Panel from '../../components/ui/Panel';
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal';
import KPICard from '../../components/ui/KPICard';
import DataTable from '../../components/tables/DataTable';
import { formatDate } from '../../utils/formatDate';
import { useTranslation } from 'react-i18next';
import { getUsers, createUser, updateUser, updateUserStatus } from '../../api/usersService';
import { getDepartments } from '../../api/departmentsService';
import { getRegistrationRequests, approveRegistration, rejectRegistration } from '../../api/registrationService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore, TOAST_COLORS } from '../../store/toastStore';

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getAvatarColor(role) {
  const map = { 'admin': '#3B72F6', 'supervisor': '#10B981', 'technician': '#F59E0B', 'store': '#8B5CF6', 'department': '#EF4444' };
  return map[role?.toLowerCase()] || '#3B72F6';
}

const ROLE_BADGES = {
  admin: 'bg-red-100 dark:bg-[rgba(239,68,68,0.15)] text-red-700 dark:text-[#F87171] border border-red-200 dark:border-[rgba(239,68,68,0.3)]',
  supervisor: 'bg-blue-100 dark:bg-[rgba(59,130,246,0.15)] text-blue-700 dark:text-[#60A5FA] border border-blue-200 dark:border-[rgba(59,130,246,0.3)]',
  technician: 'bg-green-100 dark:bg-[rgba(34,197,94,0.15)] text-green-700 dark:text-[#4ADE80] border border-green-200 dark:border-[rgba(34,197,94,0.3)]',
  store: 'bg-purple-100 dark:bg-[rgba(168,85,247,0.15)] text-purple-700 dark:text-[#D8B4FE] border border-purple-200 dark:border-[rgba(168,85,247,0.3)]',
  department: 'bg-slate-100 dark:bg-[rgba(148,163,184,0.15)] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[rgba(148,163,184,0.3)]'
};

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const lowerRole = role?.toLowerCase() || 'technician';
  const displayRole = lowerRole === 'store' ? 'storekeeper' : lowerRole;
  const cls = ROLE_BADGES[lowerRole] || ROLE_BADGES.technician;
  return <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${cls}`}>{t(`roles.${displayRole}`)}</span>;
};

const PENDING_BADGES = {
  pending: 'bg-orange-100 dark:bg-[rgba(245,158,11,0.15)] text-orange-700 dark:text-[#FCD34D]',
  approved: 'bg-green-100 dark:bg-[rgba(34,197,94,0.15)] text-green-700 dark:text-[#4ADE80]',
  denied: 'bg-red-100 dark:bg-[rgba(239,68,68,0.15)] text-red-700 dark:text-[#F87171]',
};

const PendingStatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const cls = PENDING_BADGES[status?.toLowerCase()] || '';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{t(`status.${status?.toLowerCase()}`)}</span>;
};

const ROWS_PER_PAGE = 10;

const TABS = [
  { tKey: 'users.allRoles', value: 'all' },
  { tKey: 'users.admins', value: 'ADMIN' },
  { tKey: 'roles.supervisor', value: 'SUPERVISOR' },
  { tKey: 'users.technicians', value: 'TECHNICIAN' },

  { tKey: 'users.pendingRequests', value: 'pending' },
];

const ROLE_OPTS = [
  ['', 'all'], ['ADMIN', 'admin'], ['SUPERVISOR', 'supervisor'],
  ['TECHNICIAN', 'technician'], ['DEPARTMENT', 'department']
];

const selectCls = 'h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none';

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const end = Math.min(total, Math.max(cur + 2, 5));
  const start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function Users() {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);
  
  const queryClient = useQueryClient();
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingEditData, setPendingEditData] = useState(null);

  const { register, handleSubmit, reset, watch } = useForm();
  const selectedRole = watch('role');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);
  // Fetch Departments
  const { data: deptsData } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => getDepartments({ all: true })
  });
  const departments = deptsData?.data || [];

  // Fetch Users
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', { page: currentPage, search: debouncedSearch, departmentId: deptFilter, role: activeTab !== 'all' ? activeTab : roleFilter }],
    queryFn: () => getUsers({
      page: currentPage,
      limit: ROWS_PER_PAGE,
      search: debouncedSearch || undefined,
      departmentId: deptFilter || undefined,
      role: activeTab !== 'all' ? activeTab : (roleFilter || undefined),
    }),
    enabled: activeTab !== 'pending',
  });
  const usersData = usersResponse || { items: [], meta: { totalItems: 0, totalPages: 1 } };

  // Fetch Pending Requests (always fetched to get badge count)
  const { data: pendingResponse, isLoading: isLoadingPending } = useQuery({
    queryKey: ['pendingRequests', { page: activeTab === 'pending' ? currentPage : 1, search: debouncedSearch }],
    queryFn: () => getRegistrationRequests({
      page: activeTab === 'pending' ? currentPage : 1,
      limit: activeTab === 'pending' ? ROWS_PER_PAGE : 1,
      status: 'PENDING',
      search: debouncedSearch || undefined,
    }),
  });
  const pendingData = pendingResponse || { items: [], meta: { totalItems: 0, totalPages: 1 } };

  const isLoading = activeTab === 'pending' ? isLoadingPending : isLoadingUsers;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => approveRegistration(id),
    onSuccess: () => {
      showToast('Registration request approved', TOAST_COLORS.success);
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => showToast(err.response?.data?.message || 'Approval failed', TOAST_COLORS.error)
  });
  const handleApprove = (req) => approveMutation.mutate(req.id);

  const denyMutation = useMutation({
    mutationFn: (id) => rejectRegistration(id, "Admin denied your request"),
    onSuccess: () => {
      showToast('Registration request denied', TOAST_COLORS.error);
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
    onError: () => showToast('Denial failed', TOAST_COLORS.error)
  });
  const handleDeny = (req) => denyMutation.mutate(req.id);

  const createMutation = useMutation({
    mutationFn: (data) => createUser(data),
    onSuccess: () => {
      setShowAddModal(false);
      reset();
      showToast('User created successfully', TOAST_COLORS.success);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to create user', TOAST_COLORS.error)
  });
  const onAddSubmit = (data) => createMutation.mutate(data);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      setShowEditModal(false);
      setShowPromotionModal(false);
      setSelectedUser(null);
      setPendingEditData(null);
      showToast('User updated successfully', TOAST_COLORS.success);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to update user', TOAST_COLORS.error)
  });

  const executeEdit = (data) => {
    const payload = {};
    if (data.name) payload.name = data.name;
    if (data.role) payload.role = data.role;
    if (data.department) payload.departmentId = data.department;
    updateMutation.mutate({ id: selectedUser.id, payload });
  };

  const onEditSubmit = (data) => {
    if (data.role === 'ADMIN' && selectedUser?.role !== 'ADMIN' && selectedUser?.id !== currentUser?.id) {
      setPendingEditData(data);
      setShowPromotionModal(true);
    } else {
      executeEdit(data);
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, isSuspended }) => updateUserStatus(id, { isSuspended }),
    onSuccess: (_, variables) => {
      const actionStr = variables.isSuspended ? 'suspended' : 'unsuspended';
      showToast(`User successfully ${actionStr}`, variables.isSuspended ? TOAST_COLORS.warning : TOAST_COLORS.success);
      setShowSuspendModal(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => showToast(err.response?.data?.message || 'Failed to change status', TOAST_COLORS.error)
  });
  const handleSuspendToggle = () => statusMutation.mutate({ id: selectedUser.id, isSuspended: !selectedUser.isSuspended });


  const openAddModal = () => {
    reset({ name: '', email: '', role: '', department: '' });
    setShowAddModal(true);
  };

  useEffect(() => {
    if (showEditModal && selectedUser) {
      reset({ 
        name: selectedUser.name, 
        email: selectedUser.email, 
        role: selectedUser.role, 
        department: selectedUser.department?.id || '' 
      });
    }
  }, [showEditModal, selectedUser, reset]);

  const userColumns = [
    { key: 'name', label: t('users.name'), 
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: getAvatarColor(row.role) }}>
            {getInitials(val)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">{val}</span>
              {row.id === currentUser?.id && (
                <span className="text-[10px] bg-blue-100 dark:bg-[rgba(59,130,246,0.15)] text-blue-700 dark:text-[#3B72F6] px-1.5 py-0.5 rounded font-bold">👤 {t('users.you', 'You')}</span>
              )}
            </div>
            {row.isSuspended && <span className="text-[10px] text-red-500 font-bold">{t('users.suspended', 'SUSPENDED')}</span>}
          </div>
        </div>
      )
    },
    { key: 'email', label: t('users.email') },
    { key: 'phone', label: t('profile.phone', 'Phone Number'), render: val => val || <span className="text-[var(--text-muted)]">—</span> },
    { key: 'role', label: t('users.role'), render: val => <RoleBadge role={val} /> },
    { key: 'department', label: t('users.department'), render: val => val?.name || t('users.systemWide', 'System-wide') },
    { key: 'createdAt', label: t('users.joined', 'Joined'), render: val => formatDate(val) },
    { key: 'id', label: t('users.actions'), align: 'right',
      render: (val, row) => (
        <div className="flex justify-end gap-2">
          {row.id !== currentUser?.id && (
            <button onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowSuspendModal(true); }}
              className={`px-2 py-1 text-[11px] font-semibold rounded-[6px] border ${row.isSuspended ? 'border-[#10B981] text-[#10B981] hover:bg-[rgba(16,185,129,0.1)]' : 'border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]'}`}>
              {row.isSuspended ? t('users.unsuspend') : t('users.suspend')}
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowEditModal(true); }} 
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  const pendingColumns = [
    { key: 'name', label: t('users.name'), 
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: getAvatarColor(row.role) }}>
            {getInitials(val)}
          </div>
          <span className="font-medium text-[var(--text-primary)]">{val}</span>
        </div>
      )
    },
    { key: 'email', label: t('users.email') },
    { key: 'phone', label: t('profile.phone', 'Phone Number'), render: val => val || <span className="text-[var(--text-muted)]">—</span> },
    { key: 'role', label: t('users.role'), render: val => <RoleBadge role={val} /> },
    { key: 'department', label: t('users.department'), render: val => val?.name || t('users.systemWide', 'System-wide') },
    { key: 'submittedAt', label: t('users.submitted', 'Submitted'), render: val => formatDate(val) },
    { key: 'status', label: t('users.status'), render: val => <PendingStatusBadge status={val} /> },
    { key: 'id', label: t('users.actions'), align: 'right',
      render: (val, row) => {
        if (row.status !== 'PENDING') return <span className="text-[var(--text-muted)]">—</span>;
        return (
          <div className="flex justify-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleApprove(row) }} className="px-2.5 py-1 text-[11px] font-semibold rounded-[6px] border border-[#22c55e] text-[#22c55e] hover:bg-[rgba(34,197,94,0.1)]">✓ {t('common.approve', 'Approve')}</button>
            <button onClick={(e) => { e.stopPropagation(); handleDeny(row) }} className="px-2.5 py-1 text-[11px] font-semibold rounded-[6px] border border-[#ef4444] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]">✕ {t('common.reject', 'Deny')}</button>
          </div>
        );
      }
    }
  ];

  const currentData = activeTab === 'pending' ? pendingData : usersData;
  const pageNums = getPageNums(currentPage, currentData.meta.totalPages);
  const start = currentData.meta.totalItems === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(currentPage * ROWS_PER_PAGE, currentData.meta.totalItems);

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        {currentData.meta.totalItems === 0 ? t('users.noResults') : t('users.showingResults', { start, end, total: currentData.meta.totalItems })}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === currentData.meta.totalPages} onClick={() => setCurrentPage(p => p + 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('users.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('users.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('users.totalUsers')} value={usersData.meta.totalItems || 0} iconVariant="blue" iconPath="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        <KPICard title={t('users.pendingRequests')} value={pendingData.meta.totalItems || 0} iconVariant="orange" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('users.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
          {ROLE_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('users.role')}: ${t(`roles.${l}`)}` : t('users.allRoles')}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selectCls}>
          <option value="">{t('users.department')}: {t('common.all')}</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{t('users.department')}: {d.name}</option>
          ))}
        </select>
        <div className="w-[1px] h-[20px] bg-[var(--border)]"></div>
        <button type="button" onClick={openAddModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('users.addUser')}
        </button>
      </div>

      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.tKey || tab.label} type="button" onClick={() => setActiveTab(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === tab.value ? 'text-[var(--text-primary)] border-[#3B72F6]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]')}>
            {tab.tKey ? t(tab.tKey) : tab.label}
            {tab.value === 'pending' && pendingData.meta.totalItems > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#F59E0B] text-[#000] text-[10px] font-bold">
                {pendingData.meta.totalItems}
              </span>
            )}
          </button>
        ))}
      </div>

      <Panel noPadding>
        {activeTab === 'pending' ? (
          <DataTable columns={pendingColumns} data={currentData.items} emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('users.noResults')} />
        ) : (
          <DataTable columns={userColumns} data={currentData.items} emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('users.noResults')} />
        )}
        {renderPagination()}
      </Panel>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        title={showAddModal ? t('users.addUser') : t('users.editUser')}
        maxWidth="28rem"
        footer={
          <>
            <ModalCancelBtn onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="user-form" color="#3B72F6" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? t('common.loading') : t('common.save')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(showAddModal ? onAddSubmit : onEditSubmit)} className="flex flex-col gap-4">
          
          {showEditModal && selectedUser?.role === 'ADMIN' && selectedRole !== 'ADMIN' && selectedUser?.id !== currentUser?.id && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-orange-500 text-[13px] font-medium">
              {t('users.requireSigninForPermissions', 'This user will be required to sign in again for the new permissions to take effect.')}
            </div>
          )}

          <InputField label={t('users.name')} name="name" {...register('name', { required: true })} placeholder="e.g. John Doe" required />
          <InputField type="email" label={t('users.email')} name="email" {...register('email', { required: showAddModal })} placeholder="e.g. jdoe@hospital.com" required={showAddModal} disabled={showEditModal} />

          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField 
              label={t('users.role')} 
              name="role" 
              {...register('role', { required: true })} 
              placeholder="Select Role" 
              options={ROLE_OPTS.slice(1).map(([v, l]) => ({value: v, label: t(`roles.${l}`)}))} 
              required 
              disabled={showEditModal && selectedUser?.id === currentUser?.id}
            />
            {selectedRole !== 'ADMIN' && (
              <SelectField 
                label={t('users.department')} 
                name="department" 
                {...register('department')} 
                placeholder="Select Department" 
                options={departments.map(d => ({value: d.id, label: d.name}))} 
              />
            )}
          </div>
        </form>
      </Modal>

      {/* Promotion Confirmation Modal */}
      <Modal
        isOpen={showPromotionModal}
        onClose={() => { setShowPromotionModal(false); setPendingEditData(null); }}
        title={t('users.promoteToAdminTitle', 'Promote to Administrator?')}
        maxWidth="24rem"
        footer={
          <>
            <ModalCancelBtn onClick={() => { setShowPromotionModal(false); setPendingEditData(null); }}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={() => executeEdit(pendingEditData)} color="#3B72F6" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.loading') : t('users.promoteBtn', 'Yes, Promote')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <p className="text-[0.875rem] text-[var(--text-secondary)]">
          {t('users.promoteDesc', 'Are you sure you want to promote')} <strong>{selectedUser?.name}</strong> {t('users.toAdministrator', 'to Administrator? They will have full access to all departments, system settings, and user management.')}
        </p>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => { setShowSuspendModal(false); setSelectedUser(null); }}
        title={selectedUser?.isSuspended ? t('users.unsuspendUser') : t('users.suspendUser')}
        maxWidth="24rem"
        footer={
          <>
            <ModalCancelBtn onClick={() => { setShowSuspendModal(false); setSelectedUser(null); }}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={handleSuspendToggle} color={selectedUser?.isSuspended ? '#10B981' : '#EF4444'} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? t('common.loading') : (selectedUser?.isSuspended ? t('users.confirmUnsuspend') : t('users.confirmSuspend'))}
            </ModalPrimaryBtn>
          </>
        }
      >
        <p className="text-[0.875rem] text-[var(--text-secondary)]">
          {t('users.suspendConfirmQ', 'Are you sure you want to')} {selectedUser?.isSuspended ? t('users.unsuspend').toLowerCase() : t('users.suspend').toLowerCase()} <strong>{selectedUser?.name}</strong>? 
          {!selectedUser?.isSuspended && t('users.suspendWarning', ' They will immediately lose access to the system and their current session will be terminated.')}
        </p>
      </Modal>
    </div>
  );
}
