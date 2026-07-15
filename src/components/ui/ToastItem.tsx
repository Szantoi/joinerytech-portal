import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import type { Toast, ToastType } from './toastContext'

/**
 * ToastItem — a single toast card (DESIGN_SYSTEM_SPEC_V1 §2.6).
 *
 * - Pausable auto-dismiss timer: hover or focus inside the toast pauses the
 *   countdown; leaving resumes with the remaining time (WCAG 2.2.1).
 * - Esc while focus is inside the toast closes it.
 * - Never receives automatic focus; close button carries an explicit aria-label.
 * - Colour steps follow the STATUS_TONES ladder: -100/-800 light, -950/-300 dark.
 */

const TOAST_STYLES: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: 'check',
  },
  error: {
    bg: 'bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-900',
    text: 'text-rose-800 dark:text-rose-300',
    icon: 'alert',
  },
  warning: {
    bg: 'bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-900',
    text: 'text-amber-800 dark:text-amber-300',
    icon: 'alert',
  },
  info: {
    bg: 'bg-sky-100 border-sky-200 dark:bg-sky-950 dark:border-sky-900',
    text: 'text-sky-800 dark:text-sky-300',
    icon: 'info',
  },
}

/**
 * Auto-dismiss countdown that can be paused/resumed, keeping the remaining time.
 * `duration: null` means persistent — no timer at all.
 */
function useDismissTimer(duration: number | null, paused: boolean, onExpire: () => void) {
  const remainingRef = useRef(duration ?? 0)
  const onExpireRef = useRef(onExpire)
  // Keep the latest callback without restarting the countdown effect.
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (duration == null || paused) return
    const startedAt = Date.now()
    const timer = setTimeout(() => onExpireRef.current(), remainingRef.current)
    return () => {
      clearTimeout(timer)
      // Bank the elapsed time so resuming continues where we left off.
      remainingRef.current = Math.max(remainingRef.current - (Date.now() - startedAt), 0)
    }
  }, [duration, paused])
}

export function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const style = TOAST_STYLES[toast.type]

  useDismissTimer(toast.duration, paused, onClose)

  // Enter animation (respects reduced motion via motion-reduce class below).
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none ${style.bg} ${style.text} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 motion-reduce:translate-x-0 motion-reduce:opacity-100'
      }`}
    >
      <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
        <Icon name={style.icon} size={16} />
      </span>
      <div className="flex-1 text-[12.5px] font-medium leading-snug">{toast.message}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Értesítés bezárása"
        className="flex-shrink-0 rounded p-0.5 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring motion-reduce:transition-none dark:hover:bg-white/10"
      >
        <span aria-hidden="true">
          <Icon name="close" size={14} className="opacity-60" />
        </span>
      </button>
    </div>
  )
}
