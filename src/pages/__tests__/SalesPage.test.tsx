import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SalesWorldPage } from '../SalesPage'

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

const MOCK_CUSTOMERS_RESPONSE = {
  items: [
    {
      id: 'C-001',
      name: 'Teszt Kft.',
      type: 'Active',
      contactName: 'Teszt Elek',
      contactEmail: 'teszt@teszt.hu',
      contactPhone: '+36 1 234 567',
      city: 'Budapest',
      openQuoteCount: 3,
      totalOrderValue: 12_000_000,
      createdAt: '2024-01-01',
    },
  ],
  totalCount: 1,
}

const MOCK_QUOTES_RESPONSE = {
  items: [
    {
      id: 'q-001',
      quoteNumber: 'AJ-2026-0042',
      customerName: 'Teszt Kft.',
      status: 'Sent',
      createdAt: '2026-05-01',
      expiresAt: '2026-05-15',
      lineCount: 5,
      totalValue: 3_500_000,
      ownerName: 'Szabó A.',
    },
    {
      id: 'q-002',
      quoteNumber: 'AJ-2026-0043',
      customerName: 'Másik Kft.',
      status: 'Accepted',
      createdAt: '2026-05-02',
      expiresAt: null,
      lineCount: 2,
      totalValue: 1_200_000,
      ownerName: 'Kovács P.',
    },
    {
      id: 'q-003',
      quoteNumber: 'AJ-2026-0044',
      customerName: 'Harmadik Bt.',
      status: 'Rejected',
      createdAt: '2026-05-03',
      expiresAt: null,
      lineCount: 1,
      totalValue: 500_000,
      ownerName: 'Kovács P.',
    },
  ],
  totalCount: 3,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderSales(screenKey = '') {
  const path = screenKey ? `/w/sales/${screenKey}` : '/w/sales'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/w/sales" element={<SalesWorldPage />} />
        <Route path="/w/sales/:screen" element={<SalesWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function mockFetchError() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

function mockFetchSuccess() {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/customers')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_CUSTOMERS_RESPONSE) })
    }
    if (url.includes('/quotes')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_QUOTES_RESPONSE) })
    }
    return Promise.resolve({ ok: false, status: 404 })
  }))
}

describe('SalesPage', () => {
  // ─── Existing tests (must stay green) ──────────────────────────────────────

  it('renders title', () => {
    renderSales()
    const matches = screen.getAllByText(/rtékesít/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders pipeline stage headers', () => {
    renderSales()
    expect(screen.getByText('Vázlat')).toBeTruthy()
  })

  it('switches to quotes tab — shows Azonosító column', async () => {
    mockFetchError()
    renderSales('quotes')
    await waitFor(() => expect(screen.getByText(/Azonos/)).toBeTruthy())
  })

  it('switches to customers tab — shows search input', async () => {
    mockFetchError()
    renderSales('customers')
    await waitFor(() => expect(screen.getByPlaceholderText('Ügyfél keresése…')).toBeTruthy())
  })

  it('shows rejected filter in quotes', async () => {
    mockFetchError()
    renderSales('quotes')
    await waitFor(() => expect(screen.getAllByText('Elutasítva').length).toBeGreaterThan(0))
  })

  it('shows Új ajánlat button in quotes', async () => {
    mockFetchError()
    renderSales('quotes')
    await waitFor(() => expect(screen.getByText('Új ajánlat')).toBeTruthy())
  })

  it('shows orders screen', () => {
    renderSales('orders')
    expect(screen.getByText('Rendelésszám')).toBeTruthy()
  })

  // ─── SalesCustomers ────────────────────────────────────────────────────────

  it('SalesCustomers: shows loading skeleton while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderSales('customers')
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('SalesCustomers: shows empty state on fetch error', async () => {
    mockFetchError()
    renderSales('customers')
    await waitFor(() => expect(screen.getByText('Nincs találat')).toBeTruthy())
  })

  it('SalesCustomers: shows API data', async () => {
    mockFetchSuccess()
    renderSales('customers')
    await waitFor(() => expect(screen.getByText('Teszt Kft.')).toBeTruthy())
    expect(screen.getByText('Teszt Elek')).toBeTruthy()
  })

  it('SalesCustomers: Új ügyfél opens CreateCustomerSlideOver', async () => {
    mockFetchError()
    renderSales('customers')
    await waitFor(() => expect(screen.getByText('Új ügyfél')).toBeTruthy())
    fireEvent.click(screen.getByText('Új ügyfél'))
    expect(screen.getByText('Létrehozás')).toBeTruthy()
  })

  // ─── SalesQuotes ───────────────────────────────────────────────────────────

  it('SalesQuotes: shows empty table on fetch error', async () => {
    mockFetchError()
    renderSales('quotes')
    await waitFor(() => expect(screen.getByText('Nincs találat')).toBeTruthy())
  })

  it('SalesQuotes: shows API quoteNumber in table', async () => {
    mockFetchSuccess()
    renderSales('quotes')
    await waitFor(() => expect(screen.getByText('AJ-2026-0042')).toBeTruthy())
  })

  it('SalesQuotes: Új ajánlat button is enabled', async () => {
    mockFetchError()
    renderSales('quotes')
    await waitFor(() => expect(screen.getByText('Új ajánlat')).toBeTruthy())
    const btn = screen.getByText('Új ajánlat').closest('button')
    expect(btn?.disabled).toBe(false)
  })

  it('SalesQuotes: status badge shows Elfogadva for Accepted', async () => {
    mockFetchSuccess()
    renderSales('quotes')
    await waitFor(() => expect(screen.getAllByText('Elfogadva').length).toBeGreaterThan(0))
  })

  // ─── SalesDashboard ────────────────────────────────────────────────────────

  it('SalesDashboard: shows Összes ügyfél KPI from API', async () => {
    mockFetchSuccess()
    renderSales()
    await waitFor(() => expect(screen.getByText('Összes ügyfél')).toBeTruthy())
    // totalCount = 1 from mock — find card containing the label
    const kpiCard = screen.getByText('Összes ügyfél').closest('div.p-4')
    expect(kpiCard?.textContent).toContain('1')
  })

  it('SalesDashboard: shows lejáró ajánlatok from API', async () => {
    mockFetchSuccess()
    renderSales()
    await waitFor(() => expect(screen.getByText('Lejáró ajánlatok')).toBeTruthy())
    // The Sent quote from mock should appear
    await waitFor(() => expect(screen.getByText('AJ-2026-0042')).toBeTruthy())
  })

  it('SalesDashboard: konverziós ráta computed correctly', async () => {
    mockFetchSuccess()
    renderSales()
    // Accepted=1, Sent=1, Rejected=1 → 1/(1+1+1) = 33%
    await waitFor(() => expect(screen.getByText('33%')).toBeTruthy())
  })

  // ─── CreateCustomerSlideOver ───────────────────────────────────────────────

  it('CreateCustomerSlideOver: shows validation errors on empty submit', async () => {
    mockFetchError()
    renderSales('customers')
    await waitFor(() => expect(screen.getByText('Új ügyfél')).toBeTruthy())
    fireEvent.click(screen.getByText('Új ügyfél'))
    // submit without filling required fields
    fireEvent.click(screen.getByText('Létrehozás'))
    await waitFor(() => expect(screen.getAllByText('Kötelező mező').length).toBeGreaterThan(0))
  })

  // ─── SalesOrders ──────────────────────────────────────────────────────────

  it('SalesOrders: shows info sáv about Gyártás module', () => {
    renderSales('orders')
    expect(screen.getByText(/megrendelések a Gyártás/)).toBeTruthy()
  })
})
