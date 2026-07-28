import { Button } from '@spaceos/portal-ui'

/**
 * DetailState — betöltés/hiba állapot a detail-SlideOverek (és a bennük élő
 * al-blokkok) számára: a lista-képernyők `QueryGate`-jének SlideOver-méretű
 * párja, skeleton-sorok nélkül.
 *
 * Miért kell (M-11/M-12 fix, WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24): a
 * detail-fetch 404/500-ra is a „nincs adat" ágra futott, így a hiba örök
 * „Betöltés…"-ként jelent meg — egy OPERATÍV képernyőn ez a legrosszabb
 * hazugság: a gépkezelő várakozásnak látja a hibát. A `role="alert"` + Újra a
 * modul többi hiba-affordanciájával egyezik.
 */
export function DetailState({
  isError,
  onRetry,
  resource,
}: {
  isError: boolean
  onRetry: () => void
  resource: string
}) {
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-[12.5px] text-ink-muted">A(z) {resource} betöltése nem sikerült.</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>Újra</Button>
      </div>
    )
  }
  return (
    <p aria-busy="true" className="text-[12.5px] text-ink-muted">
      Betöltés…
    </p>
  )
}
