import { useToastStore } from '../../store/toastStore'
import clsx from 'clsx'

export default function Toast() {
  const { toast } = useToastStore()

  return (
    <div
      className={clsx(
        'fixed bottom-7 right-7 z-[2000]',
        'px-5 py-3 rounded-[10px]',
        'text-white text-[0.85rem] font-semibold',
        'shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
        'transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        toast.show
          ? 'translate-y-0 opacity-100'
          : 'translate-y-20 opacity-0 pointer-events-none'
      )}
      style={{ background: toast.color }}
      role="status"
      aria-live="polite"
    >
      {toast.msg}
    </div>
  )
}
