import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../components/ui'
import {
  OPP_FSM, OPP_STAGE_PROBABILITY, weightedValue, transitionBlockReason, isOppOpen,
  useOpp, useOppTransition, useCreateQuoteFromOpp, useAddOppActivity,
  type OppAction,
} from '../../services/crm'
import { OPP_ACTION_LABELS, OPP_MAIN_PATH, OPP_STATUS_LABELS, SOURCE_LABELS, formatDate, formatMoney } from './labels'
import { ActivityLog } from './ActivityLog'

/**
 * Lehetőség-részletek — FSM stepper (nyitott → … → megnyert, +elveszett
 * mellékág), súlyozott érték, validált átmenet-gombok, ajánlat-csonk
 * létrehozás (oppCreateQuote handoff → draft quote + toast), napló.
 */

const ACTION_ORDER: OppAction[] = ['startDiscovery', 'startProposal', 'sendQuote', 'negotiate', 'win', 'lose']

function OppTransitionPanel({ oppId, status }: { oppId: string; status: keyof typeof OPP_STATUS_LABELS }) {
  const transition = useOppTransition()
  const [losing, setLosing] = useState(false)
  const [reason, setReason] = useState('')

  const pendingReason = transition.isPending ? 'Folyamatban…' : undefined

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTION_ORDER.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action === 'lose' && losing ? 'primary' : 'secondary'}
            disabledReason={
              pendingReason ?? transitionBlockReason(OPP_FSM, action, status, OPP_STATUS_LABELS)
            }
            onClick={() =>
              action === 'lose'
                ? setLosing((l) => !l)
                : transition.mutate({ id: oppId, action, payload: {} })
            }
          >
            {OPP_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>

      {losing && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            transition.mutate(
              { id: oppId, action: 'lose', payload: { reason } },
              { onSuccess: () => { setLosing(false); setReason('') } },
            )
          }}
        >
          <label className="block text-[11px] font-medium text-ink" htmlFor="lose-reason">
            Elvesztés indoka <span aria-hidden="true">*</span>
          </label>
          <input
            id="lose-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <div className="flex gap-2">
            <Button
              type="submit" size="sm" variant="destructive"
              disabledReason={reason.trim() === '' ? 'Add meg az indokot.' : pendingReason}
            >
              Elvesztés megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setLosing(false)}>
              Mégse
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function OppDetailSlideOver({ oppId, onClose }: { oppId: string | null; onClose: () => void }) {
  const { data: opp, isPending, isError } = useOpp(oppId)
  const createQuote = useCreateQuoteFromOpp()
  const addActivity = useAddOppActivity()
  if (oppId === null) return null

  const prob = opp ? OPP_STAGE_PROBABILITY[opp.status] : 0

  return (
    <SlideOver open onClose={onClose} title={oppId}
      subtitle={opp ? `${opp.customer} · ${opp.title}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A lehetőség betöltése nem sikerült.</p>}

        {opp && (
          <>
            <FsmStepper
              label="Lehetőség állapota"
              steps={OPP_MAIN_PATH}
              currentKey={opp.status}
              sideLabel={OPP_STATUS_LABELS[opp.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="crmOpportunity" status={opp.status} label={OPP_STATUS_LABELS[opp.status]} />
              <StatusPill size="sm" tone="info" label={SOURCE_LABELS[opp.source]} />
              <span className="ml-auto text-[11px] text-ink-muted">{opp.owner}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Érték', val: formatMoney(opp.value) },
                { label: 'Valószínűség', val: `${Math.round(prob * 100)}%` },
                { label: 'Súlyozott', val: formatMoney(weightedValue(opp.value, opp.status)) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-line p-3 text-center">
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</div>
                  <div className="text-[15px] font-semibold tabular-nums text-ink">{s.val}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Ügyfél', val: opp.customer },
                { label: 'Kontakt', val: opp.contact },
                { label: 'Város', val: opp.city },
                { label: 'Várható zárás', val: formatDate(opp.expectedClose) },
                { label: 'Létrehozva', val: formatDate(opp.createdAt) },
                { label: 'Forrás lead', val: opp.fromLead ?? '—' },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
            </div>

            {opp.lostReason && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Elvesztés oka:</span> {opp.lostReason}
              </div>
            )}

            {/* oppCreateQuote handoff — meglévő ajánlatnál a kapcsolatot mutatjuk */}
            {opp.quoteId ? (
              <div className="rounded-lg bg-world-soft px-3 py-2 text-[11.5px] text-world-soft-fg">
                Kapcsolt ajánlat: <span className="font-mono font-medium">{opp.quoteId}</span>
              </div>
            ) : (
              <Button
                size="sm"
                // Az MSW kontraktus-guard tükre (handlers.opps.ts): lezárt
                // lehetőségen az akció látható, de aria-disabled + tooltip
                // (plan 3. vezérelv), nem „engedélyezett, aztán 409".
                disabledReason={
                  !isOppOpen(opp.status)
                    ? 'Lezárt lehetőséghez nem hozható létre ajánlat.'
                    : createQuote.isPending
                      ? 'Folyamatban…'
                      : undefined
                }
                onClick={() => createQuote.mutate(opp.id)}
              >
                Ajánlat-piszkozat létrehozása
              </Button>
            )}

            <OppTransitionPanel oppId={opp.id} status={opp.status} />

            <ActivityLog
              activities={opp.activities}
              who={opp.owner}
              onAdd={(payload) => addActivity.mutate({ id: opp.id, payload })}
              isPending={addActivity.isPending}
            />
          </>
        )}
      </div>
    </SlideOver>
  )
}
