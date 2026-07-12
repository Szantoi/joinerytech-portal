import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth'
import { API_BASE } from './useApi'
import type { MaterialReqResponse, MaterialReqItem } from '../types/joinery.types'

// ─── Mock Data for Fallback ─────────────────────────────────────────────────

export const MOCK_MATERIALS: MaterialReqItem[] = [
  { id: 'MAT-001', name: 'Tölgyfa 40mm', materialType: 'wood', quantity: 12, unit: 'piece', unitPrice: 8500, warehouseQty: 25, status: 'in-stock' },
  { id: 'MAT-002', name: 'MDF 18mm', materialType: 'wood', quantity: 8, unit: 'piece', unitPrice: 4200, warehouseQty: 15, status: 'in-stock' },
  { id: 'MAT-003', name: 'Bükk élzáró 2mm', materialType: 'hardware', quantity: 24, unit: 'meter', unitPrice: 450, warehouseQty: 8, status: 'on-order' },
  { id: 'MAT-004', name: 'Rejtett zsanér', materialType: 'hardware', quantity: 6, unit: 'piece', unitPrice: 2800, warehouseQty: 20, status: 'in-stock' },
  { id: 'MAT-005', name: 'Lakkozás (matt)', materialType: 'finishing', quantity: 2, unit: 'kg', unitPrice: 12500, warehouseQty: 0, status: 'insufficient' },
]

const MOCK_RESPONSE: MaterialReqResponse = {
  orderId: 'mock',
  materials: MOCK_MATERIALS,
  totalCost: MOCK_MATERIALS.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0),
  generatedAt: new Date().toISOString(),
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseMaterialReqResult {
  materials: MaterialReqItem[]
  totalCost: number
  loading: boolean
  error: string | null
  isMock: boolean
  refetch: () => void
}

export function useMaterialReq(orderId: string | null): UseMaterialReqResult {
  const { token } = useAuth()
  const [materials, setMaterials] = useState<MaterialReqItem[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
  const cacheRef = useRef<Record<string, MaterialReqResponse>>({})

  const fetchMaterials = useCallback(async () => {
    if (!orderId || !token) {
      setMaterials([])
      setTotalCost(0)
      return
    }

    // Check cache first
    if (cacheRef.current[orderId]) {
      const cached = cacheRef.current[orderId]
      setMaterials(cached.materials)
      setTotalCost(cached.totalCost)
      setIsMock(false)
      return
    }

    setLoading(true)
    setError(null)
    setIsMock(false)

    try {
      const response = await fetch(`${API_BASE.joinery}/api/orders/${orderId}/material-req`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: MaterialReqResponse = await response.json()
      cacheRef.current[orderId] = data
      setMaterials(data.materials)
      setTotalCost(data.totalCost)
    } catch (err) {
      // Graceful fallback to mock data
      console.warn('Material requisition API failed, using mock data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMaterials(MOCK_RESPONSE.materials)
      setTotalCost(MOCK_RESPONSE.totalCost)
      setIsMock(true)
    } finally {
      setLoading(false)
    }
  }, [orderId, token])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  return {
    materials,
    totalCost,
    loading,
    error,
    isMock,
    refetch: fetchMaterials,
  }
}
