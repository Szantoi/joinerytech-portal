import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvoicePanel } from '../InvoicePanel'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test' } },
  })),
}))

afterEach(() => { vi.unstubAllGlobals() })

function mockFetch503() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

describe('InvoicePanel', () => {
  it('renders heading', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => expect(screen.getByText('Szállítói számlák')).toBeTruthy())
  })

  it('renders table headers', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => expect(screen.getByText('Számlaszám')).toBeTruthy())
    expect(screen.getByText('Szállító')).toBeTruthy()
  })

  it('renders fallback invoices', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => expect(screen.getByText('SZ-2026-0441')).toBeTruthy())
  })

  it('shows invoice statuses', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => expect(screen.getByText('Egyeztetett')).toBeTruthy())
    expect(screen.getByText('Eltérés')).toBeTruthy()
  })

  it('shows Számla rögzítése button', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => expect(screen.getByText('Számla rögzítése')).toBeTruthy())
  })

  it('clicking Számla rögzítése opens record drawer', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => screen.getByText('Számla rögzítése'))
    fireEvent.click(screen.getByText('Számla rögzítése'))
    await waitFor(() => expect(screen.getByText('Számlaszám *')).toBeTruthy())
  })

  it('clicking invoice row opens detail SlideOver', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => screen.getByText('SZ-2026-0441'))
    fireEvent.click(screen.getByText('SZ-2026-0441'))
    await waitFor(() => expect(screen.getByText('Tételsorok — Three-Way Match')).toBeTruthy())
  })

  it('detail SlideOver shows Exception warning for Exception invoice', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => screen.getByText('SZ-2026-0440'))
    fireEvent.click(screen.getByText('SZ-2026-0440'))
    await waitFor(() => expect(screen.getByText(/Three-Way Match eltérést talált/)).toBeTruthy())
  })

  it('three-way match shows OK pill', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => screen.getByText('SZ-2026-0441'))
    fireEvent.click(screen.getByText('SZ-2026-0441'))
    await waitFor(() => expect(screen.getAllByText('OK').length).toBeGreaterThan(0))
  })

  it('record drawer shows Sor hozzáadása button', async () => {
    mockFetch503()
    render(<InvoicePanel />)
    await waitFor(() => screen.getByText('Számla rögzítése'))
    fireEvent.click(screen.getByText('Számla rögzítése'))
    await waitFor(() => expect(screen.getByText('Sor hozzáadása')).toBeTruthy())
  })
})
