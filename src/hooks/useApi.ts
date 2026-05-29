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

interface MutationOptions {
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
}

interface MutationResult<T> {
  mutate: (url: string, options: MutationOptions) => Promise<T>
  isLoading: boolean
  error: string | null
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
  identity:     '/identity',
  sales:        '/sales',
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

// Fetch multiple URLs in parallel, returning results in the same order.
// Returns null entries for failed/missing responses.
export async function fetchAll<T>(
  urls: string[],
  token: string
): Promise<(T | null)[]> {
  return Promise.all(
    urls.map(url =>
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(r => (r.ok ? (r.json() as Promise<T>) : null))
        .catch(() => null)
    )
  )
}

export function useMutation<T = unknown>(): MutationResult<T> {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (url: string, options: MutationOptions): Promise<T> => {
    if (!token) throw new Error('Nincs bejelentkezve')
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method: options.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as T
      return json
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ismeretlen hiba'
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  return { mutate, isLoading, error }
}
