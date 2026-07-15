import { Card } from '../../components/ui'
import {
  TREND_WINDOW_WEEKS, calcQaMetrics, todayIso, useInspections, useTickets,
  weeklyInspectionTrend,
} from '../../services/qa'
import type { FailureType } from '../../services/qa/inspections'
import { QueryGate } from '../ehs/QueryGate'
import {
  FAILURE_TYPE_LABELS, PASS_RATE_TARGET_LABEL,
  formatHours, formatPct, formatWeekLabel,
} from './labels'

/**
 * Trend / összesítő — heti megfelelési trend (calc.weeklyInspectionTrend, az
 * ablak a configból) oszlop-vizualizációval ÉS sr-only táblázat-alternatívával
 * (Kontrolling M3-lecke); a vizuális rács saját görgethető régió
 * (role="region" + aria-label + tabIndex — S1-lecke). Hibatípus-eloszlás a
 * selejt-átvizsgálások hibajegyzeteiből (szín + szöveg) + metrika-összesítő
 * (QAMetricsDto-tükör: pass rate, átlagos megoldási idő).
 */
export function TrendScreen() {
  const inspections = useInspections()
  const tickets = useTickets()

  const inspectionRows = inspections.data ?? []
  const ticketRows = tickets.data ?? []

  const trend = weeklyInspectionTrend(inspectionRows, todayIso(), TREND_WINDOW_WEEKS)
  const maxWeekTotal = Math.max(1, ...trend.map((w) => w.total))
  const metrics = calcQaMetrics(inspectionRows, ticketRows)

  // hibatípus-eloszlás a selejt-átvizsgálások hibajegyzeteiből
  const failureCounts = new Map<FailureType, number>()
  for (const inspection of inspectionRows) {
    for (const note of inspection.failureNotes) {
      failureCounts.set(note.failureType, (failureCounts.get(note.failureType) ?? 0) + 1)
    }
  }
  const failureDistribution = [...failureCounts.entries()].sort((a, b) => b[1] - a[1])
  const maxFailure = Math.max(1, ...failureDistribution.map(([, count]) => count))

  const summary = [
    {
      label: 'Megfelelt / lezárt',
      value: `${metrics.passedInspections} / ${metrics.passedInspections + metrics.failedInspections}`,
      sub: `${metrics.totalInspections} átvizsgálásból`,
    },
    {
      label: 'Pass rate (backend-metrika)',
      value: formatPct(Math.round(metrics.passRate * 100)),
      sub: PASS_RATE_TARGET_LABEL,
    },
    {
      label: 'Átlagos megoldási idő',
      value: formatHours(metrics.averageResolutionHours),
      sub: 'megoldott hibajegyekre',
    },
    {
      label: 'Nyitott / összes hibajegy',
      value: `${metrics.openTickets} / ${metrics.totalTickets}`,
      sub: 'a teljes állományban',
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Trend</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Heti megfelelési trend (utolsó {TREND_WINDOW_WEEKS} hét) és hibatípus-eloszlás
        </p>
      </div>

      <QueryGate
        isPending={inspections.isPending || tickets.isPending}
        isError={inspections.isError || tickets.isError}
        resource="minőség-trend"
        onRetry={() => { void inspections.refetch(); void tickets.refetch() }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-ink">{s.value}</div>
              <div className="mt-1 text-[10.5px] text-ink-muted">{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* Heti trend — vizuális rács saját görgethető régióban (S1-minta) */}
        <Card className="p-5">
          <h2 className="mb-4 text-[13px] font-semibold text-ink">Heti megfelelési trend</h2>

          <div
            role="region"
            aria-label="Heti megfelelési trend rács"
            tabIndex={0}
            className="overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <div aria-hidden="true" className="flex min-w-[560px] items-end gap-3 pb-1">
              {trend.map((week) => (
                <div key={week.weekStart} className="flex flex-1 flex-col items-center gap-1">
                  <div className="text-[11px] font-semibold tabular-nums text-ink">
                    {formatPct(week.passRatePct)}
                  </div>
                  <div className="flex h-28 w-full items-end justify-center gap-1">
                    {/* megfelelt (kitöltött) + selejt (mintázott) oszlop — forma+szín */}
                    <span
                      className="w-4 rounded-t bg-world"
                      style={{ height: `${(week.passed / maxWeekTotal) * 100}%` }}
                    />
                    <span
                      className="w-4 rounded-t border-2 border-rose-500 bg-rose-500/30"
                      style={{ height: `${(week.failed / maxWeekTotal) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-muted">{formatWeekLabel(week.weekStart)}</div>
                  <div className="text-[10px] tabular-nums text-ink-muted">
                    {week.passed} ok · {week.failed} selejt
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* jelmagyarázat: szín + szöveg (nem csak szín) */}
          <div aria-hidden="true" className="mt-3 flex items-center gap-4 text-[10.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-world" /> megfelelt (kitöltött)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-rose-500 bg-rose-500/30" /> selejt (keretes)
            </span>
          </div>

          {/* sr-only adat-alternatíva a vizuális rácshoz (M3-lecke) */}
          <table className="sr-only">
            <caption>Heti megfelelési trend adatai (utolsó {TREND_WINDOW_WEEKS} hét)</caption>
            <thead>
              <tr>
                <th scope="col">Hét</th>
                <th scope="col">Lezárt átvizsgálás</th>
                <th scope="col">Megfelelt</th>
                <th scope="col">Selejt</th>
                <th scope="col">Megfelelési arány</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((week) => (
                <tr key={week.weekStart}>
                  <th scope="row">{formatWeekLabel(week.weekStart)}</th>
                  <td>{week.total}</td>
                  <td>{week.passed}</td>
                  <td>{week.failed}</td>
                  <td>{formatPct(week.passRatePct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Hibatípus-eloszlás a hibajegyzetekből */}
        <Card className="p-5">
          <h2 className="mb-4 text-[13px] font-semibold text-ink">Hibatípus-eloszlás</h2>
          {failureDistribution.length === 0 ? (
            <p className="text-[12px] text-ink-muted">Nincs rögzített hibajegyzet.</p>
          ) : (
            <>
              <p className="sr-only">
                Hibajegyzetek típus szerint:{' '}
                {failureDistribution
                  .map(([type, count]) => `${FAILURE_TYPE_LABELS[type]}: ${count} db`)
                  .join(', ')}.
              </p>
              <ul aria-hidden="true" className="space-y-2.5">
                {failureDistribution.map(([type, count]) => (
                  <li key={type} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[11.5px] font-medium text-ink">
                      {FAILURE_TYPE_LABELS[type]}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-full bg-rose-500"
                        style={{ width: `${(count / maxFailure) * 100}%` }}
                      />
                    </span>
                    <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-ink">
                      {count} db
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </QueryGate>
    </div>
  )
}
