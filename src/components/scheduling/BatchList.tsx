import { BatchCard } from './BatchCard'
import type { Batch } from '../../types/scheduling.types'

interface BatchListProps {
  batches: Batch[]
  maxPriority: number
  onPriorityChange?: (batchId: string, priority: number) => void
  onDragStart?: (batch: Batch) => void
  onDragEnd?: () => void
  readOnly?: boolean
  draggedBatchId?: string | null
}

export function BatchList({
  batches,
  maxPriority,
  onPriorityChange,
  onDragStart,
  onDragEnd,
  readOnly = false,
  draggedBatchId,
}: BatchListProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-6 text-stone-500">
        <p className="text-sm">No unassigned batches</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {batches.map((batch) => (
        <BatchCard
          key={batch.id}
          batch={batch}
          onPriorityChange={onPriorityChange ?? (() => {})}
          isDragging={draggedBatchId === batch.id}
          maxPriority={maxPriority}
          readOnly={readOnly}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
