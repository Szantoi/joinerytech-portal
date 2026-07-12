import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHardwareSpecs, MOCK_HARDWARE_SPECS } from '../useHardwareSpecs'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock useAuth
vi.mock('../../auth', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}))

describe('useHardwareSpecs', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('returns empty data when orderId is null', () => {
    const { result } = renderHook(() => useHardwareSpecs(null))

    expect(result.current.specs).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('shows loading state while fetching', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useHardwareSpecs('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })
  })

  it('fetches and displays real hardware specs on success', async () => {
    const mockResponse = {
      orderId: 'order-123',
      specs: [
        { spec: 'edge-banding', value: 'Test Edge', quantity: 10 },
      ],
      generatedAt: '2026-06-17T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useHardwareSpecs('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.specs).toEqual(mockResponse.specs)
    expect(result.current.isMock).toBe(false)
  })

  it('falls back to mock data on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useHardwareSpecs('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.specs).toEqual(MOCK_HARDWARE_SPECS)
    expect(result.current.isMock).toBe(true)
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const { result } = renderHook(() => useHardwareSpecs('order-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.specs).toEqual(MOCK_HARDWARE_SPECS)
    expect(result.current.error).toBe('Connection refused')
    expect(result.current.isMock).toBe(true)
  })
})
