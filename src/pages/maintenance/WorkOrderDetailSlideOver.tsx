import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../components/ui'
import {
  WORK_ORDER_FSM, assignBlockReason, maintenanceManageBlockReason,
  startAssignmentBlockReason, transitionBlockReason,
  useMaintenancePermissions, useWorkOrder, useWorkOrderAssign, useWorkOrderTransition,
  type WorkOrderAction, type WorkOrderStatus,
} from '../../services/maintenance'
import type { AssignmentType, WorkOrder } from '../../services/maintenance/workOrders'
import {
  ASSIGNMENT_TYPE_LABELS, WO_ACTION_LABELS, WO_MAIN_PATH, WO_PRIORITY_META,
  WO_STATUS_LABELS, WO_TYPE_META, formatDate, formatHours,
} from './labels'

/**
 * Munkalap-részletek — FSM stepper (bejelentve → utemezve → folyamatban → kesz,
 * halasztva/elutasitva mellékág), validált átmenet-gombok (tiltott akció:
 * disabledReason = aria-disabled + tooltip, SOSEM rejtett — a HR
 * AbsenceDetailSlideOver mintája). Űrlapos akciók: ütemezés (dátum + becsült
 * óra), hozzárendelés (típus + név), lezárás (tényleges óra), halasztás/
 * elutasítás (kötelező indok). Indok-lánc: folyamatban → maintenance.manage →
 * FSM-guard (+ startnál a felelős-guard).
 */

/** Egy-lépéses (payload nélküli) akciók a gombsorban; a többi űrlapot nyit. */
const SIMPLE_ACTIONS: WorkOrderAction[] = ['start', 'reopen']

/** Űrlapot nyitó akciók (+ a nem-FSM assign) — a panel activeForm kulcsai. */
type FormKey = 'schedule' | 'complete' | 'postpone' | 'reject' | 'assign'
const FORM_ACTIONS: Exclude<FormKey, 'assign'>[] = ['schedule', 'complete', 'postpone', 'reject']

const inputCls =
  'h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'

function WorkOrderTransitionPanel({ workOrder }: { workOrder: WorkOrder }) {
  const transition = useWorkOrderTransition()
  const assign = useWorkOrderAssign()
  const { canManage } = useMaintenancePermissions()
  const [activeForm, setActiveForm] = useState<FormKey | null>(null)

  // űrlap-mezők (az aktív űrlap váltásakor a beküldés reseteli őket)
  const [scheduledAt, setScheduledAt] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [actualHours, setActualHours] = useState('')
  const [reason, setReason] = useState('')
  const [assignType, setAssignType] = useState<AssignmentType>('belso')
  const [assigneeName, setAssigneeName] = useState('')

  const status: WorkOrderStatus = workOrder.status
  const pendingReason = transition.isPending || assign.isPending ? 'Folyamatban…' : undefined
  const manageReason = maintenanceManageBlockReason(canManage)

  /** Indok-lánc: folyamatban → jogosultság → FSM-guard (+ start: felelős-guard). */
  const blockReason = (action: WorkOrderAction): string | undefined =>
    pendingReason ??
    manageReason ??
    transitionBlockReason(WORK_ORDER_FSM, action, status, WO_STATUS_LABELS) ??
    (action === 'start' ? startAssignmentBlockReason(workOrder.assigneeName) : undefined)

  const assignReason: string | undefined =
    pendingReason ?? manageReason ?? assignBlockReason(status, WO_STATUS_LABELS)

  const closeForm = () => {
    setActiveForm(null)
    setScheduledAt(''); setEstimatedHours(''); setActualHours('')
    setReason(''); setAssigneeName('')
  }

  const submitTransition = (
    action: WorkOrderAction,
    payload: Parameters<typeof transition.mutate>[0]['payload'],
  ) => {
    transition.mutate({ id: workOrder.id, action, payload }, { onSuccess: closeForm })
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
            {WO_ACTION_LABELS[action]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={activeForm === 'assign' ? 'primary' : 'secondary'}
          disabledReason={assignReason}
          onClick={() => setActiveForm((f) => (f === 'assign' ? null : 'assign'))}
        >
          Hozzárendelés
        </Button>
        {SIMPLE_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant="secondary"
            disabledReason={blockReason(action)}
            onClick={() => submitTransition(action, {})}
          >
            {WO_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>

      {/* Ütemezés: dátum + becsült óraszám kötelező (ScheduleWorkOrderCommand) */}
      {activeForm === 'schedule' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitTransition('schedule', {
              scheduledAt, estimatedHours: Number(estimatedHours),
            })
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-ink" htmlFor="wo-scheduled-at">
                Ütemezett dátum <span aria-hidden="true">*</span>
              </label>
              <input id="wo-scheduled-at" type="date" value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink" htmlFor="wo-est-hours">
                Becsült óra <span aria-hidden="true">*</span>
              </label>
              <input id="wo-est-hours" type="number" min="0.5" step="0.5" value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={
                scheduledAt === '' || Number(estimatedHours) <= 0
                  ? 'Add meg a dátumot és a pozitív becsült óraszámot.'
                  : pendingReason
              }>
              Ütemezés mentése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Hozzárendelés: típus + felelős-név (AssignWorkOrderCommand) */}
      {activeForm === 'assign' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            assign.mutate(
              { id: workOrder.id, input: { assignmentType: assignType, assigneeName } },
              { onSuccess: closeForm },
            )
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-ink" htmlFor="wo-assign-type">
                Típus
              </label>
              <select id="wo-assign-type" value={assignType}
                onChange={(e) => setAssignType(e.target.value as AssignmentType)} className={inputCls}>
                {(Object.keys(ASSIGNMENT_TYPE_LABELS) as AssignmentType[]).map((t) => (
                  <option key={t} value={t}>{ASSIGNMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink" htmlFor="wo-assignee">
                Felelős neve <span aria-hidden="true">*</span>
              </label>
              <input id="wo-assignee" value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={assigneeName.trim() === '' ? 'Add meg a felelős nevét.' : pendingReason}>
              Hozzárendelés mentése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Lezárás: tényleges óraszám kötelező (CompleteWorkOrderCommand) */}
      {activeForm === 'complete' && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitTransition('complete', { actualHours: Number(actualHours) })
          }}
        >
          <label className="block text-[11px] font-medium text-ink" htmlFor="wo-actual-hours">
            Tényleges óraszám <span aria-hidden="true">*</span>
          </label>
          <input id="wo-actual-hours" type="number" min="0.5" step="0.5" value={actualHours}
            onChange={(e) => setActualHours(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={Number(actualHours) <= 0 ? 'Add meg a pozitív tényleges óraszámot.' : pendingReason}>
              Lezárás megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Halasztás / elutasítás: kötelező indok (Postpone/RejectWorkOrderCommand) */}
      {(activeForm === 'postpone' || activeForm === 'reject') && (
        <form
          className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitTransition(activeForm, { reason })
          }}
        >
          <label className="block text-[11px] font-medium text-ink" htmlFor="wo-reason">
            {activeForm === 'postpone' ? 'Halasztás indoka' : 'Elutasítás indoka'}{' '}
            <span aria-hidden="true">*</span>
          </label>
          <input id="wo-reason" value={reason}
            onChange={(e) => setReason(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              variant={activeForm === 'reject' ? 'destructive' : 'primary'}
              disabledReason={reason.trim() === '' ? 'Add meg az indokot.' : pendingReason}>
              {activeForm === 'postpone' ? 'Halasztás megerősítése' : 'Elutasítás megerősítése'}
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function WorkOrderDetailSlideOver({
  workOrderId, onClose,
}: {
  workOrderId: string | null
  onClose: () => void
}) {
  const { data: workOrder, isPending, isError } = useWorkOrder(workOrderId)
  if (workOrderId === null) return null

  return (
    <SlideOver open onClose={onClose} title={workOrder?.title ?? workOrderId}
      subtitle={workOrder ? `${workOrder.id} · ${workOrder.assetName}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A munkalap betöltése nem sikerült.</p>}

        {workOrder && (
          <>
            <FsmStepper
              label="Munkalap állapota"
              steps={WO_MAIN_PATH}
              currentKey={workOrder.status}
              sideLabel={WO_STATUS_LABELS[workOrder.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="maintenanceMunkalap" status={workOrder.status} label={WO_STATUS_LABELS[workOrder.status]} />
              <StatusPill size="sm" tone={WO_TYPE_META[workOrder.type].tone} label={WO_TYPE_META[workOrder.type].label} />
              <StatusPill size="sm" tone={WO_PRIORITY_META[workOrder.priority].tone} label={WO_PRIORITY_META[workOrder.priority].label} />
              {workOrder.requiresDowntime && (
                <StatusPill size="sm" tone="danger" label="Leállással jár" />
              )}
            </div>

            <p className="text-[11.5px] leading-relaxed text-ink">{workOrder.description}</p>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Eszköz', val: `${workOrder.assetName} (${workOrder.assetCode})` },
                { label: 'Bejelentve', val: formatDate(workOrder.reportedAt) },
                { label: 'Ütemezve', val: formatDate(workOrder.scheduledAt) },
                {
                  label: 'Becsült / tényleges idő',
                  val: `${workOrder.estimatedHours !== null ? formatHours(workOrder.estimatedHours) : '—'} / ${workOrder.actualHours !== null ? formatHours(workOrder.actualHours) : '—'}`,
                },
                {
                  label: 'Felelős',
                  val: workOrder.assigneeName
                    ? `${workOrder.assigneeName}${workOrder.assignmentType ? ` (${ASSIGNMENT_TYPE_LABELS[workOrder.assignmentType]})` : ''}`
                    : '—',
                },
                { label: 'Lezárva', val: formatDate(workOrder.completedAt) },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="text-ink">{f.val}</div>
                </div>
              ))}
            </div>

            {workOrder.postponementReason && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Halasztás oka:</span> {workOrder.postponementReason}
              </div>
            )}
            {workOrder.rejectionReason && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Elutasítás oka:</span> {workOrder.rejectionReason}
              </div>
            )}

            <WorkOrderTransitionPanel workOrder={workOrder} />

            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Napló
              </div>
              <ol className="space-y-1.5">
                {workOrder.log.map((entry, i) => (
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
