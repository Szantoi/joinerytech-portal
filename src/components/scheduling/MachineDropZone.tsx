import { useState } from 'react'
import { STATUS_TONES } from '@spaceos/portal-ui'
import { machineStatusLabel, machineStatusTone } from '../../lib/scheduling/machineStatus'
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

  const tone = machineStatusTone(machine.status)
  const statusLabel = machineStatusLabel(machine.status)

  // Három vizuális állapot, két jelzéssel:
  //  - nyugalom: halvány szaggatott keret;
  //  - HÚZÁS FOLYAMATBAN (isDropTarget): erős keret MINDEN zónán — enélkül a
  //    felhasználó csak akkor tudta meg, hogy ide ejthet, amikor már pont a
  //    zóna fölött járt. A lap kezdettől átadta ezt a propot
  //    (draggedBatchId !== null), a komponens viszont eldobta — a lint
  //    „isDropTarget is assigned but never used" jelzése ezt az elmaradt
  //    viselkedést takarta.
  //  - a zóna fölött (isHovered): erős keret + kiemelt háttér.
  const zoneClasses = isHovered
    ? 'border-line-strong bg-surface-2'
    : isDropTarget
      ? 'border-line-strong bg-surface-card'
      : 'border-line bg-surface-card'

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-4 min-h-32
        transition-colors
        ${zoneClasses}
      `}
    >
      <h3 className="font-semibold text-sm text-ink">{machine.name}</h3>
      <p className={`text-xs font-medium mt-1 inline-flex items-center gap-1.5 ${STATUS_TONES[tone].fg}`}>
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONES[tone].dot}`} />
        {statusLabel}
      </p>
      <p className="text-xs text-ink-soft mt-1">Kapacitás: {machine.capacity} egység</p>

      {assignedBatches.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line space-y-1">
          {assignedBatches.map((batch) => (
            <div key={batch.id} className="text-xs text-ink-soft">
              • {batch.name}
            </div>
          ))}
        </div>
      )}

      {assignedBatches.length === 0 && (
        <p className="text-xs text-ink-muted mt-4 text-center">
          Húzd ide a köteget a kiosztáshoz
        </p>
      )}
    </div>
  )
}
