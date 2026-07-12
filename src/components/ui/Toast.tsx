import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { Icon } from './Icon'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, message, type, duration }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  )
}

// ─── Toast Item ───────────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', icon: 'check' },
  error:   { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', icon: 'alert' },
  warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', icon: 'alert' },
  info:    { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-900', icon: 'info' },
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const style = TOAST_STYLES[toast.type]

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg border shadow-lg
        transition-all duration-300 ease-out
        ${style.bg} ${style.text}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
    >
      <Icon name={style.icon} size={16} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-[12.5px] font-medium leading-snug">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition"
      >
        <Icon name="close" size={14} className="opacity-60" />
      </button>
    </div>
  )
}
