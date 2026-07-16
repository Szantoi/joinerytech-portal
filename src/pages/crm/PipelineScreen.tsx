import { useState } from 'react'
import { Button, QueryGate, StatusPill } from '../../components/ui'
import {
  useOpps, useOppTransition,
  OPP_OPEN_STAGES, nextOppAction, weightedValue,
  type Opportunity, type OppStatus,
} from '../../services/crm'
import { OPP_ACTION_LABELS, OPP_STATUS_LABELS, formatMoney } from './labels'
import { OppDetailSlideOver } from './OppDetailSlideOver'

/**
 * Pipeline — kanban tábla a lehetőség-fázisok szerint (mobil spec:
 * vízszintesen görgethető oszlopok). Kártya-koppintás → detail SlideOver;
 * fázis-léptetés validált FSM-átmenettel („→" gomb, nem drag&drop — a
 * @dnd-kit tudatosan kihagyva, hogy ne nőjön a chunk).
 */

const COLUMNS: OppStatus[] = [...OPP_OPEN_STAGES, 'megnyert']

function PipelineCard({ opp, onOpen }: { opp: Opportunity; onOpen: (id: string) => void }) {
  const transition = useOppTransition()
  const action = nextOppAction(opp.status)

  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3 transition hover:border-world hover:shadow-sm">
      <button
        onClick={() => onOpen(opp.id)}
        className="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
      >
        <div className="truncate text-[12px] font-semibold text-ink">{opp.customer}</div>
        <div className="mt-0.5 truncate text-[11px] text-ink-muted">{opp.title}</div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="font-semibold tabular-nums text-ink">{formatMoney(opp.value)}</span>
          <span className="tabular-nums text-ink-muted" title="Súlyozott érték">
            ~{formatMoney(weightedValue(opp.value, opp.status))}
          </span>
        </div>
      </button>
      {action && (
        <div className="mt-2 border-t border-line pt-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            disabledReason={transition.isPending ? 'Folyamatban…' : undefined}
            onClick={() => transition.mutate({ id: opp.id, action, payload: {} })}
          >
            {OPP_ACTION_LABELS[action]} →
          </Button>
        </div>
      )}
    </div>
  )
}

export function PipelineScreen() {
  const opps = useOpps()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Pipeline</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Lehetőségek fázisonként — léptetés csak validált FSM-átmenettel
        </p>
      </div>

      <QueryGate isPending={opps.isPending} isError={opps.isError}
        onRetry={() => void opps.refetch()} resource="pipeline">
        {/*
          Vízszintesen görgő sáv — DESIGN_SYSTEM_SPEC_V1 §3.3 kötelező mintája:
          edge-fade maszk (affordancia, a Tabs.tsx receptje), snap, fókuszálható
          region (üres oszlop is elérhető billentyűzettel), touch-pan-x (nem
          lopja el a függőleges swipe-ot).
        */}
        <div
          role="region"
          aria-label="Pipeline fázis-oszlopok"
          tabIndex={0}
          className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          {COLUMNS.map((stage) => {
            const items = (opps.data ?? []).filter((o) => o.status === stage)
            return (
              <section
                key={stage}
                // Spec §3.3 kanban: darabszám az accessible name-ben („Ajánlat, 4 elem")
                aria-label={`${OPP_STATUS_LABELS[stage]}, ${items.length} elem`}
                className="w-[280px] shrink-0 snap-start"
              >
                <div className="mb-3 flex items-center gap-2">
                  <StatusPill size="sm" fsm="crmOpportunity" status={stage} label={OPP_STATUS_LABELS[stage]} />
                  <span className="ml-auto font-mono text-[11px] text-ink-muted">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((opp) => (
                    <PipelineCard key={opp.id} opp={opp} onOpen={setSelectedId} />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line py-6 text-center text-[11px] text-ink-muted">
                      üres
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </QueryGate>

      <OppDetailSlideOver oppId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
