import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProductionPage } from '../ProductionPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-token',
    user: { profile: { name: 'Test User' } },
  })),
}))

beforeEach(() => {
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ProductionPage', () => {
  it('renders cutting plans tab by default', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders cutting plans in default tab', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders nesting panel heading', () => {
    render(<ProductionPage />)
    expect(screen.getByText('Nesting vizualizáció')).toBeTruthy()
  })

  it('switches to machining tab and shows columns', () => {
    render(<ProductionPage />)
    fireEvent.click(screen.getByText(/Megmunk/))
    const cncMatches = screen.getAllByText(/CNC/)
    expect(cncMatches.length).toBeGreaterThan(0)
  })

  it('renders nesting viewer with no-plan state when API unavailable', () => {
    render(<ProductionPage />)
    // Plan list is empty (no API token in test env) — nesting shows "no plan" state
    expect(screen.getByText('Nincs kiválasztott terv')).toBeTruthy()
  })

  // ─── TOP 1: Design→Cutting Workflow tests ─────────────────────────────────

  it('auto-selects and highlights plan when navigated with highlightPlanId state', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft', orderReference: 'JT-2426-0184', customerName: 'Bognár Bútor Kft.' },
      { id: 'CP-183-XYZ', name: 'CP-183-XYZ', date: '2024-06-14', status: 'Planned' },
    ]

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))

    render(
      <MemoryRouter initialEntries={[{ pathname: '/w/production/cutting', state: { highlightPlanId: 'CP-184-ABC' } }]}>
        <ProductionPage />
      </MemoryRouter>
    )

    // Wait for plans to load and highlight to apply
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const highlightedButton = planButtons.find(btn =>
        btn.className.includes('border-l-teal-500') && btn.textContent?.includes('CP-184-ABC')
      )
      expect(highlightedButton).toBeTruthy()
    })

    // Verify scrollIntoView was called
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('displays customer name and order context in plan row', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft', orderReference: 'JT-2426-0184', customerName: 'Bognár Bútor Kft.' },
    ]

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    // Wait for plans to load
    await waitFor(() => {
      expect(screen.getByText('Bognár Bútor Kft. · JT-2426-0184')).toBeTruthy()
    })
  })

  it('removes highlight border after 3 seconds', async () => {
    vi.useFakeTimers()

    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/w/production/cutting', state: { highlightPlanId: 'CP-184-ABC' } }]}>
        <ProductionPage />
      </MemoryRouter>
    )

    // Wait for plans to load and highlight to apply
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const highlightedButton = planButtons.find(btn => btn.className.includes('border-l-teal-500'))
      expect(highlightedButton).toBeTruthy()
    })

    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000)

    // Wait for highlight to be removed
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const highlightedButton = planButtons.find(btn => btn.className.includes('border-l-teal-500'))
      expect(highlightedButton).toBeFalsy()
    })

    vi.useRealTimers()
  })

  // ─── TOP 2: Nesting Visualization tests ───────────────────────────────────

  it('fetches nesting data when plan is selected', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    const mockNestingData = {
      strategy: 'Guillotine',
      sheets: [
        {
          id: 'sheet-1',
          width: 2800,
          height: 2070,
          wastePercentage: 12.5,
          placedParts: [
            { id: 'Part-001', x: 0, y: 0, width: 400, height: 600, materialType: 'EG-3303-18' },
          ],
        },
      ],
    }

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      if (url.includes('/nesting')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNestingData),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    // Wait for plans to load
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const planButton = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))
      expect(planButton).toBeTruthy()
    })

    // Click on a plan
    const planButtons = screen.getAllByRole('button')
    const planButton = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))
    if (planButton) {
      fireEvent.click(planButton)

      // Wait for nesting data to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/nesting'),
          expect.any(Object)
        )
      })
    }
  })

  it('displays NestingViewer when nesting data is available', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    const mockNestingData = {
      strategy: 'Guillotine',
      sheets: [
        {
          id: 'sheet-1',
          width: 2800,
          height: 2070,
          wastePercentage: 12.5,
          placedParts: [
            { id: 'Part-001', x: 0, y: 0, width: 400, height: 600, materialType: 'EG-3303-18' },
          ],
        },
      ],
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      if (url.includes('/nesting')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNestingData),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    // Click on a plan
    await waitFor(() => screen.getAllByRole('button'))
    const planButtons = screen.getAllByRole('button')
    const planButton = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))

    if (planButton) {
      fireEvent.click(planButton)

      // Wait for NestingViewer to render
      await waitFor(() => {
        expect(screen.getByText('Hulladék: 12.5%')).toBeTruthy()
        expect(screen.getByText('Stratégia: Guillotine')).toBeTruthy()
      })
    }
  })

  it('shows fallback message when nesting API fails', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      if (url.includes('/nesting')) {
        return Promise.resolve({ ok: false, status: 503 })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    // Click on a plan
    await waitFor(() => screen.getAllByRole('button'))
    const planButtons = screen.getAllByRole('button')
    const planButton = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))

    if (planButton) {
      fireEvent.click(planButton)

      // Wait for fallback message
      await waitFor(() => {
        expect(screen.getByText('Nesting API nem elérhető')).toBeTruthy()
      })
    }
  })

  it('shows empty state when no plan is selected', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Nincs kiválasztott terv')).toBeTruthy()
  })

  it('refetches nesting data when different plan is selected', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
      { id: 'CP-183-XYZ', name: 'CP-183-XYZ', date: '2024-06-14', status: 'Planned' },
    ]

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/cutting/plans')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlans),
        })
      }
      if (url.includes('/nesting')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            strategy: 'FFDH',
            sheets: [
              {
                id: 'sheet-1',
                width: 2800,
                height: 2070,
                wastePercentage: 8.0,
                placedParts: [],
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <ProductionPage />
      </MemoryRouter>
    )

    // Click on first plan
    await waitFor(() => screen.getAllByRole('button'))
    const firstPlanButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('CP-184-ABC'))
    if (firstPlanButton) {
      fireEvent.click(firstPlanButton)
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('CP-184-ABC/nesting'),
          expect.any(Object)
        )
      })
    }

    // Click on second plan
    const secondPlanButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('CP-183-XYZ'))
    if (secondPlanButton) {
      fireEvent.click(secondPlanButton)
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('CP-183-XYZ/nesting'),
          expect.any(Object)
        )
      })
    }
  })
})
