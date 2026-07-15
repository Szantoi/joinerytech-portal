import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Button — a11y button primitive (DESIGN_SYSTEM_SPEC_V1 §2.1).
 *
 * - Native <button> with explicit `type` (defaults to "button" to avoid accidental form submit).
 * - Semantic token classes (bg-world, surface-*, ink-*) — world accent resolves via [data-world].
 * - FSM-forbidden action pattern: pass `disabledReason` → the button stays focusable
 *   (aria-disabled, NOT the native disabled attribute), swallows clicks and exposes the
 *   reason as a tooltip wired via aria-describedby.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'quiet'
export type ButtonSize = 'sm' | 'md' | 'touch'

/** Shared focus style — never remove the outline without a visible replacement. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-world text-world-fg hover:bg-world-hover shadow-sm',
  secondary: 'bg-surface-1 border border-line text-ink hover:bg-surface-2',
  ghost: 'bg-surface-1 border border-line text-ink hover:bg-surface-2',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-400 dark:text-rose-950 dark:hover:bg-rose-300',
  quiet: 'text-ink-muted hover:bg-surface-2 hover:text-ink',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[12px]',
  md: 'h-9 px-3 text-[12.5px]',
  /** Touch target ≥ 44 px for mobile / coarse pointers. */
  touch: 'h-11 px-4 text-[13px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Decorative icon (always aria-hidden). Icon-only buttons MUST pass aria-label. */
  icon?: string
  /**
   * FSM-forbidden action support: when set, the button renders as visibly disabled but
   * remains focusable (aria-disabled), swallows activation and shows this text as a
   * tooltip referenced by aria-describedby.
   */
  disabledReason?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  disabledReason,
  children,
  type = 'button',
  onClick,
  className = '',
  ...rest
}: ButtonProps) {
  const tooltipId = useId()
  const isBlocked = disabledReason != null

  if (import.meta.env?.DEV && icon && !children && !rest['aria-label']) {
    console.warn('Button: icon-only button rendered without aria-label')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Swallow activation of FSM-forbidden actions — the element stays in the tab order.
    if (isBlocked) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  const button = (
    <button
      type={type}
      aria-disabled={isBlocked || undefined}
      aria-describedby={isBlocked ? tooltipId : rest['aria-describedby']}
      onClick={handleClick}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium',
        'transition active:scale-[.99] motion-reduce:transition-none motion-reduce:active:scale-100',
        FOCUS_RING,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isBlocked ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex">
          <Icon name={icon} size={15} />
        </span>
      )}
      {children}
    </button>
  )

  if (!isBlocked) return button

  // Tooltip lives in the DOM permanently so aria-describedby always resolves;
  // it becomes visible on hover / keyboard focus (the button stays focusable).
  return (
    <span className="group relative inline-flex">
      {button}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none dark:bg-stone-100 dark:text-stone-900"
      >
        {disabledReason}
      </span>
    </span>
  )
}

// ─── Legacy wrappers (kept for existing call sites) ──────────────────────────

interface LegacyButtonProps {
  children: ReactNode
  onClick?: () => void
  icon?: string
}

/** @deprecated Use <Button variant="primary"> — kept as a thin compatibility wrapper. */
export function PrimaryBtn({ children, onClick, icon }: LegacyButtonProps) {
  return (
    <Button variant="primary" onClick={onClick} icon={icon}>
      {children}
    </Button>
  )
}

/** @deprecated Use <Button variant="ghost"> — kept as a thin compatibility wrapper. */
export function GhostBtn({ children, onClick, icon }: LegacyButtonProps) {
  return (
    <Button variant="ghost" onClick={onClick} icon={icon}>
      {children}
    </Button>
  )
}
