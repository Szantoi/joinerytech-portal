import { useState } from 'react'
import { Card, Icon, StatusPill } from '../../../components/ui'
import {
  useIncidents, useExpiringSds, useExpiringPpe, useCapas, useSafetyWalks,
} from '../services'
import { RISKS } from '../../../mocks/ehs'
import { INCIDENT_STATUS_LABELS, SEVERITY_LABELS, formatDate } from './labels'
import { RiskLevelBadge } from './RisksScreen'
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

  const highRisks = RISKS.filter((r) => r.level === 'critical' || r.level === 'high')
  const recent = incidents.data?.items.slice(0, 4) ?? []

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
        <KpiCard label="Magas kockázat" value={highRisks.length} sub="kockázati terület"
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
            {highRisks.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-ink">{r.title}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">{r.area} · Val. {r.probability} × Hatás {r.impact}</div>
                </div>
                <RiskLevelBadge level={r.level} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <IncidentDetailSlideOver incidentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
