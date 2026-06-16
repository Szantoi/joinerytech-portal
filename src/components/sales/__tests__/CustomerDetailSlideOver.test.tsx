import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerDetailSlideOver } from '../CustomerDetailSlideOver'
import type { CustomerDetailDto } from '../../../data/data-sales-detail'

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

const MOCK_CUSTOMER: CustomerDetailDto = {
  id: 'C-001',
  name: 'Bognár Bútor Kft.',
  type: 'Active',
  contactName: 'Bognár Attila',
  contactEmail: 'bognar@bognarbutor.hu',
  contactPhone: '+36 30 123 4567',
  city: 'Győr',
  openQuoteCount: 2,
  totalOrderValue: 8_500_000,
  createdAt: '2024-03-01',
  billingAddress: { street: 'Ipari út 12.', city: 'Győr', zip: '9021', country: 'HU' },
}

function mockFetchError() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
}

function mockFetchSuccess() {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/quotes')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [], totalCount: 0 }) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_CUSTOMER) })
  }))
}

function renderSlideOver(customerId = 'C-001', open = true) {
  return render(
    <CustomerDetailSlideOver
      open={open}
      customerId={customerId}
      onClose={vi.fn()}
      onOpenQuote={vi.fn()}
    />
  )
}

describe('CustomerDetailSlideOver', () => {
  it('renders customer name from API', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getAllByText('Bognár Bútor Kft.').length).toBeGreaterThan(0))
  })

  it('renders Kapcsolattartó section', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Kapcsolattartó')).toBeTruthy())
  })

  it('shows contact name', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getAllByText('Bognár Attila').length).toBeGreaterThan(0))
  })

  it('shows Szerkesztés button for contact edit', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Szerkesztés')).toBeTruthy())
  })

  it('entering edit mode shows Mentés button', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => screen.getByText('Szerkesztés'))
    fireEvent.click(screen.getByText('Szerkesztés'))
    await waitFor(() => expect(screen.getByText('Mentés')).toBeTruthy())
  })

  it('shows Utolsó ajánlatok section', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Utolsó ajánlatok')).toBeTruthy())
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
    renderSlideOver('C-001', false)
    expect(screen.queryByText('Kapcsolattartó')).toBeNull()
  })

  it('shows Deaktiválás action for Active customer', async () => {
    mockFetchSuccess()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Deaktiválás')).toBeTruthy())
  })
})
