import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { ROUTES } from '../../constants/routes'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import Panel from '../../components/ui/Panel'
import { useTranslation } from 'react-i18next'
import deviceService from '../../api/deviceService'
import * as departmentsService from '../../api/departmentsService'

const categories = ['Respiratory', 'Monitoring', 'Resuscitation', 'Pumps', 'Other']
const statuses = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'MAINTENANCE', label: 'Under Maintenance' },
  { value: 'FAULTY', label: 'Faulty' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' }
]

const secHeaderCls = "text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 pb-2 border-b border-[var(--border)] mt-6 first:mt-0"

export default function SupervisorAddDevice() {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { showToast } = useToastStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: deptsData } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => departmentsService.getDepartments({ all: 'true' })
  })
  const departments = deptsData?.data || []

  const createMutation = useMutation({
    mutationFn: (payload) => deviceService.createDevice(payload),
    onSuccess: () => {
      showToast('✓ Device added successfully!', TOAST_COLORS.success)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['deviceStats'] })
      navigate(ROUTES.SUPERVISOR_DEVICES)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to create device', TOAST_COLORS.error)
    }
  })

  const onSubmit = (data) => {
    createMutation.mutate({
      name: data.deviceName,
      serialNumber: data.serialNumber,
      category: data.category,
      departmentId: data.departmentId,
      purchaseDate: new Date(data.purchaseDate).toISOString(),
      status: data.status,
      notes: data.notes
    })
  }

  return (
    <div className="flex flex-col relative pb-10">
      <div className="max-w-[720px] mx-auto w-full mb-6">
        <button 
          onClick={() => navigate(ROUTES.SUPERVISOR_DEVICES)} 
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2 mb-4 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          {t('addDevice.backToDevices')}
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('addDevice.pageTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('addDevice.pageSubtitle')}</p>
        </div>
      </div>

      <Panel noPadding className="max-w-[720px] mx-auto w-full shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-7 flex flex-col">
            
            {/* Section 1 */}
            <h2 className={secHeaderCls}>{t('addDevice.section1')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={t('addDevice.deviceName')} name="deviceName" {...register('deviceName', { required: 'Device name is required', minLength: 2 })} placeholder={t('addDevice.deviceNamePlaceholder')} required error={errors.deviceName?.message} />
              <InputField label={t('addDevice.serialNumber')} name="serialNumber" {...register('serialNumber', { required: 'Serial number is required', minLength: 1 })} placeholder={t('addDevice.serialNumberPlaceholder')} required error={errors.serialNumber?.message} />
            </div>

            {/* Section 2 */}
            <h2 className={secHeaderCls}>{t('addDevice.section2')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label={t('addDevice.category')} name="category" {...register('category', { required: 'Select a category' })} placeholder={t('addDevice.selectCategory')} options={categories.map(c => ({value: c, label: c}))} required error={errors.category?.message} />
              <SelectField label={t('addDevice.department')} name="departmentId" {...register('departmentId', { required: 'Select a department' })} placeholder={t('addDevice.selectDepartment')} options={departments.map(d => ({value: d.id, label: d.name}))} required error={errors.departmentId?.message} />
            </div>

            {/* Section 3 */}
            <h2 className={secHeaderCls}>{t('addDevice.section3')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField type="date" label={t('addDevice.purchaseDate')} name="purchaseDate" {...register('purchaseDate', { required: 'Purchase date is required' })} required error={errors.purchaseDate?.message} />
              <SelectField label={t('addDevice.currentStatus')} name="status" {...register('status', { required: 'Select initial status' })} placeholder={t('addDevice.selectStatus')} options={statuses} required error={errors.status?.message} />
            </div>

            {/* Section 4 */}
            <h2 className={secHeaderCls}>{t('addDevice.section4')}</h2>
            <InputField type="textarea" label={t('addDevice.notes')} name="notes" {...register('notes')} placeholder={t('addDevice.notesPlaceholder')} />

          </div>

          {/* Footer Actions */}
          <div className="p-5 px-7 border-t border-[var(--border)] bg-[var(--bg-input)] flex justify-end gap-3 rounded-b-xl">
            <button 
              type="button" 
              onClick={() => navigate(ROUTES.SUPERVISOR_DEVICES)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-[var(--text-secondary)] bg-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[140px]"
            >
              {createMutation.isPending ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                t('addDevice.saveDevice')
              )}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
