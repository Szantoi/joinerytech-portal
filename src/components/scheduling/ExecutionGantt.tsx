/**
 * ExecutionGantt — a gép×végrehajtás idősáv scheduling-kompozíciója.
 *
 * A korábbi `ExecutionTimeline` + `TimelineRow` páros helyére lép (PLAN-05 F1):
 * a rajzolást a domain-mentes `GanttChart` primitív végzi, itt CSAK a
 * domain-leképezés él (gép → sáv, végrehajtás → elem, prioritás → tónus).
 * A korábbi hardcode hex-színek és inline pozicionálás helyett a design-system
 * tónus-rendszere és a primitív geometriája dolgozik.
 */

import { GanttChart, STATUS_TONES, type GanttLane, type GanttTick, type Tone } from '@spaceos/portal-ui'
import type { Execution, Machine } from '../../types/scheduling.types'

interface ExecutionGanttProps {
  machines: Machine[]
  executions: Execution[]
  /** A terv napja `YYYY-MM-DD` alakban — a tengely rögzített 24 órás tartománya. */
  planDate: string
}

const HOUR_MS = 60 * 60 * 1000

/** Prioritás-sávok: 1-3 alacsony, 4-6 közepes, 7-10 magas. */
const PRIORITY_LEGEND: readonly { tone: Tone; label: string }[] = [
  { tone: 'success', label: 'Priority 1-3' },
  { tone: 'warn', label: 'Priority 4-6' },
  { tone: 'danger', label: 'Priority 7-10' },
]

function priorityTone(priority: number): Tone {
  if (priority <= 3) return 'success'
  if (priority <= 6) return 'warn'
  return 'danger'
}

/** A terv napjának helyi éjfele; érvénytelen dátumnál nincs rögzített tengely. */
function dayStartMs(planDate: string): number | undefined {
  const parsed = new Date(`${planDate}T00:00:00`).getTime()
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ExecutionGantt({ machines, executions, planDate }: ExecutionGanttProps) {
  const dayStart = dayStartMs(planDate)

  const lanes: GanttLane[] = machines.map((machine) => ({
    id: machine.id,
    label: machine.name,
    items: executions
      .filter((execution) => execution.machineId === machine.id)
      .map((execution) => {
        const start = new Date(execution.startTime).getTime()
        return {
          id: execution.id,
          label: execution.batchName,
          start,
          end: start + execution.estimatedMinutes * 60 * 1000,
          tone: priorityTone(execution.priority),
          title: `${execution.batchName} - Priority ${execution.priority}`,
        }
      }),
  }))

  // Óránkénti rács, de csak minden 3. órán felirat: 24 felirat a jobb szélen
  // egymásra csúszna, a sűrű rács viszont megmarad tájékozódási pontnak.
  const hourTicks: GanttTick[] | undefined =
    dayStart === undefined
      ? undefined
      : Array.from({ length: 24 }, (_, hour) => ({
          value: dayStart + hour * HOUR_MS,
          label: hour % 3 === 0 ? `${hour}:00` : '',
        }))

  return (
    <div className="border border-line rounded-lg bg-surface-card overflow-hidden">
      <div className="p-4 border-b border-line">
        <h3 className="text-lg font-semibold text-ink">Execution Timeline</h3>
        <p className="text-xs text-ink-soft mt-1">Plan date: {planDate}</p>
      </div>

      <GanttChart
        lanes={lanes}
        domain={dayStart === undefined ? undefined : { start: dayStart, end: dayStart + 24 * HOUR_MS }}
        ticks={hourTicks ?? 6}
        ariaLabel="Execution timeline by machine"
        emptyLabel="No machines available"
      />

      <div className="p-3 bg-surface-sunken border-t border-line flex gap-4 flex-wrap text-xs">
        {PRIORITY_LEGEND.map(({ tone, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div aria-hidden="true" className={`w-3 h-3 rounded ${STATUS_TONES[tone].dot}`} />
            <span className="text-ink-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
