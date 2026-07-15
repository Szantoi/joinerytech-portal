import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../components/ui'
import {
  ABSENCE_FSM, transitionBlockReason,
  useAbsence, useAbsenceTransition, useHrPermissions, manageBlockReason,
  type AbsenceAction, type AbsenceStatus,
} from '../../services/hr'
import {
  ABSENCE_ACTION_LABELS, ABSENCE_MAIN_PATH, ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_META, formatDate,
} from './labels'

/**
 * Távollét-részletek — FSM stepper (kert → jovahagyva → folyamatban → lezarva,
 * +elutasitva mellékág), validált átmenet-gombok (tiltott akció: disabledReason
 * = aria-disabled + tooltip, SOSEM rejtett — a CRM LeadDetailSlideOver mintája),
 * elutasításnál kötelező indok, kérelem-napló.
 */

/** Egy-lépéses (payload nélküli) akciók a gombsorban; a reject űrlapot nyit. */
const SIMPLE_ACTIONS: Exclude<AbsenceAction, 'reject'>[] = [
  'approve', 'start', 'complete', 'reopen',
]

/** hr.manage jogosultsághoz kötött döntési akciók (terv + services/hr README 4.). */
const MANAGE_ACTIONS: AbsenceAction[] = ['approve', 'reject']

function AbsenceTransitionPanel({ absenceId, status }: { absenceId: string; status: AbsenceStatus }) {
  const transition = useAbsenceTransition()
  const { canManage } = useHrPermissions()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const pendingReason = transition.isPending ? 'Folyamatban…' : undefined

  /** Indok-lánc: folyamatban → jogosultság (approve/reject) → FSM-guard. */
  const blockReason = (action: AbsenceAction): string | undefined =>
    pendingReason ??
    (MANAGE_ACTIONS.includes(action) ? manageBlockReason(canManage) : undefined) ??
    transitionBlockReason(ABSENCE_FSM, action, status, ABSENCE_STATUS_LABELS)

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
            variant="secondary"
            disabledReason={blockReason(action)}
            onClick={() => transition.mutate({ id: absenceId, action, payload: {} })}
          >
            {ABSENCE_ACTION_LABELS[action]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={rejecting ? 'primary' : 'secondary'}
          disabledReason={blockReason('reject')}
          onClick={() => setRejecting((r) => !r)}
        >
          {ABSENCE_ACTION_LABELS.reject}
        </Button>
      </div>

      {rejecting && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            transition.mutate(
              { id: absenceId, action: 'reject', payload: { reason } },
              { onSuccess: () => { setRejecting(false); setReason('') } },
            )
          }}
        >
          <label className="block text-[11px] font-medium text-ink" htmlFor="reject-reason">
            Elutasítás indoka <span aria-hidden="true">*</span>
          </label>
          <input
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <div className="flex gap-2">
            <Button
              type="submit" size="sm" variant="destructive"
              disabledReason={reason.trim() === '' ? 'Add meg az indokot.' : pendingReason}
            >
              Elutasítás megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setRejecting(false)}>
              Mégse
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function AbsenceDetailSlideOver({ absenceId, onClose }: { absenceId: string | null; onClose: () => void }) {
  const { data: absence, isPending, isError } = useAbsence(absenceId)
  if (absenceId === null) return null

  return (
    <SlideOver open onClose={onClose} title={absence?.empName ?? absenceId}
      subtitle={absence ? `${ABSENCE_TYPE_META[absence.type].label} · ${absence.days} munkanap` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A távollét betöltése nem sikerült.</p>}

        {absence && (
          <>
            <FsmStepper
              label="Távollét állapota"
              steps={ABSENCE_MAIN_PATH}
              currentKey={absence.status}
              sideLabel={ABSENCE_STATUS_LABELS[absence.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="hrTavollet" status={absence.status} label={ABSENCE_STATUS_LABELS[absence.status]} />
              <StatusPill size="sm" tone={ABSENCE_TYPE_META[absence.type].tone} label={ABSENCE_TYPE_META[absence.type].label} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Kezdete', val: formatDate(absence.start) },
                { label: 'Vége', val: formatDate(absence.end) },
                { label: 'Munkanapok', val: `${absence.days} nap` },
                { label: 'Kérelmezve', val: formatDate(absence.requestedAt) },
                { label: 'Jóváhagyó', val: absence.approvedBy ?? '—' },
                { label: 'Jóváhagyva', val: formatDate(absence.approvedAt) },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
              {absence.reason && (
                <div className="col-span-2">
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Indoklás</div>
                  <div className="text-[11.5px] leading-relaxed text-ink">{absence.reason}</div>
                </div>
              )}
            </div>

            {absence.rejectReason && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Elutasítás oka:</span> {absence.rejectReason}
              </div>
            )}

            <AbsenceTransitionPanel absenceId={absence.id} status={absence.status} />

            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Napló
              </div>
              <ol className="space-y-1.5">
                {absence.log.map((entry, i) => (
                  <li key={i} className="rounded-lg bg-surface-2/60 px-3 py-2">
                    <div className="font-mono text-[10px] text-ink-muted">{entry.at}</div>
                    <div className="text-[11.5px] text-ink">{entry.text}</div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </SlideOver>
  )
}
