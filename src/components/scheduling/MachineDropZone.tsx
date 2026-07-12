import { useState } from 'react'
import { Card } from '../ui'
import type { Batch, Machine } from '../../types/scheduling.types'

interface MachineDropZoneProps {
  machine: Machine
  assignedBatches: Batch[]
  onBatchDrop: (batchId: string, machineId: string) => void
  isDropTarget?: boolean
}

export function MachineDropZone({
  machine,
  assignedBatches,
  onBatchDrop,
  isDropTarget = false,
}: MachineDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsHovered(true)
  }

  function handleDragLeave() {
    setIsHovered(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsHovered(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      onBatchDrop(data.batchId, machine.id)
    } catch {
      // Invalid drag data, ignore
    }
  }

  const statusColor = {
    Available: 'text-green-600',
    Busy: 'text-amber-600',
    Maintenance: 'text-red-600',
  }[machine.status] || 'text-stone-600'

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-4 min-h-32
        transition-colors
        ${isHovered ? 'border-teal-500 bg-teal-50' : 'border-stone-300 bg-white'}
      `}
    >
      <h3 className="font-semibold text-sm text-stone-900">{machine.name}</h3>
      <p className={`text-xs font-medium mt-1 ${statusColor}`}>
        {machine.status}
      </p>
      <p className="text-xs text-stone-600 mt-1">Capacity: {machine.capacity} units</p>

      {assignedBatches.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-200 space-y-1">
          {assignedBatches.map((batch) => (
            <div key={batch.id} className="text-xs text-stone-600">
              • {batch.name}
            </div>
          ))}
        </div>
      )}

      {assignedBatches.length === 0 && (
        <p className="text-xs text-stone-400 mt-4 text-center">
          Drag batches here to assign
        </p>
      )}
    </div>
  )
}
