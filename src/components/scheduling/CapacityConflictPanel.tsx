/**
 * CapacityConflictPanel — kapacitás-ütközés kompozíció (PLAN-05 F2).
 *
 * A rácsot a domain-mentes `CapacityHeatmap` primitív rajzolja; itt a
 * domain-leképezés, a magyar keret és a szűk keresztmetszet-lista él.
 * Provenance: doorstar-instance `pages/production/LoadPage.tsx` — a
 * kapacitás-SZERKESZTŐ input szándékosan NEM jött át (ez olvasó nézet).
 */

import { CapacityHeatmap, STATUS_TONES, capacityTone, type Tone } from '@spaceos/portal-ui'
import {
  buildCapacityBuckets,
  buildCapacityRows,
  DEFAULT_CAPACITY_LABELS,
  type CapacityLoadLabels,
  type CapacityLoadReport,
} from '../../lib/scheduling/capacityLoadModel'

interface CapacityConflictPanelProps {
  report: CapacityLoadReport
  labels?: CapacityLoadLabels
  /** A kiemelendő nap (pl. „ma"); kívülről jön, hogy a nézet determinisztikus legyen. */
  today?: Date
}

/** A jelmagyarázat ugyanazt a küszöb-szabályt mutatja, amit a rács fest. */
const LEGEND: readonly { ratio: number; label: string }[] = [
  { ratio: 0.5, label: 'rendben' },
  { ratio: 0.9, label: '75% felett' },
  { ratio: 1.2, label: 'túlterhelt' },
]

export function CapacityConflictPanel({ report, labels = DEFAULT_CAPACITY_LABELS, today }: CapacityConflictPanelProps) {
  const buckets = buildCapacityBuckets(report.weekStart, { labels, today })
  const rows = buildCapacityRows(report, labels)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4">
          <h3 className="text-lg font-semibold text-ink">Részlegek terhelése</h3>
          <p className="text-xs text-ink-soft">
            Kapacitás: {labels.formatHours(report.hoursPerDay)} / nap / részleg
          </p>
          <ul className="flex flex-wrap gap-3 text-xs">
            {LEGEND.map(({ ratio, label }) => {
              const tone: Tone = capacityTone(ratio)
              return (
                <li key={label} className="flex items-center gap-2">
                  <span aria-hidden="true" className={`h-3 w-3 rounded ${STATUS_TONES[tone].dot}`} />
                  <span className="text-ink-muted">{label}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <CapacityHeatmap
          buckets={buckets}
          rows={rows}
          capacity={report.hoursPerDay}
          formatValue={labels.formatHours}
          ariaLabel="Részlegek heti terhelése"
          emptyLabel="Nincs megjeleníthető terhelés-adat."
          rowHeaderLabel="Részleg"
          summaryHeaderLabel="Heti kihasználtság"
        />
      </div>

      {report.bottlenecks.length > 0 && (
        <section
          aria-labelledby="capacity-bottlenecks"
          className={`rounded-lg border border-line p-4 ${STATUS_TONES.danger.bg}`}
        >
          <h4
            id="capacity-bottlenecks"
            className={`text-xs font-semibold uppercase tracking-wide ${STATUS_TONES.danger.fg}`}
          >
            Szűk keresztmetszetek ezen a héten
          </h4>
          <ul className="mt-2 space-y-1">
            {report.bottlenecks.map((bottleneck) => (
              <li key={bottleneck} className={`text-sm font-semibold ${STATUS_TONES.danger.fg}`}>
                {bottleneck}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
