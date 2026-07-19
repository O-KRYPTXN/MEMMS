import clsx from 'clsx'
import { forwardRef } from 'react'

const InputField = forwardRef(({
  label, name, type = 'text', placeholder, required = false,
  error, value, onChange, min, max, step, rows = 3, className, ...rest
}, ref) => {
  const commonClasses = clsx(
    'w-full bg-[var(--bg-input)] border rounded-lg',
    'text-[var(--text-primary)] text-[13px] px-[13px] py-2.5',
    'outline-none transition-colors font-sans',
    'placeholder:text-[var(--text-muted)]',
    error ? 'border-[#EF4444]' : 'border-[var(--border)] focus:border-[#3B72F6]'
  )

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={name} className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name} name={name} rows={rows} placeholder={placeholder}
          value={value} onChange={onChange} ref={ref} {...rest}
          className={clsx(commonClasses, 'resize-y')}
        />
      ) : (
        <input
          id={name} name={name} type={type} placeholder={placeholder}
          min={min} max={max} step={step} value={value} onChange={onChange} ref={ref} {...rest}
          className={commonClasses}
        />
      )}

      {error && <span className="text-[0.7rem] text-[#EF4444]">{error}</span>}
    </div>
  )
})

InputField.displayName = 'InputField'
export default InputField
