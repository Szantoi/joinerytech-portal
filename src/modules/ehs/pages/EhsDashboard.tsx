import { useState } from 'react'
import { Card, Icon, StatusPill } from '../../../components/ui'
import {
  locationNameMap, useCapas, useEhsLocations, useExpiringPpe, useExpiringSds,
  useIncidents, useRiskAssessments, useRiskMatrix, useSafetyWalks,
} from '../services'
import { INCIDENT_STATUS_LABELS, RISK_LEVEL_META, SEVERITY_LABELS, formatDate } from './labels'
import { IncidentDetailSlideOver } from './IncidentDetailSlideOver'

/**
 * EHS Áttekintés — KPI-k a query hookokból (task 5): lejáró SDS, nyitott CAPA,
 * lejáró EVE, esedékes bejárások + esemény-számláló; legutóbbi események az API-ból.
 */

// Statikus tone→osztály térkép (Tailwind nem látja az interpolált osztályneveket)
const KPI_TONES = {
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300',
} as const

interface KpiProps {
  label: string
  value: number | string | undefined
  sub: string
  tone: keyof typeof KPI_TONES
  icon: string
  onClick?: () => void
}

function KpiCard({ label, value, sub, tone, icon, onClick }: KpiProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl border border-line bg-surface-1 p-4 text-left ${
        onClick ? 'transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${KPI_TONES[tone]}`}>
          <Icon name={icon} size={16} />
        </div>
        <div className="text-[22px] font-semibold leading-none text-ink">
          {value ?? <span role="status"><span aria-hidden="true">…</span><span className="sr-only">betöltés</span></span>}
        </div>
      </div>
      <div className="mt-2.5 text-[12px] font-medium text-ink">{label}</div>
      <div className="mt-0.5 text-[10.5px] text-ink-muted">{sub}</div>
    </Tag>
  )
}

export function EhsDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const incidents = useIncidents()
  const expiringSds = useExpiringSds()
  const openCapas = useCapas({ completed: false })
  const expiringPpe = useExpiringPpe()
  const dueWalks = useSafetyWalks({ status: 'Scheduled' })
  const riskMatrix = useRiskMatrix()
  const risks = useRiskAssessments()
  const locations = useEhsLocations()

  const highRiskCount = riskMatrix.isError
    ? '—'
    : riskMatrix.data
      ? (riskMatrix.data.byRiskLevel.magas ?? 0) + (riskMatrix.data.byRiskLevel.kritikus ?? 0)
      : undefined
  const highRisks = risks.data?.filter((risk) =>
    risk.status !== 'archivalt' && (risk.riskLevel === 'magas' || risk.riskLevel === 'kritikus')) ?? []
  const locationNames = locationNameMap(locations.data)
  const recent = incidents.data?.items.slice(0, 4) ?? []
  const riskSummaryError = risks.isError || riskMatrix.isError || locations.isError
  const riskSummaryPending = !riskSummaryError &&
    (risks.isPending || riskMatrix.isPending || locations.isPending)
  const riskSummaryReady = !riskSummaryPending && !riskSummaryError

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">EHS</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">Munkavédelem, balesetek, kockázatok</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Esemény" value={incidents.data?.totalCount} sub="összes bejelentés"
          tone="rose" icon="alert" onClick={() => onScreen('incidents')} />
        <KpiCard label="Lejáró SDS" value={expiringSds.data?.length} sub="30 napon belül / lejárt"
          tone="amber" icon="file" onClick={() => onScreen('sds')} />
        <KpiCard label="Nyitott CAPA" value={openCapas.data?.length} sub="teljesítés szükséges"
          tone="amber" icon="clipboard" onClick={() => onScreen('actions')} />
        <KpiCard label="Lejáró EVE" value={expiringPpe.data?.length} sub="csere esedékes"
          tone="sky" icon="shield" onClick={() => onScreen('ppe')} />
        <KpiCard label="Esedékes bejárás" value={dueWalks.data?.length} sub="ütemezett bejárás"
          tone="teal" icon="calendar" onClick={() => onScreen('walks')} />
        <KpiCard label="Magas kockázat" value={highRiskCount} sub="aktív kockázatértékelés"
          tone="rose" icon="alert" onClick={() => onScreen('risks')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[12.5px] font-semibold text-ink">Legutóbbi események</span>
            <button onClick={() => onScreen('incidents')} className="text-[11px] text-rose-600 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200">
              Összes →
            </button>
          </div>
          <div className="divide-y divide-line">
            {incidents.isPending && (
              <div aria-busy="true" className="px-4 py-6 text-[12px] text-ink-muted">Betöltés…</div>
            )}
            {recent.map((inc) => (
              <button key={inc.incidentId} onClick={() => setSelectedId(inc.incidentId)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-ink">{inc.description}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {formatDate(inc.incidentDate)} · {inc.location}
                  </div>
                </div>
                <StatusPill size="sm" fsm="ehsBaleset" status={inc.status} label={INCIDENT_STATUS_LABELS[inc.status]} />
                <StatusPill size="sm" tone={SEVERITY_LABELS[inc.severity].tone} label={SEVERITY_LABELS[inc.severity].label} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[12.5px] font-semibold text-ink">Kockázati mátrix (kivonat)</span>
            <button onClick={() => onScreen('risks')} className="text-[11px] text-rose-600 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200">
              Mátrix →
            </button>
          </div>
          <div className="divide-y divide-line">
            {riskSummaryPending && (
              <div aria-busy="true" className="px-4 py-6 text-[12px] text-ink-muted">Betöltés…</div>
            )}
            {riskSummaryError && (
              <div className="flex items-center justify-between gap-3 px-4 py-5 text-[12px] text-rose-700 dark:text-rose-300">
                <span>A kockázati kivonat nem tölthető be.</span>
                <button
                  className="font-medium text-rose-600 hover:underline dark:text-rose-300"
                  onClick={() => { void risks.refetch(); void riskMatrix.refetch(); void locations.refetch() }}
                >
                  Újra
                </button>
              </div>
            )}
            {riskSummaryReady && highRisks.length === 0 && (
                <div className="px-4 py-6 text-[12px] text-ink-muted">Nincs magas vagy kritikus aktív kockázat.</div>
              )}
            {riskSummaryReady && highRisks.map((r) => (
              <div key={r.riskAssessmentId} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-ink">{r.hazardDescription}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {r.locationId ? (locationNames.get(r.locationId) ?? '—') : '—'} · Pontszám: {r.riskScore}
                  </div>
                </div>
                <StatusPill size="sm" tone={RISK_LEVEL_META[r.riskLevel].tone} label={RISK_LEVEL_META[r.riskLevel].label} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <IncidentDetailSlideOver incidentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
