import { PrioritySlider } from './PrioritySlider'
import type { Batch } from '../../types/scheduling.types'

interface BatchCardProps {
  batch: Batch
  onPriorityChange: (batchId: string, priority: number) => void
  isDragging?: boolean
  maxPriority: number
  readOnly?: boolean
  onDragStart?: (batch: Batch) => void
  onDragEnd?: () => void
}

export function BatchCard({
  batch,
  onPriorityChange,
  isDragging = false,
  maxPriority,
  readOnly = false,
  onDragStart,
  onDragEnd,
}: BatchCardProps) {
  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    if (readOnly) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ batchId: batch.id }))
    onDragStart?.(batch)
  }

  function handleDragEnd() {
    onDragEnd?.()
  }

  return (
    <div
      draggable={!readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        border rounded-lg p-3 bg-surface-card shadow-sm
        ${isDragging ? 'opacity-50 border-line-strong' : 'border-line'}
        ${readOnly ? '' : 'cursor-move hover:shadow-md transition-shadow'}
      `}
    >
      <h4 className="font-semibold text-sm text-ink">{batch.name}</h4>
      <p className="text-xs text-ink-soft mt-1">Anyag: {batch.materialType}</p>
      <p className="text-xs text-ink-soft">Mennyiség: {batch.quantity}</p>

      <PrioritySlider
        value={batch.priority}
        max={maxPriority}
        onChange={(val) => onPriorityChange(batch.id, val)}
        disabled={readOnly}
        showLabel={true}
      />

      <div className="mt-2 pt-2 border-t border-line">
        <p className="text-xs text-ink-muted">Becsült idő: {batch.estimatedMinutes} perc</p>
      </div>
    </div>
  )
}
