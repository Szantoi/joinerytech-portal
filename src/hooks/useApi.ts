import { useState, useCallback } from 'react'
import { useAuth } from '../auth'

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
}

interface ApiResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// API base URLs (nginx proxy)
export const API_BASE = {
  kernel:       '/api',
  joinery:      '/joinery',
  inventory:    '/inventory',
  cutting:      '/cutting',
  procurement:  '/procurement',
  abstractions: '/abstractions',
  ai:           '/ai',
} as const

export function useApi<T>(url: string | null, options?: FetchOptions): ApiResult<T> {
  const { token } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!url || !token) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method: options?.method ?? 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as T
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ismeretlen hiba')
    } finally {
      setIsLoading(false)
    }
  }, [url, token, options])

  // Auto-fetch on mount and url/token change
  // Use useEffect in components wrapping this hook

  return { data, isLoading, error, refetch: fetchData }
}
