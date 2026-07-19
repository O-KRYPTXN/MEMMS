import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import DataTable from '../../components/tables/DataTable';
import Panel from '../../components/ui/Panel';
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal';
import InputField from '../../components/forms/InputField';
import { getDepartments, createDepartment, updateDepartment } from '../../api/departmentsService';
import { useToastStore, TOAST_COLORS } from '../../store/toastStore';
import { formatDate } from '../../utils/formatDate';

const StatusBadge = ({ isActive }) => {
  const { t } = useTranslation();
  if (isActive) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-green-100 dark:bg-[rgba(34,197,94,0.15)] text-green-700 dark:text-[#4ADE80] border border-green-200 dark:border-[rgba(34,197,94,0.3)]">{t('common.active', 'Active')}</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-red-100 dark:bg-[rgba(239,68,68,0.15)] text-red-700 dark:text-[#F87171] border border-red-200 dark:border-[rgba(239,68,68,0.3)]">{t('common.inactive', 'Inactive')}</span>;
};

export default function Departments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useToastStore(state => state.showToast);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Form
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Queries
  const { data: departmentsResponse, isLoading, isError } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ all: true })
  });

  const departments = departmentsResponse?.data || [];

  // Mutations
  const addMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast(t('departments.createdSuccess', 'Department created successfully'), TOAST_COLORS.success);
      setShowAddModal(false);
      reset();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('departments.createFailed', 'Failed to create department'), TOAST_COLORS.error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast(t('departments.updatedSuccess', 'Department updated successfully'), TOAST_COLORS.success);
      setShowEditModal(false);
      reset();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('departments.updateFailed', 'Failed to update department'), TOAST_COLORS.error);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateDepartment(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast(t('departments.statusUpdated', 'Department status updated'), TOAST_COLORS.success);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('departments.statusFailed', 'Failed to update status'), TOAST_COLORS.error);
    }
  });

  // Handlers
  const handleAddSubmit = (data) => {
    addMutation.mutate(data);
  };

  const handleEditSubmit = (data) => {
    updateMutation.mutate({ id: selectedDept.id, data });
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setShowEditModal(true);
  };

  const handleToggleStatus = (dept) => {
    toggleStatusMutation.mutate({ id: dept.id, isActive: !dept.isActive });
  };

  // Columns definition
  const columns = [
    {
      key: 'name',
      label: t('departments.name', 'Department Name'),
      render: (_, row) => (
        <span className="text-[var(--text-primary)] font-medium">{row.name}</span>
      )
    },
    {
      key: 'code',
      label: t('departments.code', 'Code'),
      render: (_, row) => (
        <span className="text-[var(--text-secondary)]">{row.code}</span>
      )
    },
    {
      key: 'status',
      label: t('departments.status', 'Status'),
      render: (_, row) => <StatusBadge isActive={row.isActive} />
    },
    {
      key: 'createdAt',
      label: t('common.createdAt', 'Created At'),
      render: (_, row) => <span className="text-[var(--text-secondary)]">{formatDate(row.createdAt)}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={() => handleToggleStatus(row)}
            disabled={toggleStatusMutation.isPending}
            className={clsx(
              "px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-colors disabled:opacity-50 border",
              row.isActive 
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white dark:bg-[rgba(239,68,68,0.1)] dark:text-[#F87171] dark:border-[rgba(239,68,68,0.3)] dark:hover:bg-[#EF4444] dark:hover:text-white" 
                : "bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white dark:bg-[rgba(34,197,94,0.1)] dark:text-[#4ADE80] dark:border-[rgba(34,197,94,0.3)] dark:hover:bg-[#22C55E] dark:hover:text-white"
            )}
          >
            {row.isActive ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="w-7 h-7 rounded-md bg-[rgba(59,130,246,0.1)] text-[#60A5FA] hover:bg-[#3B72F6] hover:text-white flex items-center justify-center transition-colors"
            title={t('common.edit', 'Edit')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('nav.departments', 'Departments')}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{t('departments.subtitle', 'Manage hospital departments and units')}</p>
        </div>
        <button
          onClick={() => { reset(); setShowAddModal(true); }}
          className="h-10 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2563EB] text-white text-sm font-bold tracking-wide transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('departments.add', 'Add Department')}
        </button>
      </div>

      <Panel>
        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          emptyMessage={isError ? t('common.errorLoading', 'Failed to load data') : t('departments.empty', 'No departments found')}
        />
      </Panel>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('departments.add', 'Add Department')}>
        <form onSubmit={handleSubmit(handleAddSubmit)} className="flex flex-col gap-4">
          <InputField
            label={t('departments.name', 'Department Name')}
            error={errors.name?.message}
            {...register('name', { required: t('validation.required', 'This field is required') })}
            placeholder="e.g. Intensive Care Unit"
          />
          <InputField
            label={t('departments.code', 'Code')}
            error={errors.code?.message}
            {...register('code', { required: t('validation.required', 'This field is required') })}
            placeholder="e.g. ICU"
          />
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <ModalCancelBtn onClick={() => setShowAddModal(false)}>{t('common.cancel', 'Cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" isLoading={addMutation.isPending}>{t('common.create', 'Create')}</ModalPrimaryBtn>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={t('departments.edit', 'Edit Department')}>
        <form onSubmit={handleSubmit(handleEditSubmit)} className="flex flex-col gap-4">
          <InputField
            label={t('departments.name', 'Department Name')}
            error={errors.name?.message}
            {...register('name', { required: t('validation.required', 'This field is required') })}
          />
          <InputField
            label={t('departments.code', 'Code')}
            error={errors.code?.message}
            {...register('code', { required: t('validation.required', 'This field is required') })}
          />
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <ModalCancelBtn onClick={() => setShowEditModal(false)}>{t('common.cancel', 'Cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" isLoading={updateMutation.isPending}>{t('common.save', 'Save Changes')}</ModalPrimaryBtn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
