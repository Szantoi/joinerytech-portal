import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi } from '../useApi'

// Csak a tokenre van szükségünk — a teljes auth-alakhoz nem kötjük magunkat,
// mert az más sáv élő felülete.
vi.mock('../../auth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

const originalFetch = globalThis.fetch
const fetchMock = vi.fn()

function respondWith(payload: unknown) {
  fetchMock.mockResolvedValue({ ok: true, json: async () => payload })
}

describe('useApi — isPending', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('az első festéskor pending, még mielőtt a lekérés elindulna', () => {
    respondWith([])

    const { result } = renderHook(() => useApi<string[]>('/a'))

    // Ez a hook csapdája: az isLoading még false, mert a fetch csak a fogyasztó
    // useEffect-jéből indul. Aki isLoading-ra gate-el, itt üres nézetet villant.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPending).toBe(true)
  })

  it('sikeres válasz után nem pending', async () => {
    respondWith(['x'])

    const { result } = renderHook(() => useApi<string[]>('/a'))
    await act(async () => {
      result.current.refetch()
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.data).toEqual(['x'])
  })

  it('hiba után nem pending — a skeleton nem ragadhat be a hibaüzenet elé', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    const { result } = renderHook(() => useApi<string[]>('/a'))
    await act(async () => {
      result.current.refetch()
    })

    await waitFor(() => expect(result.current.error).toBe('HTTP 500'))
    expect(result.current.isPending).toBe(false)
  })

  it('szabályos null törzs NEM ragasztja betöltésbe', async () => {
    respondWith(null)

    const { result } = renderHook(() => useApi<string[] | null>('/a'))
    await act(async () => {
      result.current.refetch()
    })

    // Ha a pending-et `data === null`-ból vezetnénk le, ez örökre skeleton lenne.
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('url-váltás után újra pending — a régi adat nem az új url válasza', async () => {
    respondWith(['a'])

    const { result, rerender } = renderHook(({ url }) => useApi<string[]>(url), {
      initialProps: { url: '/plans/2026-07-29' },
    })
    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    rerender({ url: '/plans/2026-07-30' })

    // A másik nap terve még nincs itt; a régi adat kirakása hazugság lenne.
    expect(result.current.isPending).toBe(true)
  })

  it('url === null esetén nincs mire várni (feltételes lekérés)', () => {
    respondWith([])

    const { result } = renderHook(() => useApi<string[]>(null))

    expect(result.current.isPending).toBe(false)
  })
})
