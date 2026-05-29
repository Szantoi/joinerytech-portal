import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PriceListPanel } from '../PriceListPanel'

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

describe('PriceListPanel', () => {
  it('renders heading', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getByText('Árlisták')).toBeTruthy())
  })

  it('renders active pricelist count', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getByText(/aktív árlista/)).toBeTruthy())
  })

  it('renders supplier names', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getAllByText('Egger Faipari Kft.').length).toBeGreaterThan(0))
  })

  it('renders Aktív and Lejárt status pills', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0))
    expect(screen.getByText('Lejárt')).toBeTruthy()
  })

  it('renders best price indicator', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getAllByText('★ Legjobb').length).toBeGreaterThan(0))
  })

  it('shows Új árlista button', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => expect(screen.getByText('Új árlista')).toBeTruthy())
  })

  it('clicking Új árlista opens drawer', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => screen.getByText('Új árlista'))
    fireEvent.click(screen.getByText('Új árlista'))
    await waitFor(() => expect(screen.getByText('Érvényesség kezdete *')).toBeTruthy())
  })

  it('clicking pricelist row opens detail SlideOver', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => screen.getAllByText(/AL-2026/))
    const rows = screen.getAllByText(/AL-2026/)
    fireEvent.click(rows[0])
    await waitFor(() => expect(screen.getByText(/Tételek/)).toBeTruthy())
  })

  it('Draft pricelist detail shows Aktiválás button', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => screen.getByText('Vázlat'))
    fireEvent.click(screen.getByText('Vázlat').closest('[class*="cursor-pointer"]')! as Element)
    await waitFor(() => {
      const btns = screen.queryAllByText(/Árlista aktiválása/)
      expect(btns.length).toBeGreaterThan(0)
    })
  })

  it('new pricelist drawer shows supplier dropdown with fallback options', async () => {
    mockFetch503()
    render(<PriceListPanel />)
    await waitFor(() => screen.getByText('Új árlista'))
    fireEvent.click(screen.getByText('Új árlista'))
    await waitFor(() => expect(screen.getByText('Válasszon szállítót…')).toBeTruthy())
  })
})
