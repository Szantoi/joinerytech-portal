import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkflowPage } from '../WorkflowPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    facilityId: null,
    user: { profile: { name: 'Test' } },
  })),
}))

vi.mock('../../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    data: {
      items: [
        { id: 'test-1', title: '16-fiókos szekrény', targetFacilityId: 'f1', phase: 'Delivery', isDelegated: false },
      ],
      totalCount: 1,
    },
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
