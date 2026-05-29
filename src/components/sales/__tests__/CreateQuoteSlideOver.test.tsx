import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateQuoteSlideOver } from '../CreateQuoteSlideOver'

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

function renderSlideOver(props = {}) {
  return render(
    <CreateQuoteSlideOver
      open={true}
      onClose={vi.fn()}
      onQuoteCreated={vi.fn()}
      {...props}
    />
  )
}

describe('CreateQuoteSlideOver', () => {
  it('renders title', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    expect(screen.getByText('Új ajánlat létrehozása')).toBeTruthy()
  })

  it('renders customer search field', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    expect(screen.getByPlaceholderText('Ügyfél keresése...')).toBeTruthy()
  })

  it('shows validation error when submitting without customer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    fireEvent.click(screen.getByText('Ajánlat létrehozása →'))
    await waitFor(() => expect(screen.getByText('Kérjük válasszon ügyfelet')).toBeTruthy())
  })

  it('shows date validation when no date provided', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    fireEvent.click(screen.getByText('Ajánlat létrehozása →'))
    await waitFor(() => expect(screen.getByText('Kötelező mező')).toBeTruthy())
  })

  it('shows customer results from fallback when typing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    const input = screen.getByPlaceholderText('Ügyfél keresése...')
    fireEvent.change(input, { target: { value: 'Kft' } })
    fireEvent.focus(input)
    await waitFor(() => {
      // CUSTOMERS_FALLBACK should contain at least one "Kft" entry
      const results = screen.queryAllByText(/Kft/i)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  it('shows Mégse button', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderSlideOver()
    expect(screen.getByText('Mégse')).toBeTruthy()
  })

  it('does not render when open=false', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    render(
      <CreateQuoteSlideOver open={false} onClose={vi.fn()} onQuoteCreated={vi.fn()} />
    )
    expect(screen.queryByText('Új ajánlat létrehozása')).toBeNull()
  })
})
