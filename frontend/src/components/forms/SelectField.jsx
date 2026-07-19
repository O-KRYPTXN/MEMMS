import clsx from 'clsx'
import { forwardRef } from 'react'

const SelectField = forwardRef(({
  label, name, options, placeholder = 'Select...', required = false,
  error, value, onChange, className, ...rest
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={name} className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>

      <select
        id={name} name={name} value={value} onChange={onChange} ref={ref} {...rest}
        className={clsx(
          'w-full bg-[var(--bg-input)] border rounded-lg',
          'text-[var(--text-primary)] text-[13px] px-[13px] py-2.5',
          'outline-none transition-colors font-sans cursor-pointer',
          error ? 'border-[#EF4444]' : 'border-[var(--border)] focus:border-[#3B72F6]'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lbl = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={val} value={val} className="bg-[var(--bg-hover)] text-[var(--text-primary)]">
              {lbl}
            </option>
          )
        })}
      </select>

      {error && <span className="text-[0.7rem] text-[#EF4444]">{error}</span>}
    </div>
  )
})

SelectField.displayName = 'SelectField'
export default SelectField
