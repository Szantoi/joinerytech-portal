import { useState } from 'react'
import { Card, Icon, StatusPill } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface MachineBatch {
  id: string
  planId: string
  planName: string
  materialType: string
  partsCount: number
  status: 'unassigned' | 'assigned' | 'running' | 'completed'
  assignedMachine?: string
  assignedOperator?: string
  assignedOperatorId?: string
  priority?: number
  startTime?: string
}

export interface MachineColumn {
  id: string
  name: string
  type: 'cnc' | 'edgebanding' | 'qc'
  batches: MachineBatch[]
}

export interface Operator {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  roles: string[]
}

export interface AssignBatchRequest {
  batchId: string
  machineId: string
  operatorId: string
  priority: number
  startTime: string
}

interface BatchAssignmentBoardProps {
  date: string
  batches: MachineBatch[]
  onAssignSuccess?: () => void
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getStatusColor(status: MachineBatch['status']): string {
  switch (status) {
    case 'running': return 'border-teal-400 bg-teal-50'
    case 'completed': return 'border-emerald-400 bg-emerald-50'
    case 'assigned': return 'border-amber-400 bg-amber-50'
    default: return 'border-stone-300 bg-white'
  }
}

function getMachineIcon(type: string): string {
  switch (type) {
    case 'cnc': return 'layers'
    case 'edgebanding': return 'edit'
    case 'qc': return 'check'
    default: return 'more'
  }
}

// ─── BatchCard Component ────────────────────────────────────────────────────────

interface BatchCardProps {
  batch: MachineBatch
  isDragging?: boolean
  canAssign?: boolean
  canExecute?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onAssign?: (request: AssignBatchRequest) => void
  onStart?: () => void
  onComplete?: () => void
}

function BatchCard({
  batch,
  isDragging,
  canAssign,
  canExecute,
  onDragStart,
  onDragEnd,
  onAssign,
  onStart,
  onComplete
}: BatchCardProps) {
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [operatorName, setOperatorName] = useState(batch.assignedOperator || '')
  const [selectedOperatorId, setSelectedOperatorId] = useState(batch.assignedOperatorId || '')
  const [priority, setPriority] = useState(batch.priority || 5)
  const [startTime, setStartTime] = useState(batch.startTime || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: operators, isLoading: isLoadingOperators } = useApi<Operator[]>(
    showAssignForm ? `${API_BASE.identity}/api/users?role=machine_operator` : null
  )

  const handleSubmit = async () => {
    if (!selectedOperatorId || !batch.assignedMachine || !startTime || !onAssign) {
      alert('Kérem töltse ki az összes mezőt')
      return
    }

    setIsSubmitting(true)
    try {
      await onAssign({
        batchId: batch.id,
        machineId: batch.assignedMachine,
        operatorId: selectedOperatorId,
        priority,
        startTime,
      })
      setShowAssignForm(false)
    } catch (error) {
      console.error('Hozzárendelési hiba:', error)
      alert('Hiba történt a hozzárendelés során')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusBadge = batch.status === 'unassigned' ? null : (
    <StatusPill
      status={batch.status === 'assigned' ? 'planned' : batch.status}
      label={batch.status === 'assigned' ? 'Hozzárendelve' : batch.status === 'running' ? 'Futó' : 'Kész'}
    />
  )

  return (
    <div
      draggable={batch.status === 'unassigned'}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`${getStatusColor(batch.status)} border-2 rounded-lg p-3 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${batch.status === 'unassigned' ? 'cursor-move hover:shadow-lg' : 'cursor-default'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-semibold text-stone-900 truncate">
            {batch.planName}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {batch.materialType} · {batch.partsCount} db
          </div>
        </div>
        {statusBadge}
      </div>

      {/* Assigned info */}
      {batch.status !== 'unassigned' && batch.assignedOperator && (
        <div className="mb-2 pb-2 border-b border-stone-200/70">
          <div className="flex items-center gap-1.5 text-[10.5px] text-stone-600">
            <Icon name="user" size={10} />
            <span>{batch.assignedOperator}</span>
          </div>
          {batch.priority && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-stone-600 mt-1">
              <Icon name="flag" size={10} />
              <span>Prioritás: {batch.priority}/10</span>
            </div>
          )}
        </div>
      )}

      {/* Assign form (shown when dropped) */}
      {showAssignForm && canAssign && batch.status === 'unassigned' && (
        <div className="space-y-2 pt-2 border-t border-stone-200/70">
          {/* Operator selector */}
          <div>
            <label className="block text-[10px] font-medium text-stone-700 mb-1">
              Operátor
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => {
                setSelectedOperatorId(e.target.value)
                const op = operators?.find(o => o.id === e.target.value)
                if (op) {
                  setOperatorName(`${op.firstName || ''} ${op.lastName || ''}`.trim() || op.username)
                }
              }}
              className="w-full px-2 py-1.5 text-[11px] border border-stone-300 rounded-lg focus:outline-none focus:border-teal-500"
              disabled={isLoadingOperators}
            >
              <option value="">Válasszon operátort...</option>
              {operators?.map((op) => {
                const displayName = `${op.firstName || ''} ${op.lastName || ''}`.trim() || op.username
                return (
                  <option key={op.id} value={op.id}>
                    {displayName}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Priority slider */}
          <div>
            <label className="block text-[10px] font-medium text-stone-700 mb-1">
              Prioritás: {priority}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>

          {/* Start time */}
          <div>
            <label className="block text-[10px] font-medium text-stone-700 mb-1">
              Indítási idő
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] border border-stone-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedOperatorId || !startTime}
              className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-[11px] font-medium rounded-lg hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Mentés...' : 'Hozzárendel'}
            </button>
            <button
              onClick={() => setShowAssignForm(false)}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 text-[11px] font-medium rounded-lg hover:bg-stone-50 transition"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* FSM quick actions (assigned or running batches) */}
      {!showAssignForm && batch.status !== 'unassigned' && batch.status !== 'completed' && canExecute && (
        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/70">
          {batch.status === 'assigned' && (
            <button
              onClick={onStart}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-[10.5px] font-medium rounded-lg hover:bg-teal-700 transition"
            >
              <Icon name="play" size={10} />
              Indítás
            </button>
          )}
          {batch.status === 'running' && (
            <button
              onClick={onComplete}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10.5px] font-medium rounded-lg hover:bg-emerald-700 transition"
            >
              <Icon name="check" size={10} />
              Befejezés
            </button>
          )}
        </div>
      )}

      {/* Show assign form button (if dropped but not shown) */}
      {!showAssignForm && batch.status === 'unassigned' && batch.assignedMachine && canAssign && (
        <button
          onClick={() => setShowAssignForm(true)}
          className="w-full mt-2 px-3 py-1.5 border-2 border-dashed border-teal-300 text-teal-700 text-[10.5px] font-medium rounded-lg hover:bg-teal-50 transition"
        >
          Operátor hozzárendelése
        </button>
      )}
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
      className={`h-full transition-colors rounded-lg ${isOver ? 'bg-teal-50 ring-2 ring-teal-300' : ''}`}
    >
      {children}
    </div>
  )
}

// ─── Main BatchAssignmentBoard Component ──────────────────────────────────────────

export function BatchAssignmentBoard({ date, batches, onAssignSuccess }: BatchAssignmentBoardProps) {
  const { mutate } = useMutation()
  const { roles } = useAuth()
  const [draggedBatch, setDraggedBatch] = useState<MachineBatch | null>(null)
  const [localBatches, setLocalBatches] = useState<MachineBatch[]>(batches)

  // RBAC: Check if user can assign or execute
  const canAssign = roles?.includes('Admin') || roles?.includes('Joiner')
  const canExecute = roles?.includes('Admin') || roles?.includes('Joiner')

  // Machine columns
  const machines: MachineColumn[] = [
    { id: 'cnc', name: 'CNC Router', type: 'cnc', batches: [] },
    { id: 'edgebanding', name: 'Él ragasztás', type: 'edgebanding', batches: [] },
    { id: 'qc', name: 'Minőségellenőrzés', type: 'qc', batches: [] },
  ]

  // Group batches by machine
  const unassignedBatches = localBatches.filter(b => b.status === 'unassigned')
  machines.forEach(machine => {
    machine.batches = localBatches.filter(b => b.assignedMachine === machine.id && b.status !== 'unassigned')
  })

  const handleDragStart = (batch: MachineBatch) => {
    setDraggedBatch(batch)
  }

  const handleDragEnd = () => {
    setDraggedBatch(null)
  }

  const handleDrop = (machineId: string) => {
    if (!draggedBatch) return

    // Update batch with assigned machine
    setLocalBatches(prev =>
      prev.map(b => b.id === draggedBatch.id ? { ...b, assignedMachine: machineId } : b)
    )
    setDraggedBatch(null)
  }

  const handleAssign = async (request: AssignBatchRequest) => {
    const url = `${API_BASE.cutting}/api/plans/${date}/assign-batch`
    await mutate(url, {
      method: 'POST',
      body: request,
    })

    // Update local state
    setLocalBatches(prev =>
      prev.map(b =>
        b.id === request.batchId
          ? { ...b, status: 'assigned', assignedOperatorId: request.operatorId, priority: request.priority, startTime: request.startTime }
          : b
      )
    )

    onAssignSuccess?.()
  }

  const handleStart = (batchId: string) => {
    // TODO: Call FSM transition API when available
    setLocalBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, status: 'running' } : b))
    )
  }

  const handleComplete = (batchId: string) => {
    // TODO: Call FSM transition API when available
    setLocalBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, status: 'completed' } : b))
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Unassigned column */}
      <Card className="p-0 col-span-1">
        <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="inbox" size={14} className="text-stone-500" />
            <div className="text-[12.5px] font-semibold text-stone-900">Hozzárendelésre vár</div>
          </div>
          <span className="text-[10.5px] text-stone-500 tabular-nums">{unassignedBatches.length}</span>
        </div>
        <div className="p-3 space-y-2 min-h-96 max-h-[600px] overflow-auto">
          {unassignedBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              isDragging={draggedBatch?.id === batch.id}
              canAssign={canAssign}
              canExecute={canExecute}
              onDragStart={() => handleDragStart(batch)}
              onDragEnd={handleDragEnd}
            />
          ))}
          {unassignedBatches.length === 0 && (
            <div className="py-8 text-center text-[11.5px] text-stone-400">
              Minden batch hozzárendelve
            </div>
          )}
        </div>
      </Card>

      {/* Machine columns */}
      {machines.map((machine) => (
        <Card key={machine.id} className="p-0 col-span-1">
          <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name={getMachineIcon(machine.type)} size={14} className="text-stone-500" />
              <div className="text-[12.5px] font-semibold text-stone-900">{machine.name}</div>
            </div>
            <span className="text-[10.5px] text-stone-500 tabular-nums">{machine.batches.length}</span>
          </div>
          <DropZone machineId={machine.id} onDrop={handleDrop}>
            <div className="p-3 space-y-2 min-h-96 max-h-[600px] overflow-auto">
              {machine.batches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  canAssign={canAssign}
                  canExecute={canExecute}
                  onAssign={handleAssign}
                  onStart={() => handleStart(batch.id)}
                  onComplete={() => handleComplete(batch.id)}
                />
              ))}
              {machine.batches.length === 0 && (
                <div className="py-8 text-center text-[11.5px] text-stone-400">
                  Nincs hozzárendelt batch
                </div>
              )}
            </div>
          </DropZone>
        </Card>
      ))}
    </div>
  )
}
