/**
 * RouteFallback — lightweight Suspense fallback for the lazy route chunks.
 *
 * Token-driven (surface/ink/world — no raw palette classes), announces
 * itself politely to AT, and the spinner stops under prefers-reduced-motion.
 *
 * Two variants:
 * - `fullscreen` (default): whole-viewport — used at the router root while
 *   a world-page chunk loads.
 * - inline (`fullscreen={false}`): fills the available flex area — used
 *   inside WorldShell while a screen chunk loads, so the shell stays visible.
 */

interface RouteFallbackProps {
  fullscreen?: boolean
  /** Visible loading label (screen readers get it too). */
  label?: string
}

export function RouteFallback({ fullscreen = true, label = 'Betöltés…' }: RouteFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`grid place-items-center bg-surface-0 ${fullscreen ? 'min-h-dvh' : 'flex-1 py-16'}`}
    >
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-world motion-reduce:animate-none"
        />
        <span className="text-[12px] font-medium text-ink-muted">{label}</span>
      </div>
    </div>
  )
}
