import { useEffect, type RefObject } from 'react'

/**
 * useInertBackground — makes everything OUTSIDE `ref` inert while `active`,
 * and locks body scroll (DESIGN_SYSTEM_SPEC_V1 §2.2, points 3).
 *
 * Walks from the element up to <body> and sets the `inert` attribute on every
 * sibling along the way (skipping ones that were already inert), so screen
 * readers and keyboard users cannot reach the background. Everything is
 * restored on cleanup.
 *
 * NOTE: consumers must call this hook BEFORE useFocusTrap so that on close the
 * inert attributes are removed before focus is returned to the trigger.
 */
export function useInertBackground(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    const inerted: HTMLElement[] = []
    let node: HTMLElement = el
    while (node.parentElement && node !== document.body) {
      for (const sibling of Array.from(node.parentElement.children)) {
        if (sibling !== node && sibling instanceof HTMLElement && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '')
          inerted.push(sibling)
        }
      }
      node = node.parentElement
    }

    // Scroll-lock while the dialog is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      inerted.forEach((sibling) => sibling.removeAttribute('inert'))
      document.body.style.overflow = prevOverflow
    }
  }, [ref, active])
}
