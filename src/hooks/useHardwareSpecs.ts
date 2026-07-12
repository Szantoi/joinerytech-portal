import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth'
import { API_BASE } from './useApi'
import type { HardwareListResponse, HardwareSpecItem } from '../types/joinery.types'

// ─── Mock Data for Fallback ─────────────────────────────────────────────────

export const MOCK_HARDWARE_SPECS: HardwareSpecItem[] = [
  { spec: 'edge-banding', value: 'ABS 2mm színazonos tölgy', quantity: 24 },
  { spec: 'hinge', value: 'Blum rejtett zsanér 110°', quantity: 6 },
  { spec: 'lacquer', value: 'Poliuretán matt lakk', quantity: 2 },
  { spec: 'stain', value: 'Tölgy lazúr (természetes)', quantity: 1 },
]

const MOCK_RESPONSE: HardwareListResponse = {
  orderId: 'mock',
  specs: MOCK_HARDWARE_SPECS,
  generatedAt: new Date().toISOString(),
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseHardwareSpecsResult {
  specs: HardwareSpecItem[]
  loading: boolean
  error: string | null
  isMock: boolean
  refetch: () => void
}

export function useHardwareSpecs(orderId: string | null): UseHardwareSpecsResult {
  const { token } = useAuth()
  const [specs, setSpecs] = useState<HardwareSpecItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
  const cacheRef = useRef<Record<string, HardwareListResponse>>({})

  const fetchSpecs = useCallback(async () => {
    if (!orderId || !token) {
      setSpecs([])
      return
    }

    // Check cache first
    if (cacheRef.current[orderId]) {
      const cached = cacheRef.current[orderId]
      setSpecs(cached.specs)
      setIsMock(false)
      return
    }

    setLoading(true)
    setError(null)
    setIsMock(false)

    try {
      const response = await fetch(`${API_BASE.joinery}/api/orders/${orderId}/hardware-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: HardwareListResponse = await response.json()
      cacheRef.current[orderId] = data
      setSpecs(data.specs)
    } catch (err) {
      // Graceful fallback to mock data
      console.warn('Hardware specs API failed, using mock data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSpecs(MOCK_RESPONSE.specs)
      setIsMock(true)
    } finally {
      setLoading(false)
    }
  }, [orderId, token])

  useEffect(() => {
    fetchSpecs()
  }, [fetchSpecs])

  return {
    specs,
    loading,
    error,
    isMock,
    refetch: fetchSpecs,
  }
}
