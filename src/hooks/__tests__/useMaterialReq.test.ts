import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMaterialReq, MOCK_MATERIALS } from '../useMaterialReq'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock useAuth
vi.mock('../../auth', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}))

describe('useMaterialReq', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('returns empty data when orderId is null', () => {
    const { result } = renderHook(() => useMaterialReq(null))

    expect(result.current.materials).toEqual([])
    expect(result.current.totalCost).toBe(0)
    expect(result.current.loading).toBe(false)
  })

  it('shows loading state while fetching', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useMaterialReq('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })
  })

  it('fetches and displays real materials on success', async () => {
    const mockResponse = {
      orderId: 'order-123',
      materials: [
        { id: 'MAT-001', name: 'Test Material', materialType: 'wood', quantity: 5, unit: 'piece', unitPrice: 1000, warehouseQty: 10, status: 'in-stock' },
      ],
      totalCost: 5000,
      generatedAt: '2026-06-17T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useMaterialReq('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.materials).toEqual(mockResponse.materials)
    expect(result.current.totalCost).toBe(5000)
    expect(result.current.isMock).toBe(false)
  })

  it('falls back to mock data on 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useMaterialReq('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.materials).toEqual(MOCK_MATERIALS)
    expect(result.current.isMock).toBe(true)
    expect(result.current.error).toBeTruthy()
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useMaterialReq('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.materials).toEqual(MOCK_MATERIALS)
    expect(result.current.isMock).toBe(true)
    expect(result.current.error).toBe('Network error')
  })

  it('caches results to avoid refetch on same orderId', async () => {
    const mockResponse = {
      orderId: 'order-123',
      materials: [{ id: 'MAT-001', name: 'Cached Material', materialType: 'wood', quantity: 1, unit: 'piece', unitPrice: 100, warehouseQty: 5, status: 'in-stock' }],
      totalCost: 100,
      generatedAt: '2026-06-17T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result, rerender } = renderHook(
      ({ orderId }) => useMaterialReq(orderId),
      { initialProps: { orderId: 'order-123' } }
    )

    await waitFor(() => {
      expect(result.current.materials).toEqual(mockResponse.materials)
    })

    // Rerender with same orderId - should use cache
    rerender({ orderId: 'order-123' })

    // Fetch should only be called once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
