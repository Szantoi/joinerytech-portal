import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  useSafetyWalk, useWalkTransition, useAddWalkFinding,
  SAFETY_WALK_FSM, WALK_FINDING_ALLOWED_STATUS, transitionBlockReason,
  useEhsLocations, locationNameMap, employeeName, CURRENT_EMPLOYEE_ID, EHS_EMPLOYEE_DIRECTORY,
  type SafetyWalkAction, type FindingSeverity,
} from '../services'
import { FINDING_SEVERITY_LABELS, WALK_MAIN_PATH, WALK_STATUS_LABELS, formatDateTime } from './labels'
import { EmployeeOptions, SelectField, TextAreaField, DateField } from './formFields'

/**
 * Bejárás-részletek — FSM stepper (utemezett → folyamatban → intézkedés → lezárt,
 * +elmaradt mellékág), megállapítás-lista, megállapítás-rögzítés (csak Folyamatban),
 * megállapítás → CAPA generálás (felelős + határidő), validált átmenet-gombok.
 * A lezárás guardját (minden CAPA kész) a szerver érvényesíti → 409 → toast.
 */

const WALK_ACTION_LABELS: Record<SafetyWalkAction, string> = {
  start: 'Indítás',
  complete: 'Befejezés',
  close: 'Lezárás',
  cancel: 'Lemondás',
}

function defaultDueDate(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function FindingForm({ walkId }: { walkId: string }) {
  const addFinding = useAddWalkFinding()
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<FindingSeverity>('Moderate')
  const [requiresAction, setRequiresAction] = useState(false)
  const [assignedTo, setAssignedTo] = useState(CURRENT_EMPLOYEE_ID)
  const [dueDate, setDueDate] = useState(defaultDueDate)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addFinding.mutate(
      {
        id: walkId,
        payload: {
          description,
          severity,
          requiresAction,
          // requiresAction + felelős + határidő → a szerver egységes CAPA-t generál
          capaAssignedTo: requiresAction ? assignedTo : null,
          capaDueDate: requiresAction ? new Date(dueDate).toISOString() : null,
        },
      },
      { onSuccess: () => { setDescription(''); setRequiresAction(false) } },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Új megállapítás</div>
      <TextAreaField label="Leírás" required value={description}
        onChange={(e) => setDescription(e.target.value)} />
      <SelectField label="Súlyosság" value={severity}
        onChange={(e) => setSeverity(e.target.value as FindingSeverity)}>
        {Object.entries(FINDING_SEVERITY_LABELS).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </SelectField>
      <label className="flex items-center gap-2 text-[12px] text-ink">
        <input type="checkbox" checked={requiresAction}
          onChange={(e) => setRequiresAction(e.target.checked)} />
        Intézkedést igényel (CAPA)
      </label>
      {requiresAction && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField label="CAPA felelős" required value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}>
            <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
          </SelectField>
          <DateField label="CAPA határidő" required value={dueDate} onChange={setDueDate} />
        </div>
      )}
      <Button type="submit" size="sm"
        disabledReason={
          addFinding.isPending ? 'Folyamatban…' : description.trim() === '' ? 'Add meg a leírást.' : undefined
        }>
        Megállapítás rögzítése
      </Button>
    </form>
  )
}

export function WalkDetailSlideOver({ walkId, onClose }: { walkId: string | null; onClose: () => void }) {
  const { data: walk, isPending, isError } = useSafetyWalk(walkId)
  const locations = useEhsLocations()
  const transition = useWalkTransition()
  if (walkId === null) return null

  const locNames = locationNameMap(locations.data)

  return (
    <SlideOver open onClose={onClose} title="Bejárás"
      subtitle={walk ? `${locNames.get(walk.locationId) ?? '—'} · ${formatDateTime(walk.scheduledDate)}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A bejárás betöltése nem sikerült.</p>}

        {walk && (
          <>
            <FsmStepper
              label="Bejárás állapota"
              steps={WALK_MAIN_PATH}
              currentKey={walk.status}
              sideLabel={WALK_STATUS_LABELS[walk.status]}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-0.5 text-[10.5px] text-ink-muted">Vezeti</div>
                <div className="text-[12px] text-ink">{employeeName(walk.conductedBy)}</div>
              </div>
              <div>
                <div className="mb-0.5 text-[10.5px] text-ink-muted">Résztvevők</div>
                <div className="text-[12px] text-ink">
                  {(walk.participants?.length ?? 0) > 0
                    ? walk.participants!.map(employeeName).join(', ')
                    : '—'}
                </div>
              </div>
            </div>

            {/* Átmenet-gombok — tiltott átmenet: disabledReason (aria-disabled + tooltip) */}
            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Állapot-átmenetek
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WALK_ACTION_LABELS) as SafetyWalkAction[]).map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="secondary"
                    disabledReason={
                      transition.isPending
                        ? 'Folyamatban…'
                        : transitionBlockReason(SAFETY_WALK_FSM, action, walk.status, WALK_STATUS_LABELS)
                    }
                    onClick={() => transition.mutate({ id: walk.safetyWalkId, action })}
                  >
                    {WALK_ACTION_LABELS[action]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Megállapítások */}
            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Megállapítások ({walk.findings.length})
              </div>
              {walk.findings.length === 0 ? (
                <p className="text-[12px] text-ink-muted">Még nincs rögzített megállapítás.</p>
              ) : (
                <ul className="space-y-2">
                  {walk.findings.map((f) => (
                    <li key={f.findingId} className="rounded-lg border border-line bg-surface-1 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[12px] text-ink">{f.description}</span>
                        <StatusPill size="sm" tone={FINDING_SEVERITY_LABELS[f.severity].tone}
                          label={FINDING_SEVERITY_LABELS[f.severity].label} />
                      </div>
                      <div className="mt-1 text-[11px] text-ink-muted">
                        {formatDateTime(f.recordedAt)}
                        {f.requiresAction && (
                          <span className="ml-2">
                            {f.correctiveActionId ? '· CAPA létrehozva' : '· intézkedést igényel'}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Megállapítás csak Folyamatban állapotban rögzíthető (szerver-guard: 409) */}
            {walk.status === WALK_FINDING_ALLOWED_STATUS && <FindingForm walkId={walk.safetyWalkId} />}
          </>
        )}
      </div>
    </SlideOver>
  )
}
