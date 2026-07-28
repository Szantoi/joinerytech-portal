import { useEffect, useRef, useId, type CSSProperties } from 'react'
import { Icon } from './Icon'
import { useFocusTrap } from './hooks/useFocusTrap'
import { useInertBackground } from './hooks/useInertBackground'

/**
 * SlideOver — modal side panel / mobile bottom sheet (DESIGN_SYSTEM_SPEC_V1 §2.2).
 *
 * - ≥ md: panel slides in from the right (width prop, capped at 100vw).
 * - < md: bottom sheet — full width, max-h 85dvh, rounded top edge, drag-handle,
 *   explicit "Vissza" button in the header, safe-area padding on the action row.
 * - Focus: trapped inside (dynamic list re-queried per Tab), returned to the
 *   trigger element on close. Background gets `inert` + body scroll-lock.
 * - Close: Esc, overlay click, X button, mobile back button.
 * - Animation respects prefers-reduced-motion (motion-reduce:transition-none).
 */

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Desktop panel width in px (mobile is always full-width bottom sheet). */
  width?: number
  children: React.ReactNode
  footer?: React.ReactNode
}

export function SlideOver({ open, onClose, title, subtitle, width = 520, children, footer }: SlideOverProps) {
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  // Order matters: inert must be lifted BEFORE focus is returned on close
  // (React runs effect cleanups in declaration order).
  useInertBackground(rootRef, open)
  useFocusTrap(panelRef, open)

  // Esc closes the panel (focus return is handled by the trap's cleanup).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={rootRef} className="fixed inset-0 z-40">
      {/* Overlay — click closes; hidden from AT (the dialog itself is modal) */}
      <div
        className="absolute inset-0 bg-stone-900/30 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? `${titleId}-subtitle` : undefined}
        tabIndex={-1}
        style={{ '--slideover-width': `${width}px` } as CSSProperties}
        className="absolute flex flex-col bg-surface-1 shadow-2xl transition-transform duration-200 motion-reduce:transition-none max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85dvh] max-md:rounded-t-2xl md:right-0 md:top-0 md:h-full md:w-[min(var(--slideover-width),100vw)]"
      >
        {/* Drag-handle — decorative, bottom sheet only */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line md:hidden" />

        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          {/* Mobile: explicit back button (audit finding — not just an X) */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md pr-2 text-[12.5px] font-medium text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring md:hidden"
          >
            <span aria-hidden="true" className="rotate-180">
              <Icon name="chevron" size={16} />
            </span>
            Vissza
          </button>
          <div className="min-w-0 flex-1">
            <div id={titleId} className="truncate text-[15px] font-semibold text-ink">
              {title}
            </div>
            {subtitle && (
              <div id={`${titleId}-subtitle`} className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Content — safe-area padding on mobile when there is no footer below it */}
        <div className={`flex-1 overflow-y-auto ${footer ? '' : 'max-md:pb-[env(safe-area-inset-bottom)]'}`}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
