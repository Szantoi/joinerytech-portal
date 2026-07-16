import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  LEAD_FSM, transitionBlockReason,
  useLead, useLeadTransition, useConvertLead, useAddLeadActivity,
  type SimpleLeadAction,
} from '../services'
import { LEAD_ACTION_LABELS, LEAD_MAIN_PATH, LEAD_STATUS_LABELS, SOURCE_LABELS, formatDate, formatMoney } from './labels'
import { ActivityLog } from './ActivityLog'

/**
 * Lead-részletek — FSM stepper (uj → kapcsolat → minosites → nurturing →
 * konvertalva, +elvetve mellékág), validált átmenet-gombok (tiltott akció:
 * disabledReason = aria-disabled + tooltip, nem rejtett), konvertálás
 * lehetőséggé (handoff), tevékenységnapló.
 */

const SIMPLE_ACTIONS: SimpleLeadAction[] = ['contact', 'qualify', 'nurture', 'discard']

function LeadTransitionPanel({ leadId, status, owner }: { leadId: string; status: keyof typeof LEAD_STATUS_LABELS; owner: string }) {
  const transition = useLeadTransition()
  const convert = useConvertLead()
  const [discarding, setDiscarding] = useState(false)
  const [reason, setReason] = useState('')

  const pendingReason = transition.isPending || convert.isPending ? 'Folyamatban…' : undefined

  const run = (action: SimpleLeadAction) => {
    if (action === 'discard') {
      setDiscarding((d) => !d)
      return
    }
    transition.mutate({ id: leadId, action, payload: {} })
  }

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        {SIMPLE_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action === 'discard' && discarding ? 'primary' : 'secondary'}
            disabledReason={
              pendingReason ?? transitionBlockReason(LEAD_FSM, action, status, LEAD_STATUS_LABELS)
            }
            onClick={() => run(action)}
          >
            {LEAD_ACTION_LABELS[action]}
          </Button>
        ))}
        <Button
          size="sm"
          disabledReason={
            pendingReason ?? transitionBlockReason(LEAD_FSM, 'convert', status, LEAD_STATUS_LABELS)
          }
          onClick={() => convert.mutate(leadId)}
        >
          {LEAD_ACTION_LABELS.convert}
        </Button>
      </div>

      {discarding && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            transition.mutate(
              { id: leadId, action: 'discard', payload: { reason } },
              { onSuccess: () => { setDiscarding(false); setReason('') } },
            )
          }}
        >
          <label className="block text-[11px] font-medium text-ink" htmlFor="discard-reason">
            Elvetés indoka <span aria-hidden="true">*</span>
          </label>
          <input
            id="discard-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <div className="flex gap-2">
            <Button
              type="submit" size="sm" variant="destructive"
              disabledReason={reason.trim() === '' ? 'Add meg az indokot.' : pendingReason}
            >
              Elvetés megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setDiscarding(false)}>
              Mégse
            </Button>
          </div>
        </form>
      )}
      {/* meta-jelzés: az elvetett/konvertált lead terminális — csak napló írható */}
      <p className="mt-2 text-[11px] text-ink-muted">{`Felelős: ${owner}`}</p>
    </div>
  )
}

export function LeadDetailSlideOver({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { data: lead, isPending, isError } = useLead(leadId)
  const addActivity = useAddLeadActivity()
  if (leadId === null) return null

  return (
    <SlideOver open onClose={onClose} title={leadId}
      subtitle={lead ? `${lead.contact}${lead.company ? ` · ${lead.company}` : ''}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A lead betöltése nem sikerült.</p>}

        {lead && (
          <>
            <FsmStepper
              label="Lead állapota"
              steps={LEAD_MAIN_PATH}
              currentKey={lead.status}
              sideLabel={LEAD_STATUS_LABELS[lead.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="crmLead" status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
              <StatusPill size="sm" tone="info" label={SOURCE_LABELS[lead.source]} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Kontakt', val: lead.contact },
                { label: 'Cég', val: lead.company || '—' },
                { label: 'Email', val: lead.email },
                { label: 'Telefon', val: lead.phone },
                { label: 'Város', val: lead.city },
                { label: 'Létrehozva', val: formatDate(lead.createdAt) },
                { label: 'Becsült érték', val: formatMoney(lead.estValue) },
                { label: 'Ajánló', val: lead.referredBy ?? '—' },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
              <div className="col-span-2">
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Igény</div>
                <div className="text-[11.5px] leading-relaxed text-ink">{lead.interest}</div>
              </div>
            </div>

            {lead.lostReason && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Elvetés oka:</span> {lead.lostReason}
              </div>
            )}
            {lead.oppId && (
              <div className="rounded-lg bg-world-soft px-3 py-2 text-[11.5px] text-world-soft-fg">
                Konvertálva lehetőséggé: <span className="font-mono font-medium">{lead.oppId}</span>
              </div>
            )}

            <LeadTransitionPanel leadId={lead.id} status={lead.status} owner={lead.owner} />

            <ActivityLog
              activities={lead.activities}
              who={lead.owner}
              onAdd={(payload) => addActivity.mutate({ id: lead.id, payload })}
              isPending={addActivity.isPending}
            />
          </>
        )}
      </div>
    </SlideOver>
  )
}
