import { createContext, useContext } from 'react'

/**
 * Toast context + types (DESIGN_SYSTEM_SPEC_V1 §2.6).
 * Kept separate from Toast.tsx so component files only export components
 * (react-refresh constraint); consumers import via the ui barrel.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  /** Auto-dismiss in ms; null = persistent (errors are always persistent). */
  duration: number | null
}

export interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

/** WCAG 2.2.1 — messages must stay visible long enough to be read. */
export const MIN_TOAST_DURATION_MS = 5000

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
