import { useEffect } from 'react'
import { useMachineQueue } from '../../../hooks/useMachineQueue'
import { BatchQueueCard } from './BatchQueueCard'
import type { OperatorSession, Batch } from '../../../types/shopfloor'

interface Props {
  session: OperatorSession
  onStartBatch: (batch: Batch) => void
  onLogout: () => void
}

export function MachineQueueScreen({ session, onStartBatch, onLogout }: Props) {
  const { queue, loading, refresh } = useMachineQueue(session.workstationId)

  useEffect(() => {
    const interval = setInterval(refresh, 10000) // 10s polling
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div className="min-h-screen bg-stone-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{session.workstationName}</h1>
          <p className="text-gray-400">Operátor: {session.operatorName}</p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-md transition-colors"
        >
          Kijelentkezés
        </button>
      </div>

      {/* Queue status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              queue?.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {queue?.status === 'Active' ? 'Aktív' : 'Tétlen'}
          </span>
        </div>
        <h2 className="text-xl font-semibold">
          Munkavárólist ({queue?.batches.length || 0} tétel)
        </h2>
      </div>

      {/* Loading state */}
      {loading && !queue && (
        <div className="text-center py-12 text-gray-500">Betöltés...</div>
      )}

      {/* Batches */}
      {queue && queue.batches.length > 0 && (
        <div className="space-y-4">
          {queue.batches.map((batch) => (
            <BatchQueueCard
              key={batch.batchId}
              batch={batch}
              canStart={batch.queuePosition === 1 && batch.status === 'Queued'}
              onStart={() =>
                onStartBatch({
                  batchId: batch.batchId,
                  pieceCount: batch.pieceCount,
                  material: batch.material,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {queue && queue.batches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nincs feladat a várólistában
        </div>
      )}
    </div>
  )
}
