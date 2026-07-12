import { useState } from 'react'
import { Card, Icon, StatusPill } from './ui'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface ScheduledBatch {
  id: string
  planName: string
  machineId: string
  machineName: string
  operatorName: string
  priority: number
  startTime: string
  endTime?: string
  status: 'scheduled' | 'running' | 'done' | 'paused'
  partsCount: number
  completionPercent?: number
}

export interface TimeSlot {
  hour: number
  label: string
}

interface BatchTimelineProps {
  date: string
  scheduledBatches: ScheduledBatch[]
  machines: Array<{ id: string; name: string }>
  onReorder?: (batchId: string, newMachineId: string, newStartTime: string) => void
}

interface DraggableBatchProps {
  batch: ScheduledBatch
  onDragStart: (batch: ScheduledBatch) => void
  onDragEnd: () => void
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getStatusColor(status: ScheduledBatch['status']): string {
  switch (status) {
    case 'running': return 'bg-teal-100 border-teal-400 text-teal-900'
    case 'done': return 'bg-emerald-100 border-emerald-400 text-emerald-900'
    case 'paused': return 'bg-amber-100 border-amber-400 text-amber-900'
    default: return 'bg-stone-100 border-stone-300 text-stone-900'
  }
}

function getPriorityColor(priority: number): string {
  if (priority >= 8) return 'bg-rose-600'
  if (priority >= 5) return 'bg-amber-500'
  return 'bg-emerald-600'
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function calculateBlockPosition(startTime: string, startHour: number): { left: string; width: string } {
  const start = new Date(startTime)
  const hour = start.getHours()
  const minute = start.getMinutes()

  // Calculate position relative to timeline start (6:00 AM by default)
  const hourOffset = hour - startHour
  const minuteOffset = minute / 60
  const left = (hourOffset + minuteOffset) * 60 // 60px per hour

  // Default duration: 2 hours
  const width = 120 // 2 hours * 60px

  return {
    left: `${left}px`,
    width: `${width}px`
  }
}

// ─── DraggableBatch Component ──────────────────────────────────────────────────

function DraggableBatch({ batch, onDragStart, onDragEnd }: DraggableBatchProps) {
  const statusColor = getStatusColor(batch.status)
  const priorityColor = getPriorityColor(batch.priority)
  const position = calculateBlockPosition(batch.startTime, 6)
  const completionPercent = batch.completionPercent ?? 0

  return (
    <div
      draggable={batch.status === 'scheduled'}
      onDragStart={() => onDragStart(batch)}
      onDragEnd={onDragEnd}
      className={`absolute h-12 ${statusColor} border-2 rounded-lg overflow-hidden cursor-move hover:shadow-lg transition-shadow ${
        batch.status === 'scheduled' ? 'hover:scale-105' : 'cursor-default'
      }`}
      style={{ left: position.left, width: position.width, top: '4px' }}
      title={`${batch.planName} · ${batch.operatorName} · Prioritás: ${batch.priority}${
        batch.status === 'running' ? ` · ${completionPercent}% kész` : ''
      }`}
    >
      {/* Progress bar background (only for running batches) */}
      {batch.status === 'running' && (
        <div
          className="absolute inset-0 bg-teal-600/20"
          style={{ width: `${completionPercent}%` }}
        />
      )}

      <div className="relative flex items-center gap-1.5 h-full px-2 py-1">
        <div
          className={`w-1 h-full ${priorityColor} rounded-full shrink-0`}
          title={`Prioritás: ${batch.priority}`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold truncate">{batch.planName}</div>
          <div className="text-[9.5px] truncate opacity-80">
            {batch.operatorName} · {batch.partsCount} db
            {batch.status === 'running' && ` · ${completionPercent}%`}
          </div>
        </div>
        <div className="text-[9px] font-mono opacity-70 shrink-0">
          {formatTime(batch.startTime)}
        </div>
      </div>
    </div>
  )
}

// ─── DropZone Component ────────────────────────────────────────────────────────

interface DropZoneProps {
  machineId: string
  onDrop: (machineId: string) => void
  children: React.ReactNode
}

function DropZone({ machineId, onDrop, children }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    onDrop(machineId)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-colors ${isOver ? 'bg-teal-50/50' : ''}`}
    >
      {children}
    </div>
  )
}

// ─── BatchTimeline Component ───────────────────────────────────────────────────

export function BatchTimeline({ date, scheduledBatches, machines, onReorder }: BatchTimelineProps) {
  const [draggedBatch, setDraggedBatch] = useState<ScheduledBatch | null>(null)

  // Generate time slots (6 AM - 10 PM)
  const timeSlots: TimeSlot[] = Array.from({ length: 16 }, (_, i) => {
    const hour = 6 + i
    return { hour, label: `${String(hour).padStart(2, '0')}:00` }
  })

  const handleDragStart = (batch: ScheduledBatch) => {
    setDraggedBatch(batch)
  }

  const handleDragEnd = () => {
    setDraggedBatch(null)
  }

  const handleDrop = (machineId: string) => {
    if (draggedBatch && onReorder) {
      // Keep the same time for now (in a real app, we'd calculate based on drop position)
      onReorder(draggedBatch.id, machineId, draggedBatch.startTime)
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">Gép ütemterv</div>
          <div className="text-[11px] text-stone-500">
            {scheduledBatches.length} ütemezett batch · {date}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2 h-2 bg-emerald-600 rounded-full" />
            <span className="text-stone-600">Alacsony</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-stone-600">Közepes</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2 h-2 bg-rose-600 rounded-full" />
            <span className="text-stone-600">Magas</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          {/* Timeline header */}
          <div className="flex border-b border-stone-200 bg-stone-50">
            <div className="w-40 shrink-0 px-4 py-2 text-[11px] font-medium text-stone-700 border-r border-stone-200">
              Gép
            </div>
            <div className="flex-1 flex">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="w-[60px] shrink-0 px-2 py-2 text-[10px] text-stone-500 text-center border-r border-stone-200/50 last:border-0"
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          {/* Machine rows */}
          {machines.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-stone-400">
              Nincs elérhető gép
            </div>
          ) : (
            machines.map((machine) => {
              const machineBatches = scheduledBatches.filter(b => b.machineId === machine.id)

              return (
                <DropZone key={machine.id} machineId={machine.id} onDrop={handleDrop}>
                  <div className="flex border-b border-stone-100 last:border-0 hover:bg-stone-50/40">
                    <div className="w-40 shrink-0 px-4 py-3 border-r border-stone-200 flex items-center gap-2">
                      <Icon name="layers" size={14} className="text-stone-400" />
                      <div>
                        <div className="text-[11.5px] font-medium text-stone-900">{machine.name}</div>
                        <div className="text-[10px] text-stone-500">{machineBatches.length} batch</div>
                      </div>
                    </div>
                    <div className="flex-1 relative" style={{ height: '64px' }}>
                      {/* Time grid */}
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.hour}
                          className="absolute w-[60px] h-full border-r border-stone-100/50"
                          style={{ left: `${(slot.hour - 6) * 60}px` }}
                        />
                      ))}

                      {/* Scheduled batches */}
                      {machineBatches.map((batch) => (
                        <DraggableBatch
                          key={batch.id}
                          batch={batch}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                  </div>
                </DropZone>
              )
            })
          )}
        </div>
      </div>

      {scheduledBatches.length === 0 && (
        <div className="px-4 py-8 text-center text-[12px] text-stone-400">
          Nincs ütemezett batch ezen a napon
        </div>
      )}
    </Card>
  )
}

// ─── DraggableBatchList Component ──────────────────────────────────────────────

interface DraggableBatchListProps {
  batches: ScheduledBatch[]
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function DraggableBatchList({ batches, onReorder }: DraggableBatchListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDropTargetIndex(index)
  }

  const handleDrop = (toIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  return (
    <Card className="p-0">
      <div className="px-4 py-3 border-b border-stone-100">
        <div className="text-[12.5px] font-semibold text-stone-900">Batch sorrend</div>
        <div className="text-[11px] text-stone-500 mt-0.5">
          Húzza az elemeket az átrendezéshez
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        {batches.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-stone-400">
            Nincs batch a listában
          </div>
        ) : (
          batches.map((batch, index) => (
            <div
              key={batch.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              className={`px-4 py-3 border-b border-stone-100 last:border-0 cursor-move hover:bg-stone-50 transition ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${dropTargetIndex === index ? 'border-t-2 border-t-teal-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon name="menu" size={14} className="text-stone-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[12px] font-medium text-stone-900 truncate">
                      {batch.planName}
                    </div>
                    <div
                      className={`w-1.5 h-1.5 ${getPriorityColor(batch.priority)} rounded-full shrink-0`}
                      title={`Prioritás: ${batch.priority}`}
                    />
                  </div>
                  <div className="text-[10.5px] text-stone-500 mt-0.5">
                    {batch.machineName} · {batch.operatorName} · {formatTime(batch.startTime)}
                  </div>
                </div>
                <StatusPill
                  status={batch.status === 'scheduled' ? 'planned' : batch.status}
                  label={batch.status === 'scheduled' ? 'Tervezett' : batch.status === 'running' ? 'Futó' : 'Kész'}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
