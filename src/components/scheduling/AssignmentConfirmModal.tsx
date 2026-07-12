import type { Batch, Machine, Operator } from '../../types/scheduling.types'

interface AssignmentConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  batch: Batch
  machine: Machine
  operator: Operator
  priority: number
  isLoading?: boolean
}

export function AssignmentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  batch,
  machine,
  operator,
  priority,
  isLoading = false,
}: AssignmentConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">Confirm Batch Assignment</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Batch info */}
          <div>
            <p className="text-xs font-medium text-stone-600 uppercase">Batch</p>
            <p className="text-sm font-semibold text-stone-900 mt-1">{batch.name}</p>
            <p className="text-xs text-stone-600 mt-1">
              Material: {batch.materialType} | Qty: {batch.quantity}
            </p>
          </div>

          {/* Machine info */}
          <div>
            <p className="text-xs font-medium text-stone-600 uppercase">Target Machine</p>
            <p className="text-sm font-semibold text-stone-900 mt-1">{machine.name}</p>
            <p className="text-xs text-stone-600 mt-1">Capacity: {machine.capacity} units</p>
          </div>

          {/* Operator info */}
          <div>
            <p className="text-xs font-medium text-stone-600 uppercase">Assigned Operator</p>
            <p className="text-sm font-semibold text-stone-900 mt-1">{operator.name}</p>
            <p className="text-xs text-stone-600 mt-1">{operator.email}</p>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-stone-600 uppercase">Priority</p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{
                  backgroundColor:
                    priority <= 3
                      ? '#10b981'
                      : priority <= 6
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              >
                {priority}
              </div>
              <span className="text-sm text-stone-600">
                {priority <= 3 ? 'Low' : priority <= 6 ? 'Medium' : 'High'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-white border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}
