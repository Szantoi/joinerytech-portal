import { useEffect, type RefObject } from 'react'

/**
 * useFocusTrap — modal focus management (DESIGN_SYSTEM_SPEC_V1 §2.2).
 *
 * While `active`:
 * - moves focus to the first focusable element inside `ref` (or the container itself),
 * - keeps Tab / Shift+Tab cycling inside the container — the focusable list is re-queried
 *   on EVERY Tab press, so dynamically added/removed controls stay inside the trap,
 * - on deactivation returns focus to the element that was focused before the trap opened.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/** All keyboard-focusable descendants of a container, in DOM order. */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    // Remember the trigger so we can hand focus back on close.
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const initial = getFocusable(container)[0] ?? container
    initial.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      // Re-query on every Tab: the panel content is dynamic.
      const items = getFocusable(container)
      if (items.length === 0) {
        e.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement

      if (current && !container.contains(current)) {
        // Focus escaped (e.g. via portal / devtools) — pull it back in.
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && (current === first || current === container)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Focus return — runs after the background `inert` is lifted
      // (declare useInertBackground BEFORE useFocusTrap in the consumer).
      previouslyFocused?.focus()
    }
  }, [ref, active])
}
