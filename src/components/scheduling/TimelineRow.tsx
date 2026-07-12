import type { Execution, Machine } from '../../types/scheduling.types'

interface TimelineRowProps {
  machine: Machine
  executions: Execution[]
}

function getPriorityColor(priority: number): string {
  if (priority <= 3) return '#10b981' // Green - Low
  if (priority <= 6) return '#f59e0b' // Amber - Medium
  return '#ef4444' // Red - High
}

function calculateTimelinePosition(startTime: string, estimatedMinutes: number) {
  const start = new Date(startTime)
  const startHour = start.getHours() + start.getMinutes() / 60
  const durationHours = estimatedMinutes / 60

  return {
    left: (startHour / 24) * 100,
    width: (durationHours / 24) * 100,
  }
}

export function TimelineRow({ machine, executions }: TimelineRowProps) {
  return (
    <div className="flex items-center border-b border-stone-200">
      {/* Machine name */}
      <div className="w-32 flex-shrink-0 px-3 py-3 border-r border-stone-200">
        <p className="text-xs font-medium text-stone-900 truncate">{machine.name}</p>
      </div>

      {/* Timeline grid */}
      <div className="relative flex-1 h-12 overflow-hidden">
        {executions.map((execution) => {
          const { left, width } = calculateTimelinePosition(
            execution.startTime,
            execution.estimatedMinutes
          )

          return (
            <div
              key={execution.id}
              className="absolute h-10 rounded px-2 flex items-center"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: getPriorityColor(execution.priority),
                top: '1px',
              }}
              title={`${execution.batchName} - Priority ${execution.priority}`}
            >
              <span className="text-xs text-white font-medium truncate">
                {execution.batchName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
