import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
  }

  return (
    <button
      onClick={toggleLanguage}
      title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      className="w-9 h-9 rounded-lg bg-[var(--bg-input)] border
        border-[var(--border)] flex items-center justify-center
        text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
        text-xs font-bold transition-colors"
    >
      {isArabic ? 'EN' : 'AR'}
    </button>
  )
}

export default LanguageSwitcher
