import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  TICKET_FSM, TICKET_PRIORITY_RANK, escalateStatusBlockReason, qaManageBlockReason,
  resolveActionsBlockReason, transitionBlockReason,
  useQaPermissions, useTicket, useTicketEscalate, useTicketTransition,
  type TicketAction, type TicketPriority, type TicketStatus,
} from '../services'
import type { ResolutionActionInput, ResolutionActionType, Ticket } from '../services/tickets'
import {
  ACTION_TYPE_LABELS, TICKET_ACTION_LABELS, TICKET_MAIN_PATH, TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER, TICKET_STATUS_LABELS, TICKET_STATUS_META, TICKET_TYPE_META,
  formatDateTime, formatHuf,
} from './labels'

/**
 * Hibajegy-részletek — FSM stepper (bejelentve → kiosztva → folyamatban →
 * megoldva, elutasitva mellékág), validált átmenet-gombok (tiltott akció:
 * disabledReason = aria-disabled + tooltip, SOSEM rejtett). Űrlapos akciók:
 * kiosztás (felelős), megoldás (intézkedés-építő — legalább 1 tétel a
 * Resolve() tükreként + opcionális megjegyzés), elutasítás (kötelező indok).
 * Eszkaláció: státusz- és rang-guardolt (EscalatePriority tükör), csak
 * magasabb prioritás választható. Indok-lánc: folyamatban → qa.manage →
 * FSM-guard (eszkalációnál: státusz-guard → van-e magasabb fokozat).
 */

/** Egy-lépéses (payload nélküli) akciók a gombsorban; a többi űrlapot nyit. */
const SIMPLE_ACTIONS: TicketAction[] = ['start', 'reopen']

type FormKey = 'assign' | 'resolve' | 'reject' | 'escalate'
const FORM_ACTIONS: Exclude<FormKey, 'escalate'>[] = ['assign', 'resolve', 'reject']

const inputCls =
  'h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'
const labelCls = 'block text-[11px] font-medium text-ink'

/** Prioritás-címkék az fsm-guard hibaüzenetéhez (escalatePriorityBlockReason). */
const PRIORITY_LABELS = Object.fromEntries(
  TICKET_PRIORITY_ORDER.map((p) => [p, TICKET_PRIORITY_META[p].label]),
) as Record<TicketPriority, string>

// ── Megoldás-űrlap: intézkedés-építő (Resolve ResolutionAction-tükör) ────────

function ResolveForm({
  pendingReason, onSubmit, onCancel,
}: {
  pendingReason: string | undefined
  onSubmit: (payload: { resolutionActions: ResolutionActionInput[]; resolutionNotes?: string }) => void
  onCancel: () => void
}) {
  const [items, setItems] = useState<ResolutionActionInput[]>([])
  const [notes, setNotes] = useState('')
  const [draftType, setDraftType] = useState<ResolutionActionType>('javitas')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftCost, setDraftCost] = useState('')

  const addItem = () => {
    setItems((prev) => [...prev, {
      actionType: draftType,
      description: draftDescription.trim(),
      costAmount: Number(draftCost) || 0,
    }])
    setDraftDescription('')
    setDraftCost('')
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ resolutionActions: items, resolutionNotes: notes.trim() || undefined })
      }}
    >
      <div className="text-[11px] font-semibold text-ink">Intézkedések (legalább 1 kötelező)</div>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index}
              className="flex items-center gap-2 rounded-lg bg-surface-1 px-2.5 py-1.5 text-[11.5px] text-ink">
              <span className="font-medium">{ACTION_TYPE_LABELS[item.actionType]}:</span>
              <span className="min-w-0 flex-1 truncate">{item.description}</span>
              <span className="font-mono text-[10.5px] text-ink-muted">{formatHuf(item.costAmount)}</span>
              <button
                type="button"
                aria-label={`${ACTION_TYPE_LABELS[item.actionType]} intézkedés törlése`}
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="rounded text-[11px] text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Törlés
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
        <div>
          <label className={labelCls} htmlFor="ticket-action-type">Típus</label>
          <select id="ticket-action-type" value={draftType}
            onChange={(e) => setDraftType(e.target.value as ResolutionActionType)} className={inputCls}>
            {(Object.keys(ACTION_TYPE_LABELS) as ResolutionActionType[]).map((t) => (
              <option key={t} value={t}>{ACTION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="ticket-action-desc">Leírás</label>
          <input id="ticket-action-desc" value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="ticket-action-cost">Költség (Ft)</label>
          <input id="ticket-action-cost" type="number" min="0" step="1000" value={draftCost}
            onChange={(e) => setDraftCost(e.target.value)} className={inputCls} />
        </div>
      </div>
      <Button type="button" size="sm" variant="secondary"
        disabledReason={draftDescription.trim() === '' ? 'Add meg az intézkedés leírását.' : undefined}
        onClick={addItem}>
        Intézkedés hozzáadása
      </Button>

      <div>
        <label className={labelCls} htmlFor="ticket-resolve-notes">Megoldási megjegyzés (opcionális)</label>
        <input id="ticket-resolve-notes" value={notes}
          onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </div>

      <div className="flex gap-2">
        {/* a beküldés-guard a Resolve() tükre: legalább 1 intézkedés */}
        <Button type="submit" size="sm"
          disabledReason={resolveActionsBlockReason(items.length) ?? pendingReason}>
          Megoldás megerősítése
        </Button>
        <Button type="button" size="sm" variant="quiet" onClick={onCancel}>Mégse</Button>
      </div>
    </form>
  )
}

// ── Átmenet-panel ───────────────────────────────────────────────────────────

function TicketTransitionPanel({ ticket }: { ticket: Ticket }) {
  const transition = useTicketTransition()
  const escalate = useTicketEscalate()
  const { canManage } = useQaPermissions()
  const [activeForm, setActiveForm] = useState<FormKey | null>(null)

  const [assigneeName, setAssigneeName] = useState('')
  const [reason, setReason] = useState('')

  // eszkaláció: csak a jelenleginél MAGASABB fokozatok választhatók (rang-guard)
  const escalateOptions = TICKET_PRIORITY_ORDER.filter(
    (p) => TICKET_PRIORITY_RANK[p] > TICKET_PRIORITY_RANK[ticket.priority],
  )
  const [escalateTo, setEscalateTo] = useState<TicketPriority | ''>('')

  const status: TicketStatus = ticket.status
  const pendingReason = transition.isPending || escalate.isPending ? 'Folyamatban…' : undefined
  const manageReason = qaManageBlockReason(canManage)

  /** Indok-lánc: folyamatban → jogosultság → FSM-guard. */
  const blockReason = (action: TicketAction): string | undefined =>
    pendingReason ??
    manageReason ??
    transitionBlockReason(TICKET_FSM, action, status, TICKET_STATUS_LABELS)

  /** Eszkaláció indok-lánca: folyamatban → jogosultság → státusz-guard → van-e magasabb. */
  const escalateReason: string | undefined =
    pendingReason ??
    manageReason ??
    escalateStatusBlockReason(status) ??
    (escalateOptions.length === 0 ? 'A hibajegy már a legmagasabb (kritikus) prioritáson van.' : undefined)

  const closeForm = () => {
    setActiveForm(null)
    setAssigneeName(''); setReason(''); setEscalateTo('')
  }

  const submitTransition = (
    action: TicketAction,
    payload: Parameters<typeof transition.mutate>[0]['payload'],
  ) => {
    transition.mutate({ id: ticket.id, action, payload }, { onSuccess: closeForm })
  }

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        {FORM_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={activeForm === action ? 'primary' : 'secondary'}
            disabledReason={blockReason(action)}
            onClick={() => setActiveForm((f) => (f === action ? null : action))}
          >
            {TICKET_ACTION_LABELS[action]}
          </Button>
        ))}
        {SIMPLE_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant="secondary"
            disabledReason={blockReason(action)}
            onClick={() => submitTransition(action, {})}
          >
            {TICKET_ACTION_LABELS[action]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={activeForm === 'escalate' ? 'primary' : 'secondary'}
          disabledReason={escalateReason}
          onClick={() => setActiveForm((f) => (f === 'escalate' ? null : 'escalate'))}
        >
          Eszkaláció
        </Button>
      </div>

      {/* Kiosztás: felelős kötelező (AssignTicketCommand) */}
      {activeForm === 'assign' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitTransition('assign', { assigneeName: assigneeName.trim() })
          }}
        >
          <label className={labelCls} htmlFor="ticket-assignee">
            Felelős neve <span aria-hidden="true">*</span>
          </label>
          <input id="ticket-assignee" value={assigneeName}
            onChange={(e) => setAssigneeName(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={assigneeName.trim() === '' ? 'Add meg a felelős nevét.' : pendingReason}>
              Kiosztás mentése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {activeForm === 'resolve' && (
        <ResolveForm
          pendingReason={pendingReason}
          onSubmit={(payload) => submitTransition('resolve', payload)}
          onCancel={closeForm}
        />
      )}

      {/* Elutasítás: kötelező indok (RejectTicketCommand — resolutionNotes-ba kerül) */}
      {activeForm === 'reject' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitTransition('reject', { reason: reason.trim() })
          }}
        >
          <label className={labelCls} htmlFor="ticket-reject-reason">
            Elutasítás indoka <span aria-hidden="true">*</span>
          </label>
          <input id="ticket-reject-reason" value={reason}
            onChange={(e) => setReason(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive"
              disabledReason={reason.trim() === '' ? 'Add meg az indokot.' : pendingReason}>
              Elutasítás megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Eszkaláció: csak magasabb prioritás (EscalatePriority tükör) */}
      {activeForm === 'escalate' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (escalateTo === '') return
            escalate.mutate({ id: ticket.id, priority: escalateTo }, { onSuccess: closeForm })
          }}
        >
          <label className={labelCls} htmlFor="ticket-escalate-priority">
            Új prioritás (jelenlegi: {PRIORITY_LABELS[ticket.priority]}) <span aria-hidden="true">*</span>
          </label>
          <select id="ticket-escalate-priority" value={escalateTo}
            onChange={(e) => setEscalateTo(e.target.value as TicketPriority)} className={inputCls}>
            <option value="">Válassz…</option>
            {escalateOptions.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={escalateTo === '' ? 'Válaszd ki az új (magasabb) prioritást.' : pendingReason}>
              Eszkaláció megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── SlideOver ───────────────────────────────────────────────────────────────

export function TicketDetailSlideOver({
  ticketId, onClose,
}: {
  ticketId: string | null
  onClose: () => void
}) {
  const { data: ticket, isPending, isError } = useTicket(ticketId)
  if (ticketId === null) return null

  return (
    <SlideOver open onClose={onClose} title={ticket?.title ?? ticketId}
      subtitle={ticket ? `${ticket.id} · ${ticket.productName ?? ticket.orderRef ?? '—'}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A hibajegy betöltése nem sikerült.</p>}

        {ticket && (
          <>
            <FsmStepper
              label="Hibajegy állapota"
              steps={TICKET_MAIN_PATH}
              currentKey={ticket.status}
              sideLabel={TICKET_STATUS_META[ticket.status].label}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={TICKET_STATUS_META[ticket.status].tone} label={TICKET_STATUS_META[ticket.status].label} />
              <StatusPill size="sm" tone={TICKET_TYPE_META[ticket.ticketType].tone} label={TICKET_TYPE_META[ticket.ticketType].label} />
              <StatusPill size="sm" tone={TICKET_PRIORITY_META[ticket.priority].tone} label={TICKET_PRIORITY_META[ticket.priority].label} />
            </div>

            <p className="text-[11.5px] leading-relaxed text-ink">{ticket.description}</p>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Rendelés / termék', val: `${ticket.orderRef ?? '—'} · ${ticket.productName ?? '—'}` },
                {
                  label: 'Kapcsolt átvizsgálás',
                  val: ticket.inspectionId
                    ? `${ticket.inspectionId}${ticket.inspectionRef ? ` (${ticket.inspectionRef})` : ''}`
                    : '—',
                },
                { label: 'Bejelentő', val: ticket.reportedBy },
                { label: 'Felelős', val: ticket.assigneeName ?? '—' },
                { label: 'Bejelentve', val: formatDateTime(ticket.reportedAt) },
                { label: 'Kiosztva', val: formatDateTime(ticket.assignedAt) },
                { label: 'Megkezdve', val: formatDateTime(ticket.startedAt) },
                { label: 'Megoldva', val: formatDateTime(ticket.resolvedAt) },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
            </div>

            {ticket.resolutionNotes && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">
                  {ticket.status === 'elutasitva' ? 'Elutasítás oka:' : 'Megoldási megjegyzés:'}
                </span>{' '}
                {ticket.resolutionNotes}
              </div>
            )}

            {ticket.resolutionActions.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Intézkedések ({ticket.resolutionActions.length})
                </div>
                <ul aria-label="Intézkedések" className="space-y-1.5">
                  {ticket.resolutionActions.map((action, index) => (
                    <li key={index}
                      aria-label={`${ACTION_TYPE_LABELS[action.actionType]}: ${action.description}`}
                      className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                      <span className="w-24 shrink-0 text-[10.5px] font-medium text-ink-muted">
                        {ACTION_TYPE_LABELS[action.actionType]}
                      </span>
                      <span className="min-w-0 flex-1 text-[11.5px] text-ink">{action.description}</span>
                      <span className="font-mono text-[10.5px] text-ink-muted">{formatHuf(action.costAmount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <TicketTransitionPanel ticket={ticket} />
          </>
        )}
      </div>
    </SlideOver>
  )
}
