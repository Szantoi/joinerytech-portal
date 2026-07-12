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
        border rounded-lg p-3 bg-white shadow-sm
        ${isDragging ? 'opacity-50 border-amber-400' : 'border-stone-200'}
        ${readOnly ? '' : 'cursor-move hover:shadow-md transition-shadow'}
      `}
    >
      <h4 className="font-semibold text-sm text-stone-900">{batch.name}</h4>
      <p className="text-xs text-stone-600 mt-1">Material: {batch.materialType}</p>
      <p className="text-xs text-stone-600">Quantity: {batch.quantity}</p>

      <PrioritySlider
        value={batch.priority}
        max={maxPriority}
        onChange={(val) => onPriorityChange(batch.id, val)}
        disabled={readOnly}
        showLabel={true}
      />

      <div className="mt-2 pt-2 border-t border-stone-200">
        <p className="text-xs text-stone-500">Est. time: {batch.estimatedMinutes} min</p>
      </div>
    </div>
  )
}
