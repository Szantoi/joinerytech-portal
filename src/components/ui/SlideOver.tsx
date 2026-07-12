import { useEffect, useRef, useId } from 'react'
import { Icon } from './Icon'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
  children: React.ReactNode
  footer?: React.ReactNode
}

export function SlideOver({ open, onClose, title, subtitle, width = 520, children, footer }: SlideOverProps) {
  const titleId = useId()
  const slideOverRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return

    // Escape key handler
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // Focus trap - basic implementation
    const slideOver = slideOverRef.current
    if (slideOver) {
      const focusableElements = slideOver.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      firstElement?.focus()

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }

      slideOver.addEventListener('keydown', trapFocus as EventListener)
      return () => {
        window.removeEventListener('keydown', onKey)
        slideOver.removeEventListener('keydown', trapFocus as EventListener)
      }
    }

    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        ref={slideOverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? `${titleId}-subtitle` : undefined}
        className="absolute right-0 top-0 h-full bg-white dark:bg-stone-900 shadow-2xl flex flex-col"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div id={titleId} className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 truncate">{title}</div>
            {subtitle && (
              <div id={`${titleId}-subtitle`} className="text-[11.5px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="w-8 h-8 grid place-items-center rounded-md text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/60 flex items-center gap-2 justify-end">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
