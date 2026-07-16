import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  INSPECTION_FSM, failNotesBlockReason, qaManageBlockReason, transitionBlockReason,
  useCreateTicket, useInspection, useInspectionTransition, useQaPermissions,
  type InspectionAction, type InspectionStatus, type TicketPriority,
} from '../services'
import type { FailureNoteInput, FailureType, Inspection } from '../services/inspections'
import {
  CHECKPOINT_TYPE_META, CRITERIA_TYPE_LABELS, CRITICAL_LEVEL_META,
  FAILURE_TYPE_LABELS, INSPECTION_ACTION_LABELS, INSPECTION_MAIN_PATH,
  INSPECTION_STATUS_LABELS, TICKET_PRIORITY_META, TICKET_PRIORITY_ORDER,
  formatDate, formatDateTime,
} from './labels'

/**
 * Átvizsgálás-részletek — FSM stepper (nyitott → folyamatban → megfelelt,
 * selejt mellékág), checklist (a pont ellenőrzési szempontjai, soronkénti
 * aria-labellel), validált átmenet-gombok (tiltott akció: disabledReason =
 * aria-disabled + tooltip, SOSEM rejtett). Űrlapos akciók: megfelelt-lezárás
 * (opcionális megjegyzés), selejtezés (hibajegyzet-építő — legalább 1 tétel a
 * CompleteWithFail() tükreként). Selejt állapotban a hibajegyzetek listája +
 * kapcsolt hibajegy nyitása (rule-6 keresztkötés: a mutáció az átvizsgálás
 * openTickets mezőjét is frissíti). Indok-lánc: folyamatban → qa.manage →
 * FSM-guard (+ selejtezésnél a hibajegyzet-guard az űrlap beküldésén).
 */

const inputCls =
  'h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'
const labelCls = 'block text-[11px] font-medium text-ink'

// ── Selejtezés-űrlap: hibajegyzet-építő (CompleteWithFail FailureNote-tükör) ─

function FailForm({
  pendingReason, onSubmit, onCancel,
}: {
  pendingReason: string | undefined
  onSubmit: (payload: { failureNotes: FailureNoteInput[]; notes?: string }) => void
  onCancel: () => void
}) {
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<FailureNoteInput[]>([])
  const [draftType, setDraftType] = useState<FailureType>('karc')
  const [draftDescription, setDraftDescription] = useState('')

  const addItem = () => {
    setItems((prev) => [...prev, { failureType: draftType, description: draftDescription.trim() }])
    setDraftDescription('')
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ failureNotes: items, notes: notes.trim() || undefined })
      }}
    >
      <div className="text-[11px] font-semibold text-ink">Hibajegyzetek (legalább 1 kötelező)</div>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index}
              className="flex items-center gap-2 rounded-lg bg-surface-1 px-2.5 py-1.5 text-[11.5px] text-ink">
              <span className="font-medium">{FAILURE_TYPE_LABELS[item.failureType]}:</span>
              <span className="min-w-0 flex-1 truncate">{item.description}</span>
              <button
                type="button"
                aria-label={`${FAILURE_TYPE_LABELS[item.failureType]} hibajegyzet törlése`}
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="rounded text-[11px] text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Törlés
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <div>
          <label className={labelCls} htmlFor="insp-fail-type">Hibatípus</label>
          <select id="insp-fail-type" value={draftType}
            onChange={(e) => setDraftType(e.target.value as FailureType)} className={inputCls}>
            {(Object.keys(FAILURE_TYPE_LABELS) as FailureType[]).map((t) => (
              <option key={t} value={t}>{FAILURE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="insp-fail-desc">Leírás</label>
          <input id="insp-fail-desc" value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)} className={inputCls} />
        </div>
      </div>
      <Button type="button" size="sm" variant="secondary"
        disabledReason={draftDescription.trim() === '' ? 'Add meg a hibajegyzet leírását.' : undefined}
        onClick={addItem}>
        Hibajegyzet hozzáadása
      </Button>

      <div>
        <label className={labelCls} htmlFor="insp-fail-notes">Megjegyzés (opcionális)</label>
        <input id="insp-fail-notes" value={notes}
          onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </div>

      <div className="flex gap-2">
        {/* a beküldés-guard a CompleteWithFail() tükre: legalább 1 hibajegyzet */}
        <Button type="submit" size="sm" variant="destructive"
          disabledReason={failNotesBlockReason(items.length) ?? pendingReason}>
          Selejtezés megerősítése
        </Button>
        <Button type="button" size="sm" variant="quiet" onClick={onCancel}>Mégse</Button>
      </div>
    </form>
  )
}

// ── Kapcsolt hibajegy nyitása (CreateTicketCommand tükör, rule-6 keresztkötés) ─

function CreateTicketForm({
  inspection, pendingReason, onDone, onCancel,
}: {
  inspection: Inspection
  pendingReason: string | undefined
  onDone: () => void
  onCancel: () => void
}) {
  const createTicket = useCreateTicket()
  const [title, setTitle] = useState(
    inspection.failureNotes[0]
      ? `${FAILURE_TYPE_LABELS[inspection.failureNotes[0].failureType]} — ${inspection.checkpointName}`
      : '',
  )
  const [description, setDescription] = useState(inspection.failureNotes[0]?.description ?? '')
  const [priority, setPriority] = useState<TicketPriority>(
    inspection.criticalLevel === 'kritikus' ? 'kritikus' : 'magas',
  )

  // a backend CreateTicketCommand guardjainak tükre (cím 5–200, leírás min. 10)
  const validationReason =
    title.trim().length < 5
      ? 'A hibajegy címe legalább 5 karakter legyen.'
      : description.trim().length < 10
        ? 'A hibajegy leírása legalább 10 karakter legyen.'
        : undefined

  return (
    <form
      className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        createTicket.mutate(
          {
            ticketType: 'javitas', priority,
            title: title.trim(), description: description.trim(),
            inspectionId: inspection.id,
            orderRef: inspection.orderRef, productName: inspection.productName,
          },
          { onSuccess: onDone },
        )
      }}
    >
      <div>
        <label className={labelCls} htmlFor="insp-ticket-title">
          Hibajegy címe <span aria-hidden="true">*</span>
        </label>
        <input id="insp-ticket-title" value={title}
          onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="insp-ticket-desc">
          Leírás <span aria-hidden="true">*</span>
        </label>
        <input id="insp-ticket-desc" value={description}
          onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="insp-ticket-priority">Prioritás</label>
        <select id="insp-ticket-priority" value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)} className={inputCls}>
          {TICKET_PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{TICKET_PRIORITY_META[p].label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm"
          disabledReason={validationReason ?? (createTicket.isPending ? 'Folyamatban…' : pendingReason)}>
          Hibajegy létrehozása
        </Button>
        <Button type="button" size="sm" variant="quiet" onClick={onCancel}>Mégse</Button>
      </div>
    </form>
  )
}

// ── Átmenet-panel ───────────────────────────────────────────────────────────

function InspectionTransitionPanel({ inspection }: { inspection: Inspection }) {
  const transition = useInspectionTransition()
  const { canManage } = useQaPermissions()
  const [activeForm, setActiveForm] = useState<'pass' | 'fail' | 'ticket' | null>(null)
  const [passNotes, setPassNotes] = useState('')

  const status: InspectionStatus = inspection.status
  const pendingReason = transition.isPending ? 'Folyamatban…' : undefined
  const manageReason = qaManageBlockReason(canManage)

  /** Indok-lánc: folyamatban → jogosultság → FSM-guard. */
  const blockReason = (action: InspectionAction): string | undefined =>
    pendingReason ??
    manageReason ??
    transitionBlockReason(INSPECTION_FSM, action, status, INSPECTION_STATUS_LABELS)

  const closeForm = () => {
    setActiveForm(null)
    setPassNotes('')
  }

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabledReason={blockReason('start')}
          onClick={() => transition.mutate({ id: inspection.id, action: 'start', payload: {} })}>
          {INSPECTION_ACTION_LABELS.start}
        </Button>
        <Button size="sm" variant={activeForm === 'pass' ? 'primary' : 'secondary'}
          disabledReason={blockReason('pass')}
          onClick={() => setActiveForm((f) => (f === 'pass' ? null : 'pass'))}>
          {INSPECTION_ACTION_LABELS.pass}
        </Button>
        <Button size="sm" variant={activeForm === 'fail' ? 'primary' : 'secondary'}
          disabledReason={blockReason('fail')}
          onClick={() => setActiveForm((f) => (f === 'fail' ? null : 'fail'))}>
          {INSPECTION_ACTION_LABELS.fail}
        </Button>
        {/* kapcsolt hibajegy csak selejt-átvizsgálásból nyitható */}
        <Button size="sm" variant={activeForm === 'ticket' ? 'primary' : 'secondary'}
          disabledReason={
            pendingReason ?? manageReason ??
            (status !== 'selejt' ? 'Hibajegy csak selejt állapotú átvizsgálásból nyitható.' : undefined)
          }
          onClick={() => setActiveForm((f) => (f === 'ticket' ? null : 'ticket'))}>
          Hibajegy nyitása
        </Button>
      </div>

      {/* Megfelelt-lezárás: opcionális megjegyzés (CompleteWithPass tükör) */}
      {activeForm === 'pass' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            transition.mutate(
              { id: inspection.id, action: 'pass', payload: { notes: passNotes.trim() || undefined } },
              { onSuccess: closeForm },
            )
          }}
        >
          <label className={labelCls} htmlFor="insp-pass-notes">Megjegyzés (opcionális)</label>
          <input id="insp-pass-notes" value={passNotes}
            onChange={(e) => setPassNotes(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabledReason={pendingReason}>
              Megfelelt megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {activeForm === 'fail' && (
        <FailForm
          pendingReason={pendingReason}
          onSubmit={(payload) =>
            transition.mutate({ id: inspection.id, action: 'fail', payload }, { onSuccess: closeForm })}
          onCancel={closeForm}
        />
      )}

      {activeForm === 'ticket' && (
        <CreateTicketForm
          inspection={inspection}
          pendingReason={pendingReason}
          onDone={closeForm}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

// ── SlideOver ───────────────────────────────────────────────────────────────

export function InspectionDetailSlideOver({
  inspectionId, onClose,
}: {
  inspectionId: string | null
  onClose: () => void
}) {
  const { data: inspection, isPending, isError } = useInspection(inspectionId)
  if (inspectionId === null) return null

  return (
    <SlideOver open onClose={onClose} title={inspection?.checkpointName ?? inspectionId}
      subtitle={inspection ? `${inspection.id} · ${inspection.productName ?? inspection.orderRef ?? '—'}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">Az átvizsgálás betöltése nem sikerült.</p>}

        {inspection && (
          <>
            <FsmStepper
              label="Átvizsgálás állapota"
              steps={INSPECTION_MAIN_PATH}
              currentKey={inspection.status}
              sideLabel={INSPECTION_STATUS_LABELS[inspection.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="qaEllenorzes" status={inspection.status} label={INSPECTION_STATUS_LABELS[inspection.status]} />
              <StatusPill size="sm" tone={CHECKPOINT_TYPE_META[inspection.checkpointType].tone} label={CHECKPOINT_TYPE_META[inspection.checkpointType].label} />
              <StatusPill size="sm" tone={CRITICAL_LEVEL_META[inspection.criticalLevel].tone} label={CRITICAL_LEVEL_META[inspection.criticalLevel].label} />
              {inspection.blocking && (
                <StatusPill size="sm" tone="danger" label="Gyártás-blokkoló" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Rendelés', val: inspection.orderRef ?? '—' },
                { label: 'Termék', val: inspection.productName ?? '—' },
                { label: 'Ellenőr', val: inspection.inspectorName },
                { label: 'Tervezett', val: formatDate(inspection.plannedAt) },
                { label: 'Megkezdve', val: formatDateTime(inspection.startedAt) },
                { label: 'Lezárva', val: formatDateTime(inspection.completedAt) },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
            </div>

            {/* Checklist: a pont ellenőrzési szempontjai (soronkénti aria-label) */}
            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Ellenőrzési szempontok ({inspection.criteria.length})
              </div>
              <ul aria-label="Ellenőrzési szempontok" className="space-y-1.5">
                {inspection.criteria.map((criterion) => (
                  <li
                    key={criterion.id}
                    aria-label={`${CRITERIA_TYPE_LABELS[criterion.type]} szempont: ${criterion.description}`}
                    className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2"
                  >
                    <span className="w-24 shrink-0 text-[10.5px] font-medium text-ink-muted">
                      {CRITERIA_TYPE_LABELS[criterion.type]}
                    </span>
                    <span className="text-[11.5px] text-ink">{criterion.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            {inspection.notes && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Megjegyzés:</span> {inspection.notes}
              </div>
            )}

            {/* Hibajegyzetek (selejt-átvizsgálásnál) + kapcsolt hibajegy-számláló */}
            {inspection.failureNotes.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Hibajegyzetek ({inspection.failureNotes.length}) · kapcsolt nyitott hibajegy: {inspection.openTickets}
                </div>
                <ul aria-label="Hibajegyzetek" className="space-y-1.5">
                  {inspection.failureNotes.map((note, index) => (
                    <li key={index}
                      aria-label={`${FAILURE_TYPE_LABELS[note.failureType]}: ${note.description}`}
                      className="rounded-lg bg-surface-2/60 px-3 py-2">
                      <div className="text-[10.5px] font-medium text-rose-600 dark:text-rose-400">
                        {FAILURE_TYPE_LABELS[note.failureType]}
                      </div>
                      <div className="text-[11.5px] text-ink">{note.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <InspectionTransitionPanel inspection={inspection} />
          </>
        )}
      </div>
    </SlideOver>
  )
}
