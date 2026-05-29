import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PODetailSlideOver } from '../PODetailSlideOver'
import { getMockPODetail } from '../../../data/data-procurement'

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

function mockFetchError() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

// PO-2426-091 is a real ID from ACTIVE_PO mock
const REAL_ORDER_ID = 'PO-2426-091'

function renderSlideOver(orderId = REAL_ORDER_ID, open = true) {
  return render(
    <PODetailSlideOver open={open} orderId={orderId} onClose={vi.fn()} />
  )
}

describe('PODetailSlideOver', () => {
  it('renders order ID in title', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText(REAL_ORDER_ID)).toBeTruthy())
  })

  it('renders supplier name from mock fallback', async () => {
    mockFetchError()
    renderSlideOver()
    const mock = getMockPODetail(REAL_ORDER_ID)
    await waitFor(() => expect(screen.getAllByText(mock.supplierName).length).toBeGreaterThan(0))
  })

  it('renders Tételek section', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Tételek')).toBeTruthy())
  })

  it('renders FSM állapot timeline', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Állapot')).toBeTruthy())
    expect(screen.getByText('Leadva')).toBeTruthy()
    expect(screen.getByText('Megérkezett')).toBeTruthy()
  })

  it('renders Nettó összesen in footer', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Nettó összesen')).toBeTruthy())
  })

  it('shows Szállítás rögzítése button when not Delivered', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText(/Szállítás rögzítése/)).toBeTruthy())
  })

  it('clicking Szállítás rögzítése opens inline delivery form', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => screen.getByText(/Szállítás rögzítése/))
    fireEvent.click(screen.getByText(/Szállítás rögzítése/))
    await waitFor(() => expect(screen.getByText('Szállítás megerősítése')).toBeTruthy())
  })

  it('shows Bezárás footer button', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bezárás')).toBeTruthy())
  })

  it('does not render when open=false', () => {
    mockFetchError()
    renderSlideOver(REAL_ORDER_ID, false)
    expect(screen.queryByText('Tételek')).toBeNull()
  })
})
