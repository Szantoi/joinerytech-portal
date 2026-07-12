import { Icon } from '../../ui/Icon'
import type { QueuedBatch } from '../../../types/shopfloor'

interface Props {
  batch: QueuedBatch
  canStart: boolean
  onStart: () => void
}

export function BatchQueueCard({ batch, canStart, onStart }: Props) {
  const statusConfig = {
    Queued: { bg: 'bg-blue-900', text: 'text-blue-200', label: 'Várakozik' },
    InProgress: { bg: 'bg-green-900', text: 'text-green-200', label: 'Gyártás alatt' },
    Completed: { bg: 'bg-gray-800', text: 'text-gray-400', label: 'Kész' },
  }

  const { bg, text, label } = statusConfig[batch.status]

  return (
    <div className="bg-stone-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-gray-500">#{batch.queuePosition}</div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Batch {batch.batchId.slice(0, 12)}
            </h3>
            <p className="text-sm text-gray-400">{batch.pieceCount} darab</p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <Icon name="clock" size={16} />
          <span>Becsült idő: {batch.estimatedDuration}</span>
        </div>

        {batch.material && (
          <div className="flex items-center gap-2">
            <Icon name="box" size={16} />
            <span>{batch.material}</span>
          </div>
        )}

        {batch.assignedOperator && (
          <div className="flex items-center gap-2">
            <Icon name="user" size={16} />
            <span>{batch.assignedOperator}</span>
          </div>
        )}
      </div>

      {canStart && (
        <button
          onClick={onStart}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-md transition-colors"
        >
          Gyártás indítása
        </button>
      )}
    </div>
  )
}
