import { useState, type FormEvent } from 'react'
import {
  Button, DateField, FsmStepper, SelectField, SlideOver, StatusPill, TextAreaField,
} from '../../../components/ui'
import { addDays, todayIso } from '../../../services/dateUtils'
import {
  CURRENT_EMPLOYEE_ID,
  EHS_EMPLOYEE_DIRECTORY,
  RISK_ASSESSMENT_FSM,
  employeeName,
  locationNameMap,
  transitionBlockReason,
  useAddRiskControl,
  useEhsLocations,
  useRiskAssessment,
  useRiskTransition,
  useUpdateRiskAssessment,
  type AddRiskControlPayload,
  type RiskAction,
  type UpdateRiskAssessmentPayload,
} from '../services'
import { EmployeeOptions } from './EmployeeOptions'
import { RiskAssessmentForm } from './RiskAssessmentForm'
import {
  RISK_ACTION_LABELS,
  RISK_LEVEL_META,
  RISK_LIKELIHOOD_LABELS,
  RISK_SEVERITY_LABELS,
  RISK_STATUS_LABELS,
  formatDate,
  formatDateTime,
} from './labels'

const RISK_MAIN_PATH = (['piszkozat', 'ellenorzes', 'jovahagyva', 'archivalt'] as const)
  .map((key) => ({ key, label: RISK_STATUS_LABELS[key] }))

function dayToDateTime(day: string): string {
  return new Date(`${day}T12:00:00`).toISOString()
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10.5px] text-ink-muted">{label}</div>
      <div className="text-[12px] text-ink">{children}</div>
    </div>
  )
}

function ControlForm({ riskId, archived }: { riskId: string; archived: boolean }) {
  const mutation = useAddRiskControl()
  const [controlMeasure, setControlMeasure] = useState('')
  const [responsiblePerson, setResponsiblePerson] = useState('')
  const [createCapa, setCreateCapa] = useState(false)
  const [capaDescription, setCapaDescription] = useState('')
  const [capaAssignedTo, setCapaAssignedTo] = useState(CURRENT_EMPLOYEE_ID)
  const [capaDueDate, setCapaDueDate] = useState(() => addDays(todayIso(), 14))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const payload: AddRiskControlPayload = {
      controlMeasure: controlMeasure.trim(),
      responsiblePerson: responsiblePerson.trim(),
      ...(createCapa
        ? {
            capaDescription: capaDescription.trim() || null,
            capaAssignedTo,
            capaDueDate: dayToDateTime(capaDueDate),
          }
        : {}),
    }

    mutation.mutate({ id: riskId, payload }, {
      onSuccess: () => {
        setControlMeasure('')
        setResponsiblePerson('')
        setCreateCapa(false)
        setCapaDescription('')
      },
    })
  }

  const disabledReason = archived
    ? 'Archivált kockázatértékeléshez nem rögzíthető új intézkedés.'
    : mutation.isPending
      ? 'Mentés folyamatban…'
      : controlMeasure.trim() === ''
        ? 'Add meg az intézkedést.'
        : responsiblePerson.trim() === ''
          ? 'Add meg a felelőst.'
          : createCapa && (!capaAssignedTo || !capaDueDate)
            ? 'A CAPA felelőse és határideje együtt kötelező.'
            : undefined

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Új intézkedés</div>
      <TextAreaField
        label="Intézkedés"
        required
        maxLength={1000}
        value={controlMeasure}
        onChange={(event) => setControlMeasure(event.target.value)}
      />
      <label className="block text-[11.5px] font-medium text-ink">
        Felelős
        <input
          className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-1 px-3 text-[12px] text-ink outline-none focus:border-world-ring focus:ring-2 focus:ring-world-ring/20"
          maxLength={200}
          required
          value={responsiblePerson}
          onChange={(event) => setResponsiblePerson(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-[12px] text-ink">
        <input
          type="checkbox"
          checked={createCapa}
          onChange={(event) => setCreateCapa(event.target.checked)}
        />
        Követő CAPA létrehozása
      </label>
      {createCapa && (
        <div className="space-y-3 rounded-lg border border-line bg-surface-1 p-3">
          <TextAreaField
            label="CAPA leírása (üresen az intézkedés szövege)"
            maxLength={1000}
            value={capaDescription}
            onChange={(event) => setCapaDescription(event.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="CAPA felelős"
              required
              value={capaAssignedTo}
              onChange={(event) => setCapaAssignedTo(event.target.value)}
            >
              <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
            </SelectField>
            <DateField
              label="CAPA határidő"
              required
              min={addDays(todayIso(), 1)}
              value={capaDueDate}
              onChange={setCapaDueDate}
            />
          </div>
        </div>
      )}
      <Button type="submit" size="sm" disabledReason={disabledReason}>
        Intézkedés rögzítése
      </Button>
    </form>
  )
}

export interface RiskDetailSlideOverProps {
  riskId: string | null
  onClose: () => void
}

export function RiskDetailSlideOver({ riskId, onClose }: RiskDetailSlideOverProps) {
  const riskQuery = useRiskAssessment(riskId)
  const locations = useEhsLocations()
  const transition = useRiskTransition()
  const update = useUpdateRiskAssessment()
  const [editing, setEditing] = useState(false)

  if (riskId === null) return null

  const risk = riskQuery.data
  const locationNames = locationNameMap(locations.data)
  const locationOptions = (locations.data ?? []).map(({ locationId, name }) => ({ locationId, name }))

  const submitUpdate = (payload: UpdateRiskAssessmentPayload) => {
    update.mutate({ id: riskId, payload }, { onSuccess: () => setEditing(false) })
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      title={risk?.hazardDescription ?? 'Kockázatértékelés'}
      subtitle={risk?.locationId ? (locationNames.get(risk.locationId) ?? '—') : '—'}
      width={620}
    >
      <div className="space-y-5 px-5 py-5">
        {riskQuery.isPending && (
          <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-surface-2" />
        )}
        {riskQuery.isError && (
          <div role="alert" className="space-y-2 text-[12.5px] text-ink-muted">
            <p>A kockázatértékelés nem tölthető be.</p>
            <Button size="sm" variant="secondary" onClick={() => void riskQuery.refetch()}>Újra</Button>
          </div>
        )}

        {risk && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                fsm="ehsKockazat"
                status={risk.status}
                label={RISK_STATUS_LABELS[risk.status]}
              />
              <StatusPill
                tone={RISK_LEVEL_META[risk.riskLevel].tone}
                label={`${RISK_LEVEL_META[risk.riskLevel].label} · ${risk.riskScore}/25`}
              />
            </div>

            <FsmStepper
              label="Kockázatértékelés állapota"
              steps={RISK_MAIN_PATH}
              currentKey={risk.status}
              sideLabel={RISK_STATUS_LABELS[risk.status]}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Meta label="Súlyosság">{RISK_SEVERITY_LABELS[risk.severity]}</Meta>
              <Meta label="Valószínűség">{RISK_LIKELIHOOD_LABELS[risk.likelihood]}</Meta>
              <Meta label="Értékelte">{employeeName(risk.assessedBy)}</Meta>
              <Meta label="Értékelés ideje">{formatDateTime(risk.assessedAt)}</Meta>
              <Meta label="Felülvizsgálat">{formatDate(risk.reviewDueDate)}</Meta>
              <Meta label="Helyszín">
                {risk.locationId ? (locationNames.get(risk.locationId) ?? '—') : '—'}
              </Meta>
            </div>

            {risk.status === 'piszkozat' && (
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing((value) => !value)}
                >
                  {editing ? 'Szerkesztés bezárása' : 'Piszkozat szerkesztése'}
                </Button>
                {editing && (
                  <div className="mt-3 rounded-xl border border-line bg-surface-2/60 p-3">
                    <RiskAssessmentForm
                      mode="update"
                      locations={locationOptions}
                      initialValues={{
                        hazardDescription: risk.hazardDescription,
                        severity: risk.severity,
                        likelihood: risk.likelihood,
                        reviewDueDate: risk.reviewDueDate,
                        locationId: risk.locationId,
                      }}
                      isSubmitting={update.isPending}
                      onSubmit={submitUpdate}
                      onCancel={() => setEditing(false)}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Állapot-átmenetek
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RISK_ACTION_LABELS) as RiskAction[]).map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="secondary"
                    disabledReason={
                      transition.isPending
                        ? 'Átmenet folyamatban…'
                        : transitionBlockReason(
                            RISK_ASSESSMENT_FSM,
                            action,
                            risk.status,
                            RISK_STATUS_LABELS,
                          )
                    }
                    onClick={() => transition.mutate({ id: risk.riskAssessmentId, action })}
                  >
                    {RISK_ACTION_LABELS[action]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Intézkedések ({risk.controlMeasures.length})
              </div>
              {risk.controlMeasures.length === 0 ? (
                <p className="text-[12px] text-ink-muted">Még nincs rögzített intézkedés.</p>
              ) : (
                <ul className="space-y-2">
                  {risk.controlMeasures.map((control) => (
                    <li key={control.riskControlId} className="rounded-lg border border-line bg-surface-1 px-3 py-2">
                      <div className="text-[12px] text-ink">{control.controlMeasure}</div>
                      <div className="mt-1 text-[11px] text-ink-muted">
                        {control.responsiblePerson} · {formatDateTime(control.implementedAt)}
                        {control.correctiveActionId ? ' · CAPA létrehozva' : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ControlForm riskId={risk.riskAssessmentId} archived={risk.status === 'archivalt'} />
          </>
        )}
      </div>
    </SlideOver>
  )
}
