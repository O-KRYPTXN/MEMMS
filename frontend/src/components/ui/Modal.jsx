import { useEffect } from 'react'

export const ModalCancelBtn = ({ onClick, children = 'Cancel', ...props }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-5 py-2 bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-lg text-[0.8125rem] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors font-sans"
    {...props}
  >
    {children}
  </button>
)

export const ModalPrimaryBtn = ({ onClick, type = 'button', children, color = '#14B8A6', isLoading, ...props }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={isLoading || props.disabled}
    className="px-5 py-2 border-none rounded-lg text-white text-[0.8125rem] font-semibold cursor-pointer transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    style={{ background: color }}
    {...props}
  >
    {isLoading && (
      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    )}
    {children}
  </button>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  maxWidth = '520px',
  closeOnOverlay = true
}) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-[rgba(5,8,15,0.82)] backdrop-blur-sm flex items-center justify-center px-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[14px] w-full relative overflow-hidden animate-modal-in max-h-[90vh] flex flex-col"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-[10px]">
            {titleIcon && <span className="text-[#3B72F6]">{titleIcon}</span>}
            <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">{title}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-[22px] py-[22px] flex flex-col gap-4 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-[10px] px-[22px] py-4 border-t border-[var(--border)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
