import { useState } from 'react'
import { Card, QueryGate, StatusPill } from '../../../components/ui'
import {
  PASS_RATE_WARN_THRESHOLD, calcQaMetrics, isInspectionDone, isInspectionOpen,
  isTicketOpen, pct, useInspections, useTickets,
} from '../services'
import {
  CRITICAL_LEVEL_META, INSPECTION_STATUS_LABELS, PASS_RATE_TARGET_LABEL,
  TICKET_PRIORITY_META, TICKET_PRIORITY_ORDER, TICKET_STATUS_META,
  formatDate, formatPct,
} from './labels'
import { InspectionDetailSlideOver } from './InspectionDetailSlideOver'
import { TicketDetailSlideOver } from './TicketDetailSlideOver'

/**
 * QA áttekintés — KPI-k a query hookokból (nyitott hibajegy, átvizsgálási
 * arány, megfelelési arány a config-küszöbbel, gyártás-blokkoló) + súlyosság-
 * eloszlás (szín+szöveg, sr-only összefoglalóval), nyitott hibajegyek
 * prioritás-sorrendben és nyitott átvizsgálások. Minden érték az API-ból
 * származó sorokból a calc-tükörrel számított (a `blocking` a válaszból jön —
 * sosem kliens-számítás), nincs statikus adat.
 */
export function QaDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const inspections = useInspections()
  const tickets = useTickets()
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const inspectionRows = inspections.data ?? []
  const ticketRows = tickets.data ?? []

  const metrics = calcQaMetrics(inspectionRows, ticketRows)
  const doneCount = inspectionRows.filter((i) => isInspectionDone(i.status)).length
  const inspectionRate = pct(doneCount, metrics.totalInspections)
  const passRateOfDone = pct(metrics.passedInspections, doneCount)

  const openTickets = ticketRows
    .filter((t) => isTicketOpen(t.status))
    .sort((a, b) =>
      TICKET_PRIORITY_ORDER.indexOf(a.priority) - TICKET_PRIORITY_ORDER.indexOf(b.priority))
  const criticalCount = openTickets.filter((t) => t.priority === 'kritikus').length

  const openInspections = inspectionRows.filter((i) => isInspectionOpen(i.status))
  const blockingInspections = inspectionRows.filter((i) => i.blocking)

  /** Súlyosság-eloszlás a NYITOTT hibajegyekre (szín + szöveg, nem csak szín). */
  const severityDistribution = TICKET_PRIORITY_ORDER.map((priority) => ({
    priority,
    count: openTickets.filter((t) => t.priority === priority).length,
  }))
  const maxSeverity = Math.max(1, ...severityDistribution.map((s) => s.count))

  const kpis = [
    {
      label: 'Nyitott hibajegy',
      value: String(openTickets.length),
      sub: criticalCount > 0 ? `${criticalCount} kritikus` : 'nincs kritikus',
      alert: criticalCount > 0,
    },
    {
      label: 'Átvizsgálási arány',
      value: formatPct(inspectionRate),
      sub: `${doneCount} lezárt / ${metrics.totalInspections} összes`,
    },
    {
      label: 'Megfelelési arány',
      value: formatPct(passRateOfDone),
      sub: PASS_RATE_TARGET_LABEL,
      alert: passRateOfDone !== null && passRateOfDone < PASS_RATE_WARN_THRESHOLD,
    },
    {
      label: 'Gyártás-blokkoló',
      value: String(blockingInspections.length),
      sub: 'kritikus ponton selejt',
      alert: blockingInspections.length > 0,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Átvizsgálások, hibajegyek és megfelelési mutatók
        </p>
      </div>

      <QueryGate
        isPending={inspections.isPending || tickets.isPending}
        isError={inspections.isError || tickets.isError}
        resource="minőség áttekintés"
        onRetry={() => { void inspections.refetch(); void tickets.refetch() }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{k.label}</div>
              <div className={`mt-1 text-[26px] font-semibold tabular-nums tracking-tight ${k.alert ? 'text-rose-600 dark:text-rose-400' : 'text-ink'}`}>
                {k.value}
              </div>
              <div className="mt-1 text-[10.5px] text-ink-muted">{k.sub}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Súlyosság-eloszlás (nyitott hibajegyek) */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Súlyosság-eloszlás</h2>
              <button
                onClick={() => onScreen('tickets')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Hibajegyek →
              </button>
            </div>
            <p className="sr-only">
              Nyitott hibajegyek súlyosság szerint:{' '}
              {severityDistribution
                .map((s) => `${TICKET_PRIORITY_META[s.priority].label}: ${s.count} db`)
                .join(', ')}.
            </p>
            <ul aria-hidden="true" className="space-y-2.5">
              {severityDistribution.map((s) => (
                <li key={s.priority} className="flex items-center gap-3">
                  <span className="w-24 shrink-0">
                    <StatusPill size="sm" tone={TICKET_PRIORITY_META[s.priority].tone} label={TICKET_PRIORITY_META[s.priority].label} />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-world"
                      style={{ width: `${(s.count / maxSeverity) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-ink">
                    {s.count} db
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Nyitott átvizsgálások */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">
                Nyitott átvizsgálások{openInspections.length ? ` (${openInspections.length})` : ''}
              </h2>
              <button
                onClick={() => onScreen('inspections')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Átvizsgálások →
              </button>
            </div>
            {openInspections.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs nyitott átvizsgálás.</p>
            ) : (
              <ul className="space-y-2.5">
                {openInspections.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedInspectionId(i.id)}
                      className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                    >
                      <div className="truncate text-[12px] font-medium text-ink underline-offset-2 hover:underline">
                        {i.checkpointName}
                      </div>
                      <div className="truncate text-[10.5px] text-ink-muted">
                        {i.id} · {i.productName ?? i.orderRef ?? '—'} · {formatDate(i.plannedAt)}
                      </div>
                    </button>
                    <span className="hidden sm:inline-flex">
                      <StatusPill size="sm" tone={CRITICAL_LEVEL_META[i.criticalLevel].tone} label={CRITICAL_LEVEL_META[i.criticalLevel].label} />
                    </span>
                    <StatusPill size="sm" fsm="qaEllenorzes" status={i.status} label={INSPECTION_STATUS_LABELS[i.status]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Nyitott hibajegyek prioritás-sorrendben */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-ink">
              Nyitott hibajegyek{openTickets.length ? ` (${openTickets.length})` : ''}
            </h2>
            <button
              onClick={() => onScreen('tickets')}
              className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              Hibajegyek →
            </button>
          </div>
          {openTickets.length === 0 ? (
            <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs nyitott hibajegy.</p>
          ) : (
            <ul>
              {openTickets.map((t) => (
                <li key={t.id} className="border-b border-line last:border-0">
                  <button
                    onClick={() => setSelectedTicketId(t.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-ink">{t.title}</div>
                      <div className="font-mono text-[10.5px] text-ink-muted">
                        {t.id} · {t.productName ?? '—'} · {formatDate(t.reportedAt)}
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex">
                      <StatusPill size="sm" tone={TICKET_PRIORITY_META[t.priority].tone} label={TICKET_PRIORITY_META[t.priority].label} />
                    </span>
                    <StatusPill size="sm" tone={TICKET_STATUS_META[t.status].tone} label={TICKET_STATUS_META[t.status].label} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </QueryGate>

      <InspectionDetailSlideOver
        inspectionId={selectedInspectionId}
        onClose={() => setSelectedInspectionId(null)}
      />
      <TicketDetailSlideOver ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
    </div>
  )
}
