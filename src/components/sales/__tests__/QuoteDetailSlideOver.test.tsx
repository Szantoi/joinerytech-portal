import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QuoteDetailSlideOver } from '../QuoteDetailSlideOver'
import { getMockQuoteDetail } from '../../../data/data-sales-detail'

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

// Q-2426-057 is a real ID in QUOTES_FALLBACK (status: draft → Draft)
const REAL_QUOTE_ID = 'Q-2426-057'

function renderSlideOver(quoteId = REAL_QUOTE_ID, open = true) {
  return render(
    <QuoteDetailSlideOver open={open} quoteId={quoteId} onClose={vi.fn()} />
  )
}

describe('QuoteDetailSlideOver', () => {
  it('renders quote number from mock fallback', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText(REAL_QUOTE_ID)).toBeTruthy())
  })

  it('renders customer name as subtitle', async () => {
    mockFetchError()
    renderSlideOver()
    const mock = getMockQuoteDetail(REAL_QUOTE_ID)
    await waitFor(() => expect(screen.getByText(mock.customerName)).toBeTruthy())
  })

  it('renders line items from mock data', async () => {
    mockFetchError()
    renderSlideOver()
    const mock = getMockQuoteDetail(REAL_QUOTE_ID)
    await waitFor(() => {
      expect(screen.getByText(mock.lines[0].description)).toBeTruthy()
    })
  })

  it('shows Tételek section heading', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Tételek')).toBeTruthy())
  })

  it('shows Bruttó summary row', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bruttó')).toBeTruthy())
  })

  it('shows Draft actions for Draft quote', async () => {
    mockFetchError()
    // Q-2426-057 has status draft → Draft
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Akciók')).toBeTruthy())
    expect(screen.getByText(/Kiküldés/)).toBeTruthy()
  })

  it('shows Bezárás footer button', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bezárás')).toBeTruthy())
  })

  it('does not render when open=false', () => {
    mockFetchError()
    renderSlideOver(REAL_QUOTE_ID, false)
    expect(screen.queryByText('Tételek')).toBeNull()
  })
})
