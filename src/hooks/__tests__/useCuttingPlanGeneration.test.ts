import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCuttingPlanGeneration } from '../useCuttingPlanGeneration'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock useAuth
vi.mock('../../auth', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}))

describe('useCuttingPlanGeneration', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with idle status', () => {
    const { result } = renderHook(() => useCuttingPlanGeneration())

    expect(result.current.status).toBe('idle')
    expect(result.current.planId).toBeNull()
    expect(result.current.plan).toBeNull()
  })

  it('sets error when no orders selected', async () => {
    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: [],
      })
    })

    expect(result.current.error).toBe('Válasszon ki legalább egy rendelést')
  })

  it('sends POST request with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 'plan-123',
        date: '2026-06-17',
        status: 'complete',
        sheets: [],
      }),
    })

    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: ['order-1', 'order-2'],
      })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cutting/plans'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          date: '2026-06-17',
          capacity: 1000,
          orders: ['order-1', 'order-2'],
        }),
      })
    )
  })

  it('sets complete status when plan is immediately complete', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 'plan-123',
        date: '2026-06-17',
        status: 'complete',
        sheets: [{ sheetId: 's1', parts: [], wastePercent: 10 }],
      }),
    })

    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: ['order-1'],
      })
    })

    expect(result.current.status).toBe('complete')
    expect(result.current.plan?.sheets.length).toBe(1)
  })

  it('enters polling status when plan status is queued', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 'plan-123',
        date: '2026-06-17',
        status: 'queued',
        sheets: [],
      }),
    })

    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: ['order-1'],
      })
    })

    // Should enter polling status when plan is queued
    expect(result.current.status).toBe('polling')
    expect(result.current.planId).toBe('plan-123')
  })

  it('handles 500 error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })

    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: ['order-1'],
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toContain('500')
  })

  it('resets state correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 'plan-123',
        date: '2026-06-17',
        status: 'complete',
        sheets: [],
      }),
    })

    const { result } = renderHook(() => useCuttingPlanGeneration())

    await act(async () => {
      await result.current.generate({
        date: '2026-06-17',
        capacity: 1000,
        orders: ['order-1'],
      })
    })

    expect(result.current.planId).toBe('plan-123')

    act(() => {
      result.current.reset()
    })

    expect(result.current.planId).toBeNull()
    expect(result.current.plan).toBeNull()
    expect(result.current.status).toBe('idle')
  })
})
