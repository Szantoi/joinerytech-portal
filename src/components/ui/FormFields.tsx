import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

/** Shared token-based styling for compact form controls across ERP modules. */
const FIELD_CLASSES =
  'w-full rounded-lg border border-line bg-surface-1 px-3 py-2 text-[12.5px] text-ink ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-medium text-ink-muted">
      {label}
      {required && <span aria-hidden="true" className="ml-0.5 text-rose-500">*</span>}
    </label>
  )
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

/** Labelled select primitive. `className` styles the field wrapper. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, children, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id ?? generatedId

    return (
      <div className={className}>
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
        <select ref={ref} id={fieldId} className={FIELD_CLASSES} {...props}>
          {children}
        </select>
      </div>
    )
  },
)

SelectField.displayName = 'SelectField'

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

/** Labelled textarea primitive. `className` styles the field wrapper. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, className = '', id, rows = 3, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id ?? generatedId

    return (
      <div className={className}>
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
        <textarea ref={ref} id={fieldId} rows={rows} className={FIELD_CLASSES} {...props} />
      </div>
    )
  },
)

TextAreaField.displayName = 'TextAreaField'

export interface DateFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'onChange' | 'type' | 'value'> {
  label: string
  value: string
  onChange: (value: string) => void
  /** `datetime-local` is used for scheduling; `date` for deadlines. */
  type?: 'date' | 'datetime-local'
  /** Styles the field wrapper, consistently with the other labelled controls. */
  className?: string
}

/** Labelled date input that exposes the value instead of the DOM change event. */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, value, onChange, required, type = 'date', className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id ?? generatedId

    return (
      <div className={className}>
        <FieldLabel htmlFor={fieldId} label={label} required={required} />
        <input
          ref={ref}
          id={fieldId}
          type={type}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASSES}
          {...props}
        />
      </div>
    )
  },
)

DateField.displayName = 'DateField'
