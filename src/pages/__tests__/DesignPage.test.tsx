import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DesignWorldPage } from '../DesignPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock',
    user: { profile: { name: 'Test User' } },
  })),
}))

afterEach(() => { vi.unstubAllGlobals() })

function mockFetch503() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

function mockFetchApiTemplates(templates: object[]) {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/api/modules/templates/') && url.match(/\/templates\/[^/]+$/)) {
      // detail endpoint
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true,
          parameters: { width_mm: 900, height_mm: 2100, thickness_mm: 40 },
        }),
      })
    }
    if (url.includes('/api/modules/templates')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(templates) })
    }
    return Promise.resolve({ ok: false, status: 503 })
  }))
}

function renderDesign(screen = '') {
  const path = screen ? `/w/design/${screen}` : '/w/design'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/w/design" element={<DesignWorldPage />} />
        <Route path="/w/design/:screen" element={<DesignWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DesignPage', () => {
  it('renders title', () => {
    renderDesign()
    const matches = screen.getAllByText(/Tervez/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders dashboard KPI cards', () => {
    renderDesign('dash')
    expect(screen.getByText('Aktív sablonok')).toBeTruthy()
  })

  it('renders popular templates in dashboard', () => {
    renderDesign('dash')
    expect(screen.getByText(/Polcos szekr/)).toBeTruthy()
  })

  it('renders active projects in dashboard', () => {
    renderDesign('dash')
    expect(screen.getAllByText(/Doorstar/).length).toBeGreaterThan(0)
  })

  it('navigates to editor screen', () => {
    renderDesign('editor')
    const matches = screen.getAllByText(/Alkatr/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows CNC preview in advanced mode', () => {
    renderDesign('editor')
    fireEvent.click(screen.getByText(/Haladó/))
    expect(screen.getByText(/CNC deriválás preview/)).toBeTruthy()
  })

  it('shows constraint formula in advanced mode', () => {
    renderDesign('editor')
    fireEvent.click(screen.getByText(/Haladó/))
    expect(screen.getByText(/polc szélesség/)).toBeTruthy()
  })

  it('navigates to generate screen', () => {
    renderDesign('generate')
    expect(screen.getByText('Sablon választás')).toBeTruthy()
  })

  it('shows order assignment card in step 1', () => {
    renderDesign('generate')
    fireEvent.click(screen.getByText('Tovább →'))
    expect(screen.getByText('Hozzárendelés rendeléshez')).toBeTruthy()
  })

  it('shows Egyedi hozzáadása button in step 2', () => {
    renderDesign('generate')
    fireEvent.click(screen.getByText('Tovább →'))
    fireEvent.click(screen.getByText('Áttekintés →'))
    expect(screen.getByText('Egyedi hozzáadása')).toBeTruthy()
  })

  it('navigates to catalog screen', () => {
    renderDesign('catalog')
    expect(screen.getByText('Korpusz lemez')).toBeTruthy()
  })

  it('catalog has cats before flex-1 and Új tétel at end', () => {
    renderDesign('catalog')
    expect(screen.getByText('Élzáró')).toBeTruthy()
    expect(screen.getByText('Új tétel')).toBeTruthy()
  })

  // ─── FE-044: API template picker & ApiParamWizard ─────────────────────────

  it('editor shows mock templates when API unavailable (fallback)', async () => {
    mockFetch503()
    renderDesign('editor')
    await waitFor(() => expect(screen.getByText('Polcos szekrény (2 polcos)')).toBeTruthy())
  })

  it('editor shows API templates in picker when API returns list', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => expect(screen.getByText('API Ajtó sablon')).toBeTruthy())
  })

  it('editor shows API badge next to API template', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => expect(screen.getByText('API')).toBeTruthy())
  })

  it('clicking API template shows ApiParamWizard with loaded params', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => expect(screen.getByText('Paraméterek')).toBeTruthy())
  })

  it('ApiParamWizard shows param keys from API response', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => expect(screen.getByText('width_mm')).toBeTruthy())
    expect(screen.getByText('height_mm')).toBeTruthy()
    expect(screen.getByText('thickness_mm')).toBeTruthy()
  })

  it('ApiParamWizard shows Számítás indítása button', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => expect(screen.getByText('Számítás indítása')).toBeTruthy())
  })

  it('ApiParamWizard shows error state when detail fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      // detail URL has an ID segment after /templates/
      if (/\/api\/modules\/templates\/[^?]+$/.test(url)) {
        return Promise.resolve({ ok: false, status: 503 })
      }
      if (url.includes('/api/modules/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
          ]),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    }))
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => expect(screen.getByText(/nem töltődött be/)).toBeTruthy())
  })

  it('switching back to mock template hides ApiParamWizard', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => screen.getByText('Számítás indítása'))
    fireEvent.click(screen.getByText('Polcos szekrény (2 polcos)'))
    await waitFor(() => expect(screen.queryByText('Számítás indítása')).toBeNull())
    expect(screen.getByText('Szabad változók')).toBeTruthy()
  })

  it('ApiParamWizard shows template name and tradeType in header', async () => {
    mockFetchApiTemplates([
      { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
    ])
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => expect(screen.getAllByText('API Ajtó sablon').length).toBeGreaterThan(0))
    expect(screen.getByText(/Ajtó · v2 · Aktív/)).toBeTruthy()
  })

  it('ApiParamWizard calculate button triggers POST and shows result', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/calculate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parts: [{ name: 'Ajtólap', width: 900, height: 2100, thickness: 40, quantity: 1 }] }),
        })
      }
      if (url.match(/\/templates\/[^/]+$/) && !url.includes('cutting')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true,
            parameters: { width_mm: 900 },
          }),
        })
      }
      if (url.includes('/api/modules/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'API-01', name: 'API Ajtó sablon', tradeType: 'Ajtó', version: 2, isActive: true },
          ]),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderDesign('editor')
    await waitFor(() => screen.getByText('API Ajtó sablon'))
    fireEvent.click(screen.getByText('API Ajtó sablon'))
    await waitFor(() => screen.getByText('Számítás indítása'))
    fireEvent.click(screen.getByText('Számítás indítása'))
    await waitFor(() => expect(screen.getByText('Számítás eredménye')).toBeTruthy())
    expect(screen.getByText('Ajtólap')).toBeTruthy()
  })

  // ─── TOP 1: Design→Cutting Workflow tests ─────────────────────────────────

  it('MaterialsGenerator submit button calls POST /cutting/api/sheets', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/sheets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sheetId: 'SH-001', cuttingPlanId: 'CP-184-ABC' }),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(
      <MemoryRouter initialEntries={['/w/design/generate']}>
        <Routes>
          <Route path="/w/design/:screen" element={<DesignWorldPage />} />
          <Route path="/w/production/:tab" element={<div>ProductionPage Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Navigate to step 2
    await waitFor(() => screen.getByText('Tovább →'))
    fireEvent.click(screen.getByText('Tovább →'))
    await waitFor(() => screen.getByText('Áttekintés →'))
    fireEvent.click(screen.getByText('Áttekintés →'))

    // Click submit button
    await waitFor(() => screen.getByText('Terv létrehozása és tovább a Gyártásba'))
    fireEvent.click(screen.getByText('Terv létrehozása és tovább a Gyártásba'))

    // Verify API was called with correct payload
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/sheets'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      )
    })
  })

  it('MaterialsGenerator navigates to ProductionPage with highlightPlanId on success', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/sheets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sheetId: 'SH-001', cuttingPlanId: 'CP-184-XYZ' }),
        })
      }
      return Promise.resolve({ ok: false, status: 503 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/w/design/generate']}>
        <Routes>
          <Route path="/w/design/:screen" element={<DesignWorldPage />} />
          <Route path="/w/production/:tab" element={<div>ProductionPage Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Navigate to step 2
    await waitFor(() => screen.getByText('Tovább →'))
    fireEvent.click(screen.getByText('Tovább →'))
    await waitFor(() => screen.getByText('Áttekintés →'))
    fireEvent.click(screen.getByText('Áttekintés →'))

    // Click submit button
    await waitFor(() => screen.getByText('Terv létrehozása és tovább a Gyártásba'))
    fireEvent.click(screen.getByText('Terv létrehozása és tovább a Gyártásba'))

    // Verify navigation to ProductionPage
    await waitFor(() => {
      expect(screen.getByText('ProductionPage Mock')).toBeTruthy()
    })
  })

  it('MaterialsGenerator shows loading state during submission', async () => {
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => { resolveFetch = resolve })

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/sheets')) {
        return fetchPromise
      }
      return Promise.resolve({ ok: false, status: 503 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/w/design/generate']}>
        <Routes>
          <Route path="/w/design/:screen" element={<DesignWorldPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Navigate to step 2
    await waitFor(() => screen.getByText('Tovább →'))
    fireEvent.click(screen.getByText('Tovább →'))
    await waitFor(() => screen.getByText('Áttekintés →'))
    fireEvent.click(screen.getByText('Áttekintés →'))

    // Click submit button
    await waitFor(() => screen.getByText('Terv létrehozása és tovább a Gyártásba'))
    const submitButton = screen.getByText('Terv létrehozása és tovább a Gyártásba')
    fireEvent.click(submitButton)

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Küldés...')).toBeTruthy()
    })

    // Resolve fetch
    resolveFetch!({
      ok: true,
      json: () => Promise.resolve({ sheetId: 'SH-001', cuttingPlanId: 'CP-184-TEST' }),
    })
  })
})
