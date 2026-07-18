import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

/**
 * Lokális select-mező a production űrlapokhoz (az EHS formFields mintája —
 * szándékosan NEM kereszt-modul import: az ehs barrel nem exportálja, a mély
 * import pedig a teljes EHS chunkot húzná be; MODULE-PACKAGES lépésben kerül
 * közös @joinerytech/ui-ba).
 */
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export function SelectField({ label, children, className = '', id, ...rest }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {rest.required && <span className="ml-1 text-rose-600 dark:text-rose-400">*</span>}
      </label>
      <select
        id={selectId}
        className="w-full rounded-md border border-line bg-surface-card px-3 py-2 text-ink shadow-sm focus:border-world-ring focus:outline-none focus:ring-2 focus:ring-world-ring"
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}
