import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SupplierSlideOver } from '../SupplierSlideOver'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    token: 'mock',
    user: { profile: { name: 'Test User' } },
  })),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

const REAL_SUPPLIER = 'Egger Faipari Kft.'

function renderSlideOver(supplierName = REAL_SUPPLIER, open = true) {
  return render(
    <SupplierSlideOver open={open} supplierName={supplierName} onClose={vi.fn()} />
  )
}

describe('SupplierSlideOver', () => {
  it('renders supplier name in title', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => expect(screen.getAllByText(REAL_SUPPLIER).length).toBeGreaterThan(0))
  })

  it('renders 3 KPI cards', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => {
      expect(screen.getByText('Értékelés')).toBeTruthy()
      expect(screen.getByText('Megbízhatóság')).toBeTruthy()
      expect(screen.getByText('Lead time')).toBeTruthy()
    })
  })

  it('renders 7-hetes trend section', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('7-hetes megbízhatóság trend')).toBeTruthy())
  })

  it('renders Kapcsolat section', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Kapcsolat')).toBeTruthy())
  })

  it('renders Aktív megrendelések section', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => expect(screen.getByText(/Aktív megrendelések/)).toBeTruthy())
  })

  it('renders Bezárás button', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bezárás')).toBeTruthy())
  })

  it('shows star rating value', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    await waitFor(() => {
      const stars = screen.getAllByText(/★/)
      expect(stars.length).toBeGreaterThan(0)
    })
  })

  it('does not render when open=false', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver(REAL_SUPPLIER, false)
    expect(screen.queryByText('7-hetes megbízhatóság trend')).toBeNull()
  })
})
