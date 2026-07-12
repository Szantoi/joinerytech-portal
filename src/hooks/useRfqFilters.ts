import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface RfqItem {
  id: string
  rfqNumber: string
  supplierName: string
  status: string
  totalAmount: number
  createdAt: string
  items?: Array<{ name: string }>
}

export interface RfqFilterCounts {
  open: number
  quoted: number
  closed: number
  all: number
}

/**
 * useRfqFilters
 *
 * Hook for filtering RFQs with URL sync and badge counts.
 *
 * Features:
 * - URL-based filter state (shareable links)
 * - Search in RFQ number or product names
 * - Status tabs with counts
 * - Debounced search (handled by input component)
 * - Memoized filtering for performance
 */
export function useRfqFilters(rfqs: RfqItem[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get filter values from URL params
  const status = searchParams.get('status') || 'open'
  const query = searchParams.get('q') || ''
  const searchScope = (searchParams.get('scope') || 'both') as 'rfq' | 'products' | 'both'

  /**
   * Update filter params in URL
   */
  const setStatus = (newStatus: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('status', newStatus)
    setSearchParams(params)
  }

  const setQuery = (newQuery: string) => {
    const params = new URLSearchParams(searchParams)
    if (newQuery) {
      params.set('q', newQuery)
    } else {
      params.delete('q')
    }
    setSearchParams(params)
  }

  const setSearchScope = (newScope: 'rfq' | 'products' | 'both') => {
    const params = new URLSearchParams(searchParams)
    params.set('scope', newScope)
    setSearchParams(params)
  }

  /**
   * Calculate status counts
   */
  const counts: RfqFilterCounts = useMemo(() => {
    return {
      open: rfqs.filter((rfq) => rfq.status === 'Submitted' || rfq.status === 'open').length,
      quoted: rfqs.filter((rfq) => rfq.status === 'Approved' || rfq.status === 'quoted').length,
      closed: rfqs.filter((rfq) => rfq.status === 'Delivered' || rfq.status === 'Cancelled' || rfq.status === 'closed').length,
      all: rfqs.length,
    }
  }, [rfqs])

  /**
   * Filter RFQs by status and search query
   */
  const filtered = useMemo(() => {
    let result = rfqs

    // Filter by status
    if (status !== 'all') {
      result = result.filter((rfq) => {
        if (status === 'open') {
          return rfq.status === 'Submitted' || rfq.status === 'open'
        }
        if (status === 'quoted') {
          return rfq.status === 'Approved' || rfq.status === 'quoted'
        }
        if (status === 'closed') {
          return rfq.status === 'Delivered' || rfq.status === 'Cancelled' || rfq.status === 'closed'
        }
        return true
      })
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      result = result.filter((rfq) => {
        const matchRfqNumber = rfq.rfqNumber?.toLowerCase().includes(lowerQuery)
        const matchProductNames = rfq.items?.some((item) =>
          item.name?.toLowerCase().includes(lowerQuery)
        )

        if (searchScope === 'rfq') {
          return matchRfqNumber
        }
        if (searchScope === 'products') {
          return matchProductNames
        }
        // both
        return matchRfqNumber || matchProductNames
      })
    }

    return result
  }, [rfqs, status, query, searchScope])

  return {
    filtered,
    status,
    query,
    searchScope,
    setStatus,
    setQuery,
    setSearchScope,
    counts,
  }
}
