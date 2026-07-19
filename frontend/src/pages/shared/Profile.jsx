import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { ROLES } from '../../constants/roles'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useTranslation } from 'react-i18next'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import ThemeToggle from '../../components/ui/ThemeToggle'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const getRoleMap = (t) => ({
  [ROLES.ADMIN]: t('profile.roleAdmin'),
  [ROLES.SUPERVISOR]: t('profile.roleSupervisor'),
  [ROLES.TECHNICIAN]: t('profile.roleTechnician'),
  [ROLES.DEPARTMENT]: t('profile.roleDepartment'),

})

const Toggle = ({ id, checked, onChange }) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} />
    <div className="w-11 h-6 bg-[var(--bg-hover)] border border-[var(--border)] rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:border-[var(--border)] after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-[#3B72F6]"></div>
  </label>
)

export default function Profile() {
  const { t } = useTranslation()
  const user = useAuthStore(state => state.user)
  const updateProfile = useAuthStore(state => state.updateProfile)
  const changePassword = useAuthStore(state => state.changePassword)
  const { showToast } = useToastStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [toggles, setToggles] = useState({ 
    twoFactor: false, darkTheme: true 
  })

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').split(' ')
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ') || ''
      setProfileForm({ firstName: first, lastName: last, email: user.email || '', phone: user.phone || '' })
    }
  }, [user])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (profileForm.phone && !/^01[0125][0-9]{8}$/.test(profileForm.phone)) {
      showToast(t('profile.toastInvalidPhone', 'Please provide a valid Egyptian phone number (e.g. 01012345678)'), TOAST_COLORS.error);
      return;
    }
    const result = await updateProfile(profileForm)
    if (result.success) {
      showToast(t('profile.toastProfileUpdated', 'Profile updated successfully'), TOAST_COLORS.success)
    } else {
      showToast(result.message, TOAST_COLORS.error)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      showToast(t('profile.toastPasswordMismatch', 'Passwords do not match'), TOAST_COLORS.error)
      return
    }
    const result = await changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.new
    })
    if (result.success) {
      showToast(t('profile.toastPasswordUpdated', 'Password updated successfully'), TOAST_COLORS.success)
      setPasswords({ current: '', new: '', confirm: '' })
    } else {
      showToast(result.message, TOAST_COLORS.error)
    }
  }

  const toggleSetting = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const tabs = [
    { id: 'profile', label: t('profile.tabMyProfile'), icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
    { id: 'security', label: t('profile.tabSecurity'), icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> },
    { id: 'app', label: t('profile.tabApplication'), icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /> }
  ]

  const readableRole = user?.role ? (getRoleMap(t)[user.role] || user.role) : t('profile.roleUnknown')

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('profile.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('profile.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 mt-2">
        <Panel className="!p-3 flex flex-col gap-1 self-start">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors text-left",
                activeTab === t.id ? "bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#5E8FFF] font-semibold" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
                {t.icon}
              </svg>
              {t.label}
            </button>
          ))}
        </Panel>

        <Panel className="px-7 py-6 min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('profile.tabMyProfile')}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 mb-6 pb-4 border-b border-[var(--border)]">{t('profile.myProfileDesc')}</p>
              
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-8 gap-4 w-full">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-xl font-bold text-[var(--text-muted)] overflow-hidden border border-[var(--border)]"
                  >
                    {user?.initials}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label={t('profile.firstName')} value={profileForm.firstName} onChange={e => setProfileForm(f => ({...f, firstName: e.target.value}))} required />
                <InputField label={t('profile.lastName')} value={profileForm.lastName} onChange={e => setProfileForm(f => ({...f, lastName: e.target.value}))} required />
                <div className="sm:col-span-2">
                  <InputField type="email" label={t('profile.emailAddress')} value={profileForm.email} onChange={e => setProfileForm(f => ({...f, email: e.target.value}))} required />
                </div>
                <div className="sm:col-span-2">
                  <InputField type="tel" label={t('profile.phone', 'Phone Number')} value={profileForm.phone} onChange={e => setProfileForm(f => ({...f, phone: e.target.value}))} placeholder="e.g. 01012345678" required />
                </div>
                <div className="sm:col-span-2">
                  <InputField label={t('profile.role')} value={readableRole} disabled />
                </div>
                {user?.department?.name && (
                  <div className="sm:col-span-2">
                    <InputField label={t('profile.department', 'Department')} value={user.department.name} disabled />
                  </div>
                )}
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#3B72F6] hover:bg-[#2563EB] text-white rounded-lg text-[13px] font-bold transition-colors min-w-[200px]">
                    {t('profile.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          )}



          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('profile.tabSecurity')}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 mb-6 pb-4 border-b border-[var(--border)]">{t('profile.securityDesc')}</p>
              
              <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <InputField type="password" label={t('profile.currentPassword')} value={passwords.current} onChange={e => setPasswords(p => ({...p, current: e.target.value}))} required />
                </div>
                <InputField type="password" label={t('profile.newPassword')} value={passwords.new} onChange={e => setPasswords(p => ({...p, new: e.target.value}))} required />
                <InputField type="password" label={t('profile.confirmNewPassword')} value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} required />
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#3B72F6] hover:bg-[#2563EB] text-white rounded-lg text-[13px] font-bold transition-colors min-w-[200px]">
                    {t('profile.updatePassword')}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{t('profile.twoFactor')}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{t('profile.twoFactorDesc')}</div>
                  </div>
                  <Toggle id="twoFactor" checked={toggles.twoFactor} onChange={() => toggleSetting('twoFactor')} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('profile.tabApplication')}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 mb-6 pb-4 border-b border-[var(--border)]">{t('profile.appDesc')}</p>
              
              <div className="flex flex-col mb-8 gap-5">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t('profile.language', 'Language')}</div>
                  <LanguageSwitcher />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{t('profile.darkTheme')}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{t('profile.darkThemeDesc')}</div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}