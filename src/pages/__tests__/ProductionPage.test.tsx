import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProductionPage } from '../ProductionPage'
import { ToastProvider } from '../../components/ui/Toast'

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

// Helper to render with required providers
function renderWithProviders(ui: React.ReactElement, routerProps = {}) {
  return render(
    <MemoryRouter {...routerProps}>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.useRealTimers() // CRITICAL: restore real timers after each test
  vi.unstubAllGlobals()
})

describe('ProductionPage', () => {
  it('renders cutting plans tab by default', () => {
    renderWithProviders(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders cutting plans in default tab', () => {
    renderWithProviders(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders nesting panel heading', () => {
    renderWithProviders(<ProductionPage />)
    expect(screen.getByText('Nesting vizualizáció')).toBeTruthy()
  })

  it('switches to machining tab and shows columns', () => {
    renderWithProviders(<ProductionPage />)
    fireEvent.click(screen.getByText(/Megmunk/))
    const cncMatches = screen.getAllByText(/CNC/)
    expect(cncMatches.length).toBeGreaterThan(0)
  })

  it('renders nesting viewer with no-plan state when API unavailable', () => {
    renderWithProviders(<ProductionPage />)
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

    renderWithProviders(
      <ProductionPage />,
      { initialEntries: [{ pathname: '/w/production/cutting', state: { highlightPlanId: 'CP-184-ABC' } }] }
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

    renderWithProviders(<ProductionPage />)

    // Wait for plans to load
    await waitFor(() => {
      expect(screen.getByText('Bognár Bútor Kft. · JT-2426-0184')).toBeTruthy()
    })
  })

  it('applies and clears highlight border automatically', async () => {
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

    renderWithProviders(
      <ProductionPage />,
      { initialEntries: [{ pathname: '/w/production/cutting', state: { highlightPlanId: 'CP-184-ABC' } }] }
    )

    // Wait for plans to load and highlight to apply
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const highlightedButton = planButtons.find(btn => btn.className.includes('border-l-teal-500'))
      expect(highlightedButton).toBeTruthy()
    })

    // Wait for highlight to be automatically cleared (3s + buffer)
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const highlightedButton = planButtons.find(btn => btn.className.includes('border-l-teal-500'))
      expect(highlightedButton).toBeFalsy()
    }, { timeout: 4000 })
  })

  // ─── TOP 2: Nesting Visualization tests ───────────────────────────────────

  it('fetches nesting data when plan is selected', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    const mockNestingData = {
      SheetId: 'CP-184-ABC',
      OrderReference: 'JT-2426-0184',
      TotalParts: 1,
      Groups: [{ MaterialType: 'EG-3303-18', ThicknessMm: 18, Lines: [] }],
      PanelAssignments: [
        {
          PanelStockId: 'sheet-1',
          MaterialType: 'EG-3303-18',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          UtilizationPercent: 87.5,
          WasteAreaMm2: 0,
          PlacedParts: [
            { PartName: 'Part-001', X: 0, Y: 0, WidthMm: 400, HeightMm: 600, IsRotated: false },
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

    await act(async () => {
      renderWithProviders(<ProductionPage />)
    })

    // Wait for plans to load
    const planButton = await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const btn = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))
      expect(btn).toBeTruthy()
      return btn!
    })

    // Click on plan
    await act(async () => {
      fireEvent.click(planButton)
    })

    // Wait for nesting data to load
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/nesting'),
        expect.any(Object)
      )
    })
  })

  it('displays NestingViewer when nesting data is available', async () => {
    const mockPlans = [
      { id: 'CP-184-ABC', name: 'CP-184-ABC', date: '2024-06-15', status: 'Draft' },
    ]

    const mockNestingData = {
      SheetId: 'CP-184-ABC',
      OrderReference: 'JT-2426-0184',
      TotalParts: 1,
      Groups: [{ MaterialType: 'EG-3303-18', ThicknessMm: 18, Lines: [] }],
      PanelAssignments: [
        {
          PanelStockId: 'sheet-1',
          MaterialType: 'EG-3303-18',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          UtilizationPercent: 87.5,
          WasteAreaMm2: 0,
          PlacedParts: [
            { PartName: 'Part-001', X: 0, Y: 0, WidthMm: 400, HeightMm: 600, IsRotated: false },
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

    await act(async () => {
      renderWithProviders(<ProductionPage />)
    })

    // Wait for plans to load and click
    const planButton = await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const btn = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))
      expect(btn).toBeTruthy()
      return btn!
    })

    await act(async () => {
      fireEvent.click(planButton)
    })

    // Wait for NestingViewer to render
    await waitFor(() => {
      expect(screen.getByText('Hulladék: 12.5%')).toBeTruthy()
      expect(screen.getByText('Stratégia: Optimized')).toBeTruthy()
    })
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

    renderWithProviders(<ProductionPage />)

    // Wait for plans to load and click
    const planButton = await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      const btn = planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))
      expect(btn).toBeTruthy()
      return btn!
    })

    fireEvent.click(planButton)

    // Wait for fallback message
    await waitFor(() => {
      expect(screen.getByText('Nesting API nem elérhető')).toBeTruthy()
    })
  })

  it('shows empty state when no plan is selected', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))

    renderWithProviders(<ProductionPage />)

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
            SheetId: 'sheet-id',
            OrderReference: 'JT-2426-0184',
            TotalParts: 0,
            Groups: [{ MaterialType: 'EG-3303-18', ThicknessMm: 18, Lines: [] }],
            PanelAssignments: [
              {
                PanelStockId: 'sheet-1',
                MaterialType: 'EG-3303-18',
                PanelWidthMm: 2800,
                PanelHeightMm: 2070,
                UtilizationPercent: 92.0,
                WasteAreaMm2: 0,
                PlacedParts: [],
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })

    vi.stubGlobal('fetch', fetchMock)

    renderWithProviders(<ProductionPage />)

    // Wait for plans to load
    await waitFor(() => {
      const planButtons = screen.getAllByRole('button')
      expect(planButtons.find(btn => btn.textContent?.includes('CP-184-ABC'))).toBeTruthy()
      expect(planButtons.find(btn => btn.textContent?.includes('CP-183-XYZ'))).toBeTruthy()
    })

    // Click on first plan
    const firstPlanButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('CP-184-ABC'))!
    fireEvent.click(firstPlanButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('CP-184-ABC/nesting'),
        expect.any(Object)
      )
    })

    // Click on second plan
    const secondPlanButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('CP-183-XYZ'))!
    fireEvent.click(secondPlanButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('CP-183-XYZ/nesting'),
        expect.any(Object)
      )
    })
  })
})
