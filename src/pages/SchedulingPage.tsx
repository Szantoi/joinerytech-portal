import { useState, useEffect } from 'react'
import { Card } from '../components/ui'
import { OperatorAutocomplete } from '../components/scheduling/OperatorAutocomplete'
import { BatchList } from '../components/scheduling/BatchList'
import { MachineDropZone } from '../components/scheduling/MachineDropZone'
import { ExecutionTimeline } from '../components/scheduling/ExecutionTimeline'
import { AssignmentConfirmModal } from '../components/scheduling/AssignmentConfirmModal'
import { useApi, API_BASE, useMutation } from '../hooks/useApi'
import { useSchedulePermissions } from '../hooks/useSchedulePermissions'
import { useBatchAssignment } from '../hooks/useBatchAssignment'
import type {
  Batch,
  Machine,
  Operator,
  Execution,
  PendingAssignment,
} from '../types/scheduling.types'

export function SchedulingPage() {
  const { maxPriority, isReadOnly } = useSchedulePermissions()

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [draggedBatchId, setDraggedBatchId] = useState<string | null>(null)
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)

  // Fetch data
  const { data: batches, refetch: refetchBatches } = useApi<Batch[]>(
    `${API_BASE.cutting}/api/batches?status=Unassigned`
  )
  useEffect(() => {
    refetchBatches()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: machines, refetch: refetchMachines } = useApi<Machine[]>(
    `${API_BASE.cutting}/api/machines`
  )
  useEffect(() => {
    refetchMachines()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: executions, refetch: refetchExecutions } = useApi<Execution[]>(
    `${API_BASE.cutting}/api/plans/${selectedDate}/executions`
  )
  useEffect(() => {
    refetchExecutions()
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const { assignBatch, isLoading: isAssigning, error: assignError } = useBatchAssignment(selectedDate)

  // Batch priority update (optimistic)
  const batchesWithUpdates = (batches ?? []).map(b => b)

  // Handle batch drop
  function handleBatchDrop(batchId: string, machineId: string) {
    const batch = batchesWithUpdates.find((b) => b.id === batchId)
    const machine = (machines ?? []).find((m) => m.id === machineId)

    if (!batch || !machine || !selectedOperator) {
      setAssignmentError('Please select an operator first')
      return
    }

    setPendingAssignment({
      batch,
      machine,
      priority: batch.priority,
    })
    setAssignmentError(null)
  }

  // Confirm assignment
  async function confirmAssignment() {
    if (!pendingAssignment || !selectedOperator) return

    setAssignmentError(null)

    try {
      await assignBatch({
        batchId: pendingAssignment.batch.id,
        machineId: pendingAssignment.machine.id,
        operatorId: selectedOperator.id,
        priority: pendingAssignment.priority,
        startTime: new Date().toISOString(),
      })

      // Refresh data
      refetchBatches()
      refetchExecutions()
      setPendingAssignment(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to assign batch'
      if (msg.includes('403')) {
        setAssignmentError('You do not have permission to set this priority level')
      } else {
        setAssignmentError(msg)
      }
    }
  }

  // Filter assigned batches for each machine
  const getAssignedBatches = (machineId: string): Batch[] => {
    return (executions ?? [])
      .filter((e) => e.machineId === machineId)
      .map((e) => {
        const batch = batchesWithUpdates.find((b) => b.id === e.batchId)
        return batch || null
      })
      .filter((b): b is Batch => b !== null)
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Machine & Operator Scheduling</h1>
          <p className="text-sm text-stone-600 mt-2">
            Assign batches to machines and operators. Drag batches to machines to schedule.
          </p>
        </div>

        {/* Error message */}
        {assignmentError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{assignmentError}</p>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Operator & Batches */}
          <div className="col-span-4 space-y-4">
            {/* Operator Selection */}
            <Card>
              <h2 className="font-semibold text-stone-900 mb-3">Operator Selection</h2>
              <OperatorAutocomplete
                selectedOperator={selectedOperator}
                onOperatorChange={setSelectedOperator}
                disabled={isReadOnly}
              />
              {isReadOnly && (
                <p className="text-xs text-stone-500 mt-2">
                  View-only mode: You cannot assign batches
                </p>
              )}
            </Card>

            {/* Batch List */}
            <Card>
              <h2 className="font-semibold text-stone-900 mb-3">
                Unassigned Batches ({batchesWithUpdates.length})
              </h2>
              <BatchList
                batches={batchesWithUpdates}
                maxPriority={maxPriority}
                onPriorityChange={() => {
                  // Priority updates handled locally in BatchCard for MVP
                }}
                onDragStart={(batch) => setDraggedBatchId(batch.id)}
                onDragEnd={() => setDraggedBatchId(null)}
                readOnly={isReadOnly}
                draggedBatchId={draggedBatchId}
              />
            </Card>
          </div>

          {/* Right Panel - Machines & Timeline */}
          <div className="col-span-8 space-y-4">
            {/* Machine Drop Zones */}
            <Card>
              <h2 className="font-semibold text-stone-900 mb-4">Machine Assignment</h2>
              <div className="grid grid-cols-2 gap-3">
                {(machines ?? []).map((machine) => (
                  <MachineDropZone
                    key={machine.id}
                    machine={machine}
                    assignedBatches={getAssignedBatches(machine.id)}
                    onBatchDrop={handleBatchDrop}
                    isDropTarget={draggedBatchId !== null}
                  />
                ))}
              </div>
              {machines && machines.length === 0 && (
                <p className="text-center text-sm text-stone-500 py-6">No machines available</p>
              )}
            </Card>

            {/* Execution Timeline */}
            <ExecutionTimeline
              machines={machines ?? []}
              executions={executions ?? []}
              planDate={selectedDate}
            />
          </div>
        </div>
      </div>

      {/* Assignment Confirmation Modal */}
      {pendingAssignment && selectedOperator && (
        <AssignmentConfirmModal
          isOpen={true}
          onClose={() => setPendingAssignment(null)}
          onConfirm={confirmAssignment}
          batch={pendingAssignment.batch}
          machine={pendingAssignment.machine}
          operator={selectedOperator}
          priority={pendingAssignment.priority}
          isLoading={isAssigning}
        />
      )}
    </div>
  )
}
