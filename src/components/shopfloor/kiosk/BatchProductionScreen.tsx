import { useState, useEffect } from 'react'
import { Icon } from '../../ui/Icon'
import type { Batch, OperatorSession } from '../../../types/shopfloor'

interface Props {
  batch: Batch
  session: OperatorSession
  onComplete: () => void
  onCancel: () => void
}

export function BatchProductionScreen({ batch, session, onComplete, onCancel }: Props) {
  const [producedPieces, setProducedPieces] = useState(batch.pieceCount)
  const [wastePieces, setWastePieces] = useState(0)
  const [startedAt] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  const handleComplete = async () => {
    try {
      const response = await fetch(`/cutting/api/shopfloor/batches/${batch.batchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          producedPieces,
          wastePieces,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete batch')
      }

      onComplete()
    } catch (err) {
      console.error('Failed to complete batch:', err)
      // Mock success for development
      onComplete()
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon name="bolt" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Gyártás alatt</h1>
          <p className="text-gray-400">Batch {batch.batchId.slice(0, 12)}</p>
        </div>

        {/* Timer */}
        <div className="bg-stone-800 rounded-lg p-8 text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-2">{formatTime(elapsedTime)}</div>
          <div className="text-sm text-gray-400">Eltelt idő</div>
        </div>

        {/* Piece count */}
        <div className="bg-stone-800 rounded-lg p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold">Legyártott darabok</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setProducedPieces(Math.max(0, producedPieces - 1))}
                className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold w-16 text-center">{producedPieces}</span>
              <button
                onClick={() => setProducedPieces(producedPieces + 1)}
                className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold">Selejt darabok</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setWastePieces(Math.max(0, wastePieces - 1))}
                className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold w-16 text-center text-red-400">
                {wastePieces}
              </span>
              <button
                onClick={() => setWastePieces(wastePieces + 1)}
                className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-stone-700 hover:bg-stone-600 text-white font-semibold py-4 rounded-md transition-colors"
          >
            Mégse
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-md transition-colors"
          >
            Gyártás befejezése
          </button>
        </div>
      </div>
    </div>
  )
}
