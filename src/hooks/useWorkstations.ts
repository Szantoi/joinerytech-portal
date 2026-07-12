import { useState, useEffect } from 'react'
import type { Workstation } from '../types/shopfloor'

export function useWorkstations() {
  const [workstations, setWorkstations] = useState<Workstation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkstations = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/cutting/api/shopfloor/workstations')

        if (!response.ok) {
          throw new Error('Failed to fetch workstations')
        }

        const data = await response.json()
        setWorkstations(data)
      } catch (err: any) {
        console.error('Failed to fetch workstations:', err)
        setError(err.message)

        // Mock fallback for development
        setWorkstations([
          { id: 'ws-001', name: 'Szabász gép #1', type: 'cutting', facility: 'Fő üzem', status: 'active' },
          { id: 'ws-002', name: 'Szabász gép #2', type: 'cutting', facility: 'Fő üzem', status: 'idle' },
          { id: 'ws-003', name: 'Élzáró gép #1', type: 'edgeband', facility: 'Fő üzem', status: 'active' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkstations()
  }, [])

  return { workstations, loading, error }
}
