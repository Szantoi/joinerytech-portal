import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QuoteDetailSlideOver } from '../QuoteDetailSlideOver'
import type { QuoteDetailDto } from '../../../data/data-sales-detail'

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

const MOCK_QUOTE: QuoteDetailDto = {
  id: 'Q-2426-057',
  quoteNumber: 'Q-2426-057',
  customerName: 'Bognár Bútor Kft.',
  customerId: 'C-001',
  status: 'Draft',
  createdAt: '2026-05-01',
  expiresAt: '2026-06-30',
  lineCount: 2,
  totalValue: 238760,
  ownerName: 'Kovács P.',
  lines: [
    { id: 'l1', description: 'Belső ajtó 90cm', quantity: 2, unitPrice: 85_000, lineTotal: 170_000 },
    { id: 'l2', description: 'Tok szett 90cm',  quantity: 1, unitPrice: 18_000, lineTotal: 18_000 },
  ],
  subtotal: 188_000,
  vatAmount: 50_760,
  total: 238_760,
}

function mockFetchError() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

function mockFetchSuccess() {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_QUOTE) })
  ))
}

function renderSlideOver(quoteId = 'Q-2426-057', open = true) {
  return render(
    <QuoteDetailSlideOver open={open} quoteId={quoteId} onClose={vi.fn()} />
  )
}

describe('QuoteDetailSlideOver', () => {
  it('renders quote number from API', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Q-2426-057')).toBeTruthy())
  })

  it('renders customer name as subtitle', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bognár Bútor Kft.')).toBeTruthy())
  })

  it('renders line items from API data', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => {
      expect(screen.getByText('Belső ajtó 90cm')).toBeTruthy()
    })
  })

  it('shows Tételek section heading', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Tételek')).toBeTruthy())
  })

  it('shows Bruttó summary row', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bruttó')).toBeTruthy())
  })

  it('shows Draft actions for Draft quote', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Akciók')).toBeTruthy())
    expect(screen.getByText(/Kiküldés/)).toBeTruthy()
  })

  it('shows loading spinner while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderSlideOver()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('shows Bezárás footer button', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bezárás')).toBeTruthy())
  })

  it('does not render when open=false', () => {
    mockFetchError()
    renderSlideOver('Q-2426-057', false)
    expect(screen.queryByText('Tételek')).toBeNull()
  })
})
