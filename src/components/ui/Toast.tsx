import { useState, useCallback, type ReactNode } from 'react'
import { ToastItem } from './ToastItem'
import { ToastContext, MIN_TOAST_DURATION_MS, type Toast, type ToastType } from './toastContext'

/**
 * Toast — notification system (DESIGN_SYSTEM_SPEC_V1 §2.6).
 *
 * A11y contract:
 * - The live-region containers are ALWAYS in the DOM (even with zero toasts) —
 *   screen readers only announce changes inside an already-existing live region.
 *   (This fixes the old bug where the container returned null when empty.)
 * - success/info/warning → polite region (role="status"); error → assertive
 *   region (role="alert") and never auto-dismisses (manual close only).
 * - Auto-dismiss is min. 5000 ms; hover and focus pause the timer (WCAG 2.2.1).
 * - Toasts never steal focus; the close button is reachable in normal tab order.
 * - Position: desktop bottom-right; mobile above the bottom nav + safe area.
 *
 * Types and the useToast hook live in ./toastContext (re-exported by the barrel).
 */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    // Errors require manual dismissal; everything else auto-dismisses (min 5 s).
    const effectiveDuration =
      type === 'error' ? null : Math.max(duration ?? MIN_TOAST_DURATION_MS, MIN_TOAST_DURATION_MS)
    setToasts((prev) => [...prev, { id, message, type, duration: effectiveDuration }])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

// ─── Container (persistent live regions) ──────────────────────────────────────

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  const politeToasts = toasts.filter((t) => t.type !== 'error')
  const errorToasts = toasts.filter((t) => t.type === 'error')

  // NOTE: this container must never return null — the live regions have to
  // exist BEFORE a toast arrives for AT to announce it.
  return (
    <div className="pointer-events-none fixed right-4 z-50 flex w-full max-w-sm flex-col gap-2 bottom-[calc(58px+env(safe-area-inset-bottom)+8px)] md:bottom-4">
      <div role="status" aria-live="polite" className="contents">
        {politeToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
        ))}
      </div>
      <div role="alert" aria-live="assertive" className="contents">
        {errorToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
        ))}
      </div>
    </div>
  )
}
