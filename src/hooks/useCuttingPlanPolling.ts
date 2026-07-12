import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../auth'
import { API_BASE } from './useApi'
import type { CuttingPlansResponse, CuttingPlanResponse } from '../types/joinery.types'

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseCuttingPlanPollingResult {
  plan: CuttingPlanResponse | null
  polling: boolean
  error: string | null
  isMock: boolean
  startPolling: (date: string, planId: string) => void
  stopPolling: () => void
}

const POLL_INTERVAL_MS = 2000 // 2 seconds
const MAX_POLL_TIME_MS = 5 * 60 * 1000 // 5 minutes

export function useCuttingPlanPolling(): UseCuttingPlanPollingResult {
  const { token } = useAuth()
  const [plan, setPlan] = useState<CuttingPlanResponse | null>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
  
  const pollingRef = useRef<{
    intervalId: ReturnType<typeof setInterval> | null
    startTime: number
    date: string
    planId: string
  }>({
    intervalId: null,
    startTime: 0,
    date: '',
    planId: '',
  })

  const doPoll = useCallback(
    async (date: string, planId: string) => {
      if (!token) {
        setError('Not authenticated')
        return
      }

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
        const foundPlan = data.plans.find((p) => p.id === planId)

        if (foundPlan) {
          setPlan(foundPlan)
          setIsMock(false)
          setError(null)

          // Stop polling if status is complete
          if (foundPlan.status === 'complete') {
            stopPolling()
          }
        }
      } catch (err) {
        console.warn('Cutting plan polling failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    },
    [token]
  )

  const startPolling = useCallback(
    (date: string, planId: string) => {
      if (pollingRef.current.intervalId) {
        clearInterval(pollingRef.current.intervalId)
      }

      setPlan(null)
      setError(null)
      setPolling(true)

      pollingRef.current.startTime = Date.now()
      pollingRef.current.date = date
      pollingRef.current.planId = planId

      // First poll immediately
      doPoll(date, planId)

      // Then poll at regular intervals
      const intervalId = setInterval(() => {
        const elapsedTime = Date.now() - pollingRef.current.startTime

        if (elapsedTime > MAX_POLL_TIME_MS) {
          clearInterval(intervalId)
          setPolling(false)
          setError('Polling timeout: plan generation took too long')
          return
        }

        doPoll(date, planId)
      }, POLL_INTERVAL_MS)

      pollingRef.current.intervalId = intervalId
    },
    [doPoll]
  )

  const stopPolling = useCallback(() => {
    if (pollingRef.current.intervalId) {
      clearInterval(pollingRef.current.intervalId)
      pollingRef.current.intervalId = null
    }
    setPolling(false)
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
    plan,
    polling,
    error,
    isMock,
    startPolling,
    stopPolling,
  }
}
