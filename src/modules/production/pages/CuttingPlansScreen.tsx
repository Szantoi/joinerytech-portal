import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Icon, QueryGate, StatusPill, useToast } from '../../../components/ui'
import {
  PLAN_DAYS_DEFAULT, PLAN_DAYS_MAX, PLAN_DAYS_MIN, PLAN_STRATEGY_DEFAULT,
  useCreatePlan, usePlans,
} from '../services'
import { PLAN_STATUS_META, formatDate } from './labels'
import { PlanDetailSlideOver } from './PlanDetailSlideOver'

/**
 * Vágótervek (CuttingPlan planning-aggregátum) — lista + létrehozó-űrlap +
 * részlet-SlideOver (FSM-akciók ott élnek). A `highlightPlanId` navigation
 * state-et a DesignPage anyaglista-generálás utáni átirányítása adja (legacy
 * integráció, megőrizve — `/w/production/cutting` route-kulcs változatlan).
 */
export function CuttingPlansScreen() {
  const location = useLocation()
  const { addToast } = useToast()
  const plans = usePlans()
  const createPlan = useCreatePlan()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [planDate, setPlanDate] = useState('')
  const [planDays, setPlanDays] = useState(PLAN_DAYS_DEFAULT)
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Render-time állapot-igazítás (React "adjusting state when a prop
  // changes" mintája) — NEM effektben szinkron setState-elünk
  // (react-hooks/set-state-in-effect): a navigation state referenciáját
  // hasonlítjuk az utoljára feldolgozotthoz, és eltérésnél azonnal, a
  // renderelés közben állítjuk be a kijelölést/kiemelést.
  const [consumedState, setConsumedState] = useState<unknown>(undefined)
  if (location.state !== consumedState) {
    setConsumedState(location.state)
    const highlightPlanId = (location.state as { highlightPlanId?: string } | null)?.highlightPlanId
    if (highlightPlanId) {
      setSelectedPlanId(highlightPlanId)
      setHighlightedId(highlightPlanId)
    }
  }

  // A highlightedId-hoz kötött MELLÉKHATÁSOK (toast + scroll/fade-időzítők) —
  // ez valódi effekt (időzítő + DOM-scroll külső rendszerrel szinkronizál),
  // a setState csak a lejáró időzítő callback-jében fut, nem az effekt-törzsben.
  useEffect(() => {
    if (!highlightedId) return
    addToast(`Vágóterv létrehozva: ${highlightedId.slice(0, 8).toUpperCase()}`, 'success')
    const scrollTimer = setTimeout(() => {
      rowRefs.current[highlightedId]?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    }, 100)
    const fadeTimer = setTimeout(() => setHighlightedId(null), 3000)
    return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedId])

  const rows = plans.data ?? []

  function handleCreate() {
    if (!planDate) return
    createPlan.mutate(
      { planDate, planDays, strategyId: PLAN_STRATEGY_DEFAULT },
      { onSuccess: (res) => setSelectedPlanId(res.planId) },
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Vágótervezés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Draft → Published → Frozen → Closed — a fagyasztás indítja az offcut-batch regisztrációt
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface-1 p-3">
        <label className="text-[12px]">
          <span className="mb-1 block font-medium text-ink">Kezdődátum</span>
          <input
            type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface-card px-2 text-ink"
          />
        </label>
        <label className="text-[12px]">
          <span className="mb-1 block font-medium text-ink">Ablak (nap)</span>
          <input
            type="number" min={PLAN_DAYS_MIN} max={PLAN_DAYS_MAX} value={planDays}
            onChange={(e) => setPlanDays(Number(e.target.value))}
            className="h-9 w-20 rounded-md border border-line bg-surface-card px-2 text-ink"
          />
        </label>
        <Button size="sm" disabledReason={!planDate ? 'Adjon meg kezdődátumot.' : undefined} onClick={handleCreate}>
          <Icon name="plus" size={13} /> Terv létrehozása
        </Button>
      </div>

      <QueryGate isPending={plans.isPending} isError={plans.isError} onRetry={() => void plans.refetch()} resource="vágótervek">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-ink-muted">
            Nincs vágóterv.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface-1">
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  ref={(el) => { rowRefs.current[p.id] = el }}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                    highlightedId === p.id ? 'border-l-4 border-l-world' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12.5px] font-medium text-ink">{p.id}</div>
                    <div className="text-[10.5px] text-ink-muted">
                      {formatDate(p.planDate)} · {p.planDays} nap · {p.strategyId}
                    </div>
                  </div>
                  <StatusPill size="sm" tone={PLAN_STATUS_META[p.status].tone} label={PLAN_STATUS_META[p.status].label} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryGate>

      <PlanDetailSlideOver planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
    </div>
  )
}
