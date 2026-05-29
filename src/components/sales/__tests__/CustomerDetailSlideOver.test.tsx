import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerDetailSlideOver } from '../CustomerDetailSlideOver'
import { getMockCustomerDetail } from '../../../data/data-sales-detail'

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

// C-001 is a real ID: "Bognár Bútor Kft." (Active)
const REAL_CUSTOMER_ID = 'C-001'

function renderSlideOver(customerId = REAL_CUSTOMER_ID, open = true) {
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
  it('renders customer name from mock fallback', async () => {
    mockFetchError()
    renderSlideOver()
    const mock = getMockCustomerDetail(REAL_CUSTOMER_ID)
    await waitFor(() => expect(screen.getAllByText(mock.name).length).toBeGreaterThan(0))
  })

  it('renders Kapcsolattartó section', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Kapcsolattartó')).toBeTruthy())
  })

  it('shows contact name', async () => {
    mockFetchError()
    renderSlideOver()
    const mock = getMockCustomerDetail(REAL_CUSTOMER_ID)
    await waitFor(() => expect(screen.getAllByText(mock.contactName).length).toBeGreaterThan(0))
  })

  it('shows Szerkesztés button for contact edit', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Szerkesztés')).toBeTruthy())
  })

  it('entering edit mode shows Mentés button', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => screen.getByText('Szerkesztés'))
    fireEvent.click(screen.getByText('Szerkesztés'))
    await waitFor(() => expect(screen.getByText('Mentés')).toBeTruthy())
  })

  it('shows Utolsó ajánlatok section', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Utolsó ajánlatok')).toBeTruthy())
  })

  it('shows Bezárás footer button', async () => {
    mockFetchError()
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Bezárás')).toBeTruthy())
  })

  it('does not render when open=false', () => {
    mockFetchError()
    renderSlideOver(REAL_CUSTOMER_ID, false)
    expect(screen.queryByText('Kapcsolattartó')).toBeNull()
  })

  it('shows Deaktiválás action for Active customer', async () => {
    mockFetchError()
    // C-001 is Active type → should show Deaktiválás
    renderSlideOver()
    await waitFor(() => expect(screen.getByText('Deaktiválás')).toBeTruthy())
  })
})
