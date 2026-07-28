import { useCallback, useRef } from 'react'

/**
 * usePrintScope — az oldalnak CSAK egy kijelölt részét nyomtatja.
 *
 * Provenance: a doorstar-instance `lib/printOnly.ts`-éből általánosítva
 * (PLAN-05 F3). Ott a hatókör két beégetett név volt (`munkamenet`/`subsheet`),
 * és minden névhez saját CSS-szabály kellett. Itt a hatókört a **ref** jelöli
 * ki, így a CSS statikus és tetszőleges számú, egymástól független nyomtatási
 * régió létezhet egy oldalon.
 *
 * Használat:
 * ```tsx
 * const { scopeRef, print } = usePrintScope()
 * <section ref={scopeRef}>…</section>
 * <button onClick={print}>Nyomtatás</button>
 * ```
 *
 * A takarítás `afterprint`-re fut, ÉS a `window.print()` visszatérése után is
 * (defenzíven): a nyomtatás megszakítása egyes böngészőkben nem küld
 * `afterprint`-et, és a jelölés bennragadna a DOM-ban.
 *
 * FELTÉTELEZÉS: a `window.print()` **blokkol**, amíg a nyomtatási párbeszéd
 * nyitva van — ezért biztonságos közvetlenül a visszatérése után takarítani.
 * Ez az evergreen böngészőkben így van; ha egy környezetben mégis azonnal
 * visszatérne, a jelölést az `afterprint` szedné le, a nyomtatási kép pedig
 * addig is helyes marad (a takarítás csak korábban futna le a kelleténél).
 *
 * A vágást a `src/index.css` `@media print` blokkja végzi a
 * `data-print-scope` / `data-print-region` attribútum-párral.
 */

export interface PrintScope<T extends HTMLElement = HTMLElement> {
  /** A nyomtatandó régióra kötendő ref. */
  scopeRef: React.RefObject<T | null>
  /** Megjelöli a régiót, nyomtat, majd visszaáll. */
  print: () => void
}

const SCOPE_ATTRIBUTE = 'data-print-scope'
const REGION_ATTRIBUTE = 'data-print-region'

export function usePrintScope<T extends HTMLElement = HTMLElement>(): PrintScope<T> {
  const scopeRef = useRef<T | null>(null)

  const print = useCallback(() => {
    const region = scopeRef.current
    if (!region) return

    const root = region.ownerDocument.documentElement
    root.setAttribute(SCOPE_ATTRIBUTE, '')
    region.setAttribute(REGION_ATTRIBUTE, '')

    const cleanup = () => {
      root.removeAttribute(SCOPE_ATTRIBUTE)
      region.removeAttribute(REGION_ATTRIBUTE)
    }

    const view = region.ownerDocument.defaultView
    view?.addEventListener('afterprint', cleanup, { once: true })
    try {
      view?.print()
    } finally {
      // Megszakított nyomtatásnál elmaradhat az afterprint — ne ragadjon bent a jelölés.
      cleanup()
      view?.removeEventListener('afterprint', cleanup)
    }
  }, [])

  return { scopeRef, print }
}
