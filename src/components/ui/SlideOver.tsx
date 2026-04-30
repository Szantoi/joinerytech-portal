import { useEffect } from 'react'
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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 h-full bg-white shadow-2xl flex flex-col"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-stone-900 truncate">{title}</div>
            {subtitle && (
              <div className="text-[11.5px] text-stone-500 mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-stone-200 bg-stone-50/60 flex items-center gap-2 justify-end">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
