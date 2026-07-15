import type { ReactNode } from 'react'
import { Button } from '../../components/ui'

/**
 * QueryGate — egységes betöltés/hiba keret a query-vezérelt EHS képernyőkhöz.
 * Betöltés: skeleton sorok (aria-busy); hiba: üzenet + Újra gomb (refetch).
 */
interface QueryGateProps {
  isPending: boolean
  isError: boolean
  /** A query refetch függvénye az Újra gombhoz. */
  onRetry: () => void
  /** Mi nem töltődött be — a hibaüzenetben jelenik meg. */
  resource: string
  children: ReactNode
}

export function QueryGate({ isPending, isError, onRetry, resource, children }: QueryGateProps) {
  if (isPending) {
    return (
      <div aria-busy="true" aria-label={`${resource} betöltése`} className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border border-line bg-surface-2" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface-1 px-4 py-8 text-center">
        <p className="text-[12.5px] text-ink-muted">A(z) {resource} betöltése nem sikerült.</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>Újra</Button>
      </div>
    )
  }
  return <>{children}</>
}
