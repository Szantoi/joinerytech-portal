import { useState, useEffect } from 'react'
import type { MachineQueue } from '../types/shopfloor'

export function useMachineQueue(workstationId: string) {
  const [queue, setQueue] = useState<MachineQueue | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!workstationId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/cutting/api/shopfloor/machines/${workstationId}/queue`)

      if (!response.ok) {
        throw new Error('Failed to fetch machine queue')
      }

      const data = await response.json()
      setQueue(data)
    } catch (err: any) {
      console.error('Failed to fetch machine queue:', err)
      setError(err.message)

      // Mock fallback for development
      setQueue({
        workstationId,
        workstationName: 'Szabász gép #1',
        status: 'Active',
        batches: [
          {
            batchId: 'BATCH-2026-001',
            queuePosition: 1,
            status: 'Queued',
            pieceCount: 24,
            material: 'PAL 18mm Fehér',
            estimatedDuration: '1h 20m',
          },
          {
            batchId: 'BATCH-2026-002',
            queuePosition: 2,
            status: 'Queued',
            pieceCount: 18,
            material: 'PAL 18mm Tölgy',
            estimatedDuration: '55m',
          },
          {
            batchId: 'BATCH-2026-003',
            queuePosition: 3,
            status: 'Queued',
            pieceCount: 32,
            material: 'PAL 25mm Bükk',
            estimatedDuration: '1h 45m',
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [workstationId])

  return { queue, loading, error, refresh }
}
