import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth'
import { API_BASE } from './useApi'
import type { NestingResultResponse } from '../components/NestingViewer'

/**
 * Hook for fetching nesting result from backend.
 *
 * @param sheetId - The cutting sheet ID (GUID)
 * @param enabled - Whether to enable the query (default: true)
 * @returns React Query result with NestingResultResponse
 *
 * @example
 * const { data, isLoading, error } = useCuttingNesting(sheetId);
 */
export function useCuttingNesting(sheetId: string | null, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['cutting', 'nesting', sheetId],
    queryFn: async (): Promise<NestingResultResponse> => {
      if (!sheetId) {
        throw new Error('Sheet ID is required')
      }

      const response = await fetch(
        `${API_BASE.cutting}/api/cutting/sheets/${sheetId}/nesting`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data: NestingResultResponse = await response.json()
      return data
    },
    enabled: enabled && !!sheetId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
