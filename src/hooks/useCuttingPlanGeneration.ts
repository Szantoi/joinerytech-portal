import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../auth'
import { API_BASE } from './useApi'
import type { CuttingPlanRequest, CuttingPlanResponse, CuttingPlansResponse } from '../types/joinery.types'

// ─── Mock Data for Fallback ─────────────────────────────────────────────────

const MOCK_CUTTING_PLAN: CuttingPlanResponse = {
  id: 'plan-mock-001',
  date: new Date().toISOString().split('T')[0],
  status: 'complete',
  sheets: [
    {
      sheetId: 'sheet-1',
      parts: [
        { partId: 'part-1', x: 0, y: 0, width: 100, height: 200 },
        { partId: 'part-2', x: 110, y: 0, width: 100, height: 200 },
        { partId: 'part-3', x: 0, y: 210, width: 210, height: 180 },
      ],
      wastePercent: 12.5,
    },
  ],
}

// ─── Hook ───────────────────────────────────────────────────────────────────

type GenerationStatus = 'idle' | 'generating' | 'polling' | 'complete' | 'error'

interface UseCuttingPlanGenerationResult {
  status: GenerationStatus
  plan: CuttingPlanResponse | null
  planId: string | null
  error: string | null
  isMock: boolean
  generate: (request: CuttingPlanRequest) => Promise<void>
  reset: () => void
}

const POLL_INTERVAL_MS = 2000 // 2 seconds
const MAX_POLL_TIME_MS = 5 * 60 * 1000 // 5 minutes

export function useCuttingPlanGeneration(): UseCuttingPlanGenerationResult {
  const { token } = useAuth()
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [plan, setPlan] = useState<CuttingPlanResponse | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)

  const pollingRef = useRef<{
    intervalId: ReturnType<typeof setInterval> | null
    startTime: number
    date: string
  }>({
    intervalId: null,
    startTime: 0,
    date: '',
  })

  // Poll for plan status
  const doPoll = useCallback(
    async (date: string, currentPlanId: string) => {
      if (!token) return

      try {
        const response = await fetch(
          `${API_BASE.cutting}/api/cutting/plans?date=${date}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: CuttingPlansResponse = await response.json()
        const foundPlan = data.plans.find((p) => p.id === currentPlanId)

        if (foundPlan) {
          setPlan(foundPlan)
          setIsMock(false)
          setError(null)

          if (foundPlan.status === 'complete') {
            setStatus('complete')
            if (pollingRef.current.intervalId) {
              clearInterval(pollingRef.current.intervalId)
              pollingRef.current.intervalId = null
            }
          }
        }
      } catch (err) {
        console.warn('Cutting plan polling failed:', err)
      }
    },
    [token]
  )

  const generate = useCallback(
    async (request: CuttingPlanRequest) => {
      if (!token) {
        setError('Not authenticated')
        setStatus('error')
        return
      }

      // Validation
      if (!request.orders || request.orders.length === 0) {
        setError('Válasszon ki legalább egy rendelést')
        setStatus('error')
        return
      }

      setStatus('generating')
      setError(null)
      setIsMock(false)
      setPlan(null)
      setPlanId(null)

      try {
        const response = await fetch(`${API_BASE.cutting}/api/cutting/plans`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`HTTP ${response.status}: ${text}`)
        }

        const data: CuttingPlanResponse = await response.json()
        setPlan(data)
        setPlanId(data.id)

        // If plan is complete, update status
        if (data.status === 'complete') {
          setStatus('complete')
        } else if (data.status === 'queued' || data.status === 'processing') {
          // Start polling for updates
          setStatus('polling')
          pollingRef.current.startTime = Date.now()
          pollingRef.current.date = request.date

          // First poll immediately
          await doPoll(request.date, data.id)

          // Then poll at regular intervals
          const intervalId = setInterval(async () => {
            const elapsedTime = Date.now() - pollingRef.current.startTime

            if (elapsedTime > MAX_POLL_TIME_MS) {
              clearInterval(intervalId)
              setStatus('error')
              setError('Polling timeout: plan generation took too long')
              return
            }

            await doPoll(request.date, data.id)
          }, POLL_INTERVAL_MS)

          pollingRef.current.intervalId = intervalId
        }
      } catch (err) {
        // Set error status - DO NOT fall back to mock for generation errors
        console.warn('Cutting plan generation failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
      }
    },
    [token, doPoll]
  )

  const reset = useCallback(() => {
    if (pollingRef.current.intervalId) {
      clearInterval(pollingRef.current.intervalId)
      pollingRef.current.intervalId = null
    }
    setStatus('idle')
    setPlan(null)
    setPlanId(null)
    setError(null)
    setIsMock(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current.intervalId) {
        clearInterval(pollingRef.current.intervalId)
      }
    }
  }, [])

  return {
    status,
    plan,
    planId,
    error,
    isMock,
    generate,
    reset,
  }
}
