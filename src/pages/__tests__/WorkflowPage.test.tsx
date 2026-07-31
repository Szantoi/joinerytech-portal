import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { WorkflowPage } from '../WorkflowPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    facilityId: null,
    user: { profile: { name: 'Test' } },
  })),
}))

/**
 * Az API-válasz tesztenként felülírható: a (b) döntés (root, 2026-07-31)
 * lényege pont az, hogy API-adatnál és mock-módban MÁS a tábla viselkedése.
 */
let apiItems: Array<{ id: string; title: string; targetFacilityId: string; phase: string; isDelegated: boolean }> | null = null

vi.mock('../../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    data: apiItems === null ? null : { items: apiItems, totalCount: apiItems.length },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(() => Promise.resolve({})),
    isLoading: false,
    error: null,
  })),
  fetchAll: vi.fn(() => Promise.resolve([])),
  API_BASE: {
    kernel: '/api', joinery: '/joinery', cutting: '/cutting',
    inventory: '/inventory', procurement: '/procurement',
    abstractions: '/abstractions', ai: '/ai', identity: '/identity', sales: '/sales',
  },
}))

afterEach(() => { vi.unstubAllGlobals() })

beforeEach(() => {
  apiItems = [
    { id: 'test-1', title: '16-fiókos szekrény', targetFacilityId: 'f1', phase: 'Delivery', isDelegated: false },
  ]
})

describe('WorkflowPage', () => {
  it('renders title', () => {
    render(<WorkflowPage />)
    expect(screen.getByText('Munkafolyamat')).toBeTruthy()
  })

  it('renders stage columns', () => {
    render(<WorkflowPage />)
    expect(screen.getByText(/rt\u00e9kes\u00edt\u00e9s/)).toBeTruthy()
    expect(screen.getByText(/Sz\u00e1ll\u00edt\u00e1s/)).toBeTruthy()
  })

  it('renders flow cards', () => {
    render(<WorkflowPage />)
    expect(screen.getByText(/16-fi\u00f3kos/)).toBeTruthy()
  })

  it('opens detail panel on card click', () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    expect(screen.getByText(/llapotvonal/)).toBeTruthy()
  })

  it('detail panel shows Rendelés indítása button', () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    expect(screen.getByText('Rendelés indítása')).toBeTruthy()
  })

  it('clicking Rendelés indítása opens NewOrderDrawer in POST mode', async () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    fireEvent.click(screen.getByText('Rendelés indítása'))
    await waitFor(() => expect(screen.getByText('Rendelés létrehozása →')).toBeTruthy())
  })

  it('NewOrderDrawer in POST mode shows project fields', async () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    fireEvent.click(screen.getByText('Rendelés indítása'))
    await waitFor(() => expect(screen.getByPlaceholderText('pl. Bognár konyha')).toBeTruthy())
    expect(screen.getByPlaceholderText('pl. DOOR-2026-001')).toBeTruthy()
  })

  // ── (b) döntés: API-adatnál a tábla CSAK-OLVASHATÓ ──────────────────────────
  // A korábbi viselkedés húzást ígért (draggable + drop-affordancia), aztán egy
  // néma NO-OP setter elnyelte. Az advance/skip-re szűkített drag (a) irány a
  // stage-térkép termékdöntésével EGYÜTT nyitható újra — addig ezek a tesztek
  // kötik ki, hogy a tábla nem ígér olyat, amit nem tud.

  it('API-adatnál a kártya NEM húzható, és a tábla kimondja, hogy csak olvasható', () => {
    render(<WorkflowPage />)

    const card = screen.getByText(/16-fiókos/).closest('[draggable]')!
    expect(card.getAttribute('draggable')).toBe('false')
    expect(screen.getByText(/csak olvasható/)).toBeTruthy()
  })

  it('API-adatnál a drop nem mozdítja a kártyát másik oszlopba', () => {
    render(<WorkflowPage />)

    // A Delivery fázis a 'production' (Gyártás) oszlopra képződik.
    const productionCol = screen.getByText('Gyártás').closest('div[class*="rounded-xl"]')! as HTMLElement
    const salesCol = screen.getByText('Értékesítés').closest('div[class*="rounded-xl"]')! as HTMLElement
    expect(within(productionCol).getByText(/16-fiókos/)).toBeTruthy()

    fireEvent.drop(salesCol, {
      dataTransfer: { getData: () => 'test-1' },
    })

    // A kártya ott maradt, ahol a folyamat tartja — a drop-nak nincs kezelője.
    expect(within(productionCol).getByText(/16-fiókos/)).toBeTruthy()
    expect(within(salesCol).queryByText(/16-fiókos/)).toBeNull()
  })

  it('mock-módban (nincs API-adat) nincs csak-olvasható jelzés', () => {
    apiItems = null
    render(<WorkflowPage />)

    expect(screen.queryByText(/csak olvasható/)).toBeNull()
  })

  it('closing order drawer via Mégse removes it', async () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    fireEvent.click(screen.getByText('Rendelés indítása'))
    await waitFor(() => screen.getByText('Rendelés létrehozása →'))
    // Get all 'Mégse' buttons (one for DetailPanel actions, one for the drawer footer)
    const megseBtns = screen.getAllByText('Mégse')
    fireEvent.click(megseBtns[megseBtns.length - 1])
    await waitFor(() => expect(screen.queryByText('Rendelés létrehozása →')).toBeNull())
  })
})
