import { useState } from 'react'
import { Card, QueryGate, StatusPill } from '../../../components/ui'
import {
  DASH_LIST_LIMIT, DASH_ORDERS_SCAN_PAGE_SIZE,
  isDoorOrderActive, isExecutionOpen, isPlanActive, isQuotePending,
  useExecutions, useOrders, usePlans, useQuotes, useWasteReport,
} from '../services'
import {
  DOOR_ORDER_STATUS_META, EXECUTION_STATUS_META, PLAN_STATUS_META,
  formatDate, formatNumber,
} from './labels'
import { PlanDetailSlideOver } from './PlanDetailSlideOver'
import { OrderDetailSlideOver } from './OrderDetailSlideOver'

/**
 * Szekció-link („… →") osztályai. A `before:-inset-y-3.5` a modulban MÁR
 * használt chip-minta (CuttingExecutionScreen szűrő-chipjei): a 17px-es
 * szöveg-sor köré 44px effektív találati zónát húz, láthatóan változatlan
 * elrendezés mellett (M-10 fix, house-spec touch-target).
 */
const SECTION_LINK_CLASS =
  "relative rounded text-[11.5px] font-medium text-world-soft-fg hover:underline before:absolute before:inset-x-0 before:-inset-y-3.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"

/**
 * Production áttekintés — minden érték a VALÓS kontraktus-alakú válaszokból
 * számított (nincs hamisított progress/runtime — a legacy képernyő kliens-
 * oldali kitalált mezőit a doksi P1 gapje miatt elhagytuk). KPI-k a nevesített
 * FSM-guardokkal (isPlanActive/isExecutionOpen/isDoorOrderActive/isQuotePending),
 * hulladék a waste-riportból (config-ablak).
 */
export function ProductionDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const plans = usePlans()
  const executions = useExecutions()
  // M-6: a rendelés-KPI a kontraktus-maximumig (100) vizsgál, mert count-végpont
  // nincs; a maradék csonkítást az alcím vallja be (ld. lentebb).
  const orders = useOrders({ page: 1, pageSize: DASH_ORDERS_SCAN_PAGE_SIZE })
  const quotes = useQuotes()
  const waste = useWasteReport()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const planRows = plans.data ?? []
  const executionRows = executions.data ?? []
  const orderRows = orders.data?.items ?? []
  const quoteRows = quotes.data ?? []

  const activePlans = planRows.filter((p) => isPlanActive(p.status))
  const openExecutions = executionRows.filter((e) => isExecutionOpen(e.status))
  const activeOrders = orderRows.filter((o) => isDoorOrderActive(o.status))
  const pendingQuotes = quoteRows.filter((q) => isQuotePending(q.status))

  // M-6: a KPI CSAK a lekért lapból számol — ha a totalCount nagyobb, ezt ki kell
  // mondani, különben a „N összesen" alcím teljességet sugallna egy alulszámolt
  // érték mellett.
  const orderTotalCount = orders.data?.totalCount ?? 0
  const ordersTruncated = orderTotalCount > orderRows.length

  const kpis: Array<{ label: string; value: string; sub: string; alert?: boolean; hint?: string }> = [
    {
      label: 'Aktív vágóterv',
      value: String(activePlans.length),
      sub: `${planRows.length} terv összesen`,
    },
    {
      label: 'Futó végrehajtás',
      value: String(openExecutions.length),
      sub: `${executionRows.length} végrehajtás összesen`,
    },
    {
      label: 'Rendelés kalkulációban',
      value: String(activeOrders.length),
      sub: ordersTruncated
        ? `${orderRows.length} vizsgált rendelésből (${orderTotalCount} összesen)`
        : `${orderTotalCount} ajtórendelés összesen`,
      hint: ordersTruncated
        ? 'A joinery kontraktusban nincs count-végpont, ezért a KPI csak a lekért első lapot vizsgálja.'
        : undefined,
    },
    {
      label: 'Döntésre váró ajánlat',
      value: String(pendingQuotes.length),
      sub: 'árajánlat-kérés',
      alert: pendingQuotes.length > 0,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Vágótervek, végrehajtás, ajtórendelések és ajánlatok — élő kontraktus-adatból
        </p>
      </div>

      <QueryGate
        isPending={plans.isPending || executions.isPending || orders.isPending || quotes.isPending}
        isError={plans.isError || executions.isError || orders.isError || quotes.isError}
        resource="gyártás áttekintés"
        onRetry={() => {
          void plans.refetch(); void executions.refetch()
          void orders.refetch(); void quotes.refetch()
        }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{k.label}</div>
              <div className={`mt-1 text-[26px] font-semibold tabular-nums tracking-tight ${k.alert ? 'text-amber-600 dark:text-amber-400' : 'text-ink'}`}>
                {k.value}
              </div>
              <div className="mt-1 text-[10.5px] text-ink-muted" title={k.hint}>
                {k.sub}
                {k.hint && <span className="ml-1 cursor-help" aria-hidden="true">ⓘ</span>}
              </div>
              {k.hint && <span className="sr-only">{k.hint}</span>}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Vágótervek */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="text-[13px] font-semibold text-ink">Vágótervek</h2>
              {/* M-1: a diszpécser képernyő-kulcsa `cutting` (NEM `plans`) — a régi
                  kulcs nem létező képernyőre navigált, és a dashboardot töltötte vissza. */}
              <button onClick={() => onScreen('cutting')} className={SECTION_LINK_CLASS}>
                Vágótervezés →
              </button>
            </div>
            {planRows.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs vágóterv.</p>
            ) : (
              <ul>
                {planRows.slice(0, DASH_LIST_LIMIT).map((p) => (
                  <li key={p.id} className="border-b border-line last:border-0">
                    <button
                      onClick={() => setSelectedPlanId(p.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[12px] font-medium text-ink">{p.id}</div>
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
          </Card>

          {/* Aktív rendelések */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="text-[13px] font-semibold text-ink">Ajtórendelések</h2>
              <button onClick={() => onScreen('orders')} className={SECTION_LINK_CLASS}>
                Rendelések →
              </button>
            </div>
            {orderRows.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs ajtórendelés.</p>
            ) : (
              <ul>
                {orderRows.slice(0, DASH_LIST_LIMIT).map((o) => (
                  <li key={o.id} className="border-b border-line last:border-0">
                    <button
                      onClick={() => setSelectedOrderId(o.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-ink">{o.projectName}</div>
                        <div className="truncate font-mono text-[10.5px] text-ink-muted">
                          {o.projectId} · {o.itemCount} tétel
                        </div>
                      </div>
                      <StatusPill size="sm" tone={DOOR_ORDER_STATUS_META[o.status].tone} label={DOOR_ORDER_STATUS_META[o.status].label} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Futó végrehajtások */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="text-[13px] font-semibold text-ink">
                Futó végrehajtások{openExecutions.length ? ` (${openExecutions.length})` : ''}
              </h2>
              {/* M-1: a diszpécser képernyő-kulcsa `machining` (NEM `executions`). */}
              <button onClick={() => onScreen('machining')} className={SECTION_LINK_CLASS}>
                Megmunkálás →
              </button>
            </div>
            {openExecutions.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs futó végrehajtás.</p>
            ) : (
              <ul>
                {openExecutions.slice(0, DASH_LIST_LIMIT).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12px] font-medium text-ink">{e.id}</div>
                      <div className="text-[10.5px] text-ink-muted">Ütemezve: {formatDate(e.scheduledAt)}</div>
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-ink">
                      {e.panelsCompleted}/{e.totalPanels} panel
                    </span>
                    <StatusPill size="sm" tone={EXECUTION_STATUS_META[e.status].tone} label={EXECUTION_STATUS_META[e.status].label} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Hulladék-összesítő (valós 3 mezős riport — P3: nincs bontás) */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Hulladék-összesítő</h2>
              <button onClick={() => onScreen('analytics')} className={SECTION_LINK_CLASS}>
                Elemzések →
              </button>
            </div>
            {waste.isPending ? (
              <p className="text-[12px] text-ink-muted">Betöltés…</p>
            ) : waste.isError || !waste.data ? (
              <p className="text-[12px] text-ink-muted">A waste-riport nem érhető el.</p>
            ) : (
              <dl className="grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Összes hulladék</dt>
                  <dd className="mt-1 text-[18px] font-semibold tabular-nums text-ink">
                    {formatNumber(waste.data.totalWasteAreaCm2)} cm²
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Átlag / végrehajtás</dt>
                  <dd className="mt-1 text-[18px] font-semibold tabular-nums text-ink">
                    {formatNumber(waste.data.averageWastePerExecution)} cm²
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">Végrehajtás</dt>
                  <dd className="mt-1 text-[18px] font-semibold tabular-nums text-ink">
                    {waste.data.executionCount} db
                  </dd>
                </div>
              </dl>
            )}
          </Card>
        </div>
      </QueryGate>

      <PlanDetailSlideOver planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      <OrderDetailSlideOver orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  )
}
