import { useState } from 'react'
import { QueryGate, StatusPill } from '../../../components/ui'
import { isExecutionOpen, useExecutions } from '../services'
import { EXECUTION_STATUS_META, formatDate } from './labels'
import { ExecutionDetailSlideOver } from './ExecutionDetailSlideOver'

const FILTERS = ['open', 'all', 'Scheduled', 'Started', 'InProgress', 'Completed', 'Cancelled', 'Failed'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_LABELS: Record<Filter, string> = {
  open: 'Nyitott (aktív)', all: 'Mind',
  Scheduled: EXECUTION_STATUS_META.Scheduled.label,
  Started: EXECUTION_STATUS_META.Started.label,
  InProgress: EXECUTION_STATUS_META.InProgress.label,
  Completed: EXECUTION_STATUS_META.Completed.label,
  Cancelled: EXECUTION_STATUS_META.Cancelled.label,
  Failed: EXECUTION_STATUS_META.Failed.label,
}

/**
 * Vágás-végrehajtás — lista státusz-szűrő chipekkel (kliens-oldali, mert a
 * doksi 1.1 `GET /executions/` NEM fogad query-filtert), sor-kattintásra
 * részlet-SlideOver a HMAC-mezős FSM-akciókkal.
 */
export function CuttingExecutionScreen() {
  const executions = useExecutions()
  const [filter, setFilter] = useState<Filter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = executions.data ?? []
  const filtered = rows.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'open') return isExecutionOpen(e.status)
    return e.status === filter
  })

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Végrehajtás</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Scheduled → Started → InProgress → Completed (Cancelled/Failed mellékállapotok)
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                filter === f ? 'bg-world font-semibold text-world-fg' : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">{filtered.length} végrehajtás</div>
      </div>

      <QueryGate isPending={executions.isPending} isError={executions.isError} onRetry={() => void executions.refetch()} resource="végrehajtások">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-ink-muted">
            Nincs a szűrésnek megfelelő végrehajtás.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface-1">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedId(e.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12.5px] font-medium text-ink">{e.id}</div>
                    <div className="text-[10.5px] text-ink-muted">Ütemezve: {formatDate(e.scheduledAt)}</div>
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-ink">{e.panelsCompleted}/{e.totalPanels} panel</span>
                  <StatusPill size="sm" tone={EXECUTION_STATUS_META[e.status].tone} label={EXECUTION_STATUS_META[e.status].label} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryGate>

      <ExecutionDetailSlideOver executionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
