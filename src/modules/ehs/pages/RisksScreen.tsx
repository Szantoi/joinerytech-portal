import { useMemo, useState } from 'react'
import { Button, QueryGate, SelectField, SlideOver, StatusPill } from '../../../components/ui'
import {
  RISK_LEVELS,
  RISK_STATUSES,
  locationNameMap,
  useCreateRiskAssessment,
  useEhsLocations,
  useRiskAssessments,
  useRiskMatrix,
  type CreateRiskAssessmentPayload,
  type RiskFilters,
  type RiskLevel,
  type RiskStatus,
} from '../services'
import { RiskAssessmentForm } from './RiskAssessmentForm'
import { RiskDetailSlideOver } from './RiskDetailSlideOver'
import { RiskMatrix } from './RiskMatrix'
import {
  RISK_LEVEL_META,
  RISK_LIKELIHOOD_LABELS,
  RISK_SEVERITY_LABELS,
  RISK_STATUS_LABELS,
  formatDate,
} from './labels'

type FilterValue<T extends string> = T | ''

export function RisksScreen() {
  const [riskLevel, setRiskLevel] = useState<FilterValue<RiskLevel>>('')
  const [status, setStatus] = useState<FilterValue<RiskStatus>>('')
  const [locationId, setLocationId] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filters = useMemo<RiskFilters>(() => ({
    ...(riskLevel ? { riskLevel } : {}),
    ...(status ? { status } : {}),
    ...(locationId ? { locationId } : {}),
  }), [locationId, riskLevel, status])

  const matrix = useRiskMatrix()
  const risks = useRiskAssessments(filters)
  const locations = useEhsLocations()
  const create = useCreateRiskAssessment()
  const locationNames = locationNameMap(locations.data)
  const hasQueryError = matrix.isError || risks.isError || locations.isError
  const hasPendingQuery = !hasQueryError &&
    (matrix.isPending || risks.isPending || locations.isPending)
  const locationOptions = (locations.data ?? []).map(({ locationId: id, name }) => ({
    locationId: id,
    name,
  }))

  const retry = () => {
    void matrix.refetch()
    void risks.refetch()
    void locations.refetch()
  }

  const submitCreate = (payload: CreateRiskAssessmentPayload) => {
    create.mutate(payload, {
      onSuccess: (result) => {
        setCreateOpen(false)
        setSelectedId(result.riskAssessmentId)
      },
    })
  }

  return (
    <div className="mx-auto max-w-[1280px] overflow-x-hidden px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Kockázatok</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            5×5 kockázati mátrix · valószínűség × súlyosság · jóváhagyási folyamattal
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Új kockázatértékelés</Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-1 p-3 sm:grid-cols-3">
        <SelectField
          label="Kockázati szint"
          value={riskLevel}
          onChange={(event) => setRiskLevel(event.target.value as FilterValue<RiskLevel>)}
        >
          <option value="">Minden szint</option>
          {RISK_LEVELS.map((level) => (
            <option key={level} value={level}>{RISK_LEVEL_META[level].label}</option>
          ))}
        </SelectField>
        <SelectField
          label="Állapot"
          value={status}
          onChange={(event) => setStatus(event.target.value as FilterValue<RiskStatus>)}
        >
          <option value="">Minden állapot</option>
          {RISK_STATUSES.map((value) => (
            <option key={value} value={value}>{RISK_STATUS_LABELS[value]}</option>
          ))}
        </SelectField>
        <SelectField
          label="Helyszín"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
        >
          <option value="">Minden helyszín</option>
          {locationOptions.map((location) => (
            <option key={location.locationId} value={location.locationId}>{location.name}</option>
          ))}
        </SelectField>
      </div>

      <QueryGate
        isPending={hasPendingQuery}
        isError={hasQueryError}
        onRetry={retry}
        resource="kockázati mátrix"
      >
        {matrix.data && risks.data && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-ink-muted">
              <span>{matrix.data.totalAssessments} aktív értékelés a mátrixban</span>
              <span>{risks.data.length} listaelem az aktuális szűrésben</span>
            </div>
            <RiskMatrix
              cells={matrix.data.matrixCells}
              assessments={risks.data}
              onSelect={setSelectedId}
            />

            <section className="mt-5" aria-labelledby="risk-list-heading">
              <h2 id="risk-list-heading" className="mb-2 text-[13px] font-semibold text-ink">
                Értékelések
              </h2>
              {risks.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-surface-1 px-4 py-8 text-center text-[12px] text-ink-muted">
                  Az aktuális szűrésben nincs kockázatértékelés.
                </div>
              ) : (
                <ul className="space-y-2">
                  {risks.data.map((risk) => (
                    <li key={risk.riskAssessmentId}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(risk.riskAssessmentId)}
                        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 text-left transition hover:border-rose-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring dark:hover:border-rose-900"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ink">
                            {risk.hazardDescription}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                            {risk.locationId ? (locationNames.get(risk.locationId) ?? '—') : '—'}
                            {' · '}{RISK_LIKELIHOOD_LABELS[risk.likelihood]} × {RISK_SEVERITY_LABELS[risk.severity]}
                            {' · '}Felülvizsgálat: {formatDate(risk.reviewDueDate)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-wrap justify-end gap-2">
                          <StatusPill
                            size="sm"
                            tone={RISK_LEVEL_META[risk.riskLevel].tone}
                            label={`${RISK_LEVEL_META[risk.riskLevel].label} · ${risk.riskScore}`}
                          />
                          <StatusPill
                            size="sm"
                            fsm="ehsKockazat"
                            status={risk.status}
                            label={RISK_STATUS_LABELS[risk.status]}
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </QueryGate>

      <SlideOver
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Új kockázatértékelés"
        subtitle="Piszkozat létrehozása"
        width={560}
      >
        <div className="px-5 py-5">
          <RiskAssessmentForm
            mode="create"
            locations={locationOptions}
            isSubmitting={create.isPending}
            onSubmit={submitCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </SlideOver>

      <RiskDetailSlideOver riskId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
