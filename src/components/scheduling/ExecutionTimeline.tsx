import { TimelineRow } from './TimelineRow'
import type { Execution, Machine } from '../../types/scheduling.types'

interface ExecutionTimelineProps {
  machines: Machine[]
  executions: Execution[]
  planDate: string
}

export function ExecutionTimeline({
  machines,
  executions,
  planDate,
}: ExecutionTimelineProps) {
  if (machines.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-4">
        <h3 className="text-lg font-semibold">Execution Timeline</h3>
        <p className="text-sm text-stone-500 mt-4">No machines available</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="p-4 border-b border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900">Execution Timeline</h3>
        <p className="text-xs text-stone-500 mt-1">Plan date: {planDate}</p>
      </div>

      {/* Time header - 24 hour columns */}
      <div className="flex items-center border-b border-stone-200">
        <div className="w-32 flex-shrink-0 px-3 py-2 border-r border-stone-200" />
        <div className="flex-1 flex overflow-x-auto">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center py-1 border-r border-stone-200 last:border-r-0 bg-stone-50"
              style={{ minWidth: '100px' }}
            >
              <span className="text-xs font-medium text-stone-600">{i}:00</span>
            </div>
          ))}
        </div>
      </div>

      {/* Machine rows */}
      <div className="divide-y divide-stone-200">
        {machines.map((machine) => (
          <TimelineRow
            key={machine.id}
            machine={machine}
            executions={executions.filter((e) => e.machineId === machine.id)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="p-3 bg-stone-50 border-t border-stone-200 flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#10b981' }}
          />
          <span className="text-stone-600">Priority 1-3</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#f59e0b' }}
          />
          <span className="text-stone-600">Priority 4-6</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#ef4444' }}
          />
          <span className="text-stone-600">Priority 7-10</span>
        </div>
      </div>
    </div>
  )
}
