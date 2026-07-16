import { useState } from 'react'
import { QueryGate, StatusPill } from '../../../components/ui'
import { useIncidents } from '../services'
import { INCIDENT_STATUS_LABELS, INCIDENT_TYPE_LABELS, SEVERITY_LABELS, formatDate } from './labels'
import { IncidentDetailSlideOver } from './IncidentDetailSlideOver'

/**
 * Események képernyő — API-vezérelt lista (useIncidents) + detail SlideOver.
 * A gyors-bejelentő FAB a world-szinten (EhsPage) mountolt; sikeres beküldés
 * invalidálja ezt a listát, így az új esemény azonnal megjelenik.
 */
export function IncidentsScreen() {
  const query = useIncidents()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Események</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Balesetek, kvázibalesetek, veszélyes állapotok — FSM: bejelentve → kivizsgálás → intézkedés → lezárva
        </p>
      </div>

      <QueryGate isPending={query.isPending} isError={query.isError} onRetry={() => void query.refetch()} resource="események">
        <ul className="space-y-2">
          {query.data?.items.map((inc) => (
            <li key={inc.incidentId}>
              <button
                onClick={() => setSelectedId(inc.incidentId)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 text-left transition hover:border-rose-200 dark:hover:border-rose-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusPill size="sm" tone="neutral" label={INCIDENT_TYPE_LABELS[inc.incidentType]} />
                    <StatusPill size="sm" tone={SEVERITY_LABELS[inc.severity].tone} label={SEVERITY_LABELS[inc.severity].label} />
                  </span>
                  <span className="block truncate text-[13px] font-semibold text-ink">{inc.description}</span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                    {inc.location} · {formatDate(inc.incidentDate)}
                  </span>
                </span>
                <StatusPill fsm="ehsBaleset" status={inc.status} label={INCIDENT_STATUS_LABELS[inc.status]} />
              </button>
            </li>
          ))}
        </ul>
      </QueryGate>

      <IncidentDetailSlideOver incidentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
