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
 * KIVÉTEL: a `data-inert-exempt` attribútumú testvérek kimaradnak a sétából.
 * A toast live-regionöknek nyitott dialógus mellett is az accessibility
 * tree-ben KELL maradniuk (a dialógusból indított mutációk visszajelzése —
 * WCAG 4.1.3; WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24 M-S2), és az
 * error-toast bezárhatóságához pointer-esemény is kell rájuk.
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
        if (
          sibling !== node &&
          sibling instanceof HTMLElement &&
          !sibling.hasAttribute('inert') &&
          !sibling.hasAttribute('data-inert-exempt')
        ) {
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
