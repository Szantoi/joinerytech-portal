import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

/**
 * Apró, címkézett űrlap-mezők az EHS SlideOver-formokhoz (token-osztályokkal).
 * A szöveges inputokra a közös ui/Input megy — itt csak a select/textarea él.
 */

const FIELD_CLASSES =
  'w-full rounded-lg border border-line bg-surface-1 px-3 py-2 text-[12.5px] text-ink ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export function SelectField({ label, children, className = '', ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-ink-muted">
        {label}
        {rest.required && <span aria-hidden="true" className="ml-0.5 text-rose-500">*</span>}
      </label>
      <select id={id} className={FIELD_CLASSES} {...rest}>
        {children}
      </select>
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextAreaField({ label, className = '', ...rest }: TextAreaFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-ink-muted">
        {label}
        {rest.required && <span aria-hidden="true" className="ml-0.5 text-rose-500">*</span>}
      </label>
      <textarea id={id} rows={3} className={FIELD_CLASSES} {...rest} />
    </div>
  )
}

interface DateFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  /** datetime-local a bejárás-ütemezéshez, date a határidőkhöz. */
  type?: 'date' | 'datetime-local'
  className?: string
}

export function DateField({ label, value, onChange, required, type = 'date', className = '' }: DateFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-ink-muted">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-rose-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASSES}
      />
    </div>
  )
}

/** Dolgozó-választó opciók (ÁTMENETI névtár — ld. services/ehs/employees.ts). */
export function EmployeeOptions({ employees }: { employees: { id: string; name: string }[] }) {
  return (
    <>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>{e.name}</option>
      ))}
    </>
  )
}
