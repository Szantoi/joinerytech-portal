import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkOrderSummary } from '../WorkOrderSummary'

// Mock data
const mockConfigPreview = {
  configId: 'cfg_2026_042',
  bomItems: [
    {
      itemType: 'material' as const,
      name: 'Forgácslap 18mm',
      quantity: 1,
      unit: 'db',
      unitPrice: 8500,
      totalPrice: 8500
    }
  ],
  estimatedPrice: 45000
}

function renderWithProviders(ui: React.ReactElement, { route = '/work-orders/new/cfg_2026_042' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/work-orders/new/:configId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Mock fetch
globalThis.fetch = vi.fn() as any

describe('WorkOrderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/products/preview/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfigPreview)
        })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders work order summary title', async () => {
    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Work Order Summary')).toBeTruthy()
    })
  })

  it('displays configuration summary', async () => {
    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Configuration Summary')).toBeTruthy()
      expect(screen.getByText(/cfg_2026_042/)).toBeTruthy()
    })
  })

  it('displays order details form', async () => {
    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeTruthy()
      expect(screen.getByLabelText('Quantity')).toBeTruthy()
      expect(screen.getByLabelText('Delivery Date')).toBeTruthy()
      expect(screen.getByLabelText('Customer Reference')).toBeTruthy()
    })
  })

  it('shows validation errors on submit with invalid data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeTruthy()
    })

    const submitButton = screen.getByText('Generate Work Order')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeTruthy()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockWorkOrderResponse = {
      workOrderId: 'wo_2026_042',
      pdfUrl: '/mock/work-order-sheet.pdf',
      bomItems: mockConfigPreview.bomItems,
      totalMaterialCost: 31500,
      estimatedLabor: 18000,
      totalCost: 49500,
      scheduledStart: '2026-07-08',
      estimatedCompletion: '2026-07-14'
    }

    ;(globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/products/preview/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfigPreview)
        })
      }
      if (url.includes('/api/work-orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWorkOrderResponse)
        })
      }
      return Promise.reject(new Error('Not found'))
    })

    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeTruthy()
    })

    // Fill form
    const quantityInput = screen.getByLabelText('Quantity')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')

    const deliveryDateInput = screen.getByLabelText('Delivery Date')
    await user.type(deliveryDateInput, '2026-07-15')

    const customerRefInput = screen.getByLabelText('Customer Reference')
    await user.type(customerRefInput, 'PO-2026-042')

    // Submit
    const submitButton = screen.getByText('Generate Work Order')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Work Order Created')).toBeTruthy()
      expect(screen.getByText('wo_2026_042')).toBeTruthy()
    })

    expect(mockWindowOpen).toHaveBeenCalledWith('/mock/work-order-sheet.pdf', '_blank')

    mockWindowOpen.mockRestore()
  })

  it('displays BOM items table after work order creation', async () => {
    const user = userEvent.setup()
    const mockWorkOrderResponse = {
      workOrderId: 'wo_2026_042',
      pdfUrl: '/mock/work-order-sheet.pdf',
      bomItems: mockConfigPreview.bomItems,
      totalMaterialCost: 8500,
      estimatedLabor: 36500,
      totalCost: 45000,
      scheduledStart: '2026-07-08',
      estimatedCompletion: '2026-07-14'
    }

    ;(globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/products/preview/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfigPreview)
        })
      }
      if (url.includes('/api/work-orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWorkOrderResponse)
        })
      }
      return Promise.reject(new Error('Not found'))
    })

    vi.spyOn(window, 'open').mockImplementation(() => null)

    renderWithProviders(<WorkOrderSummary />)

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeTruthy()
    })

    // Fill and submit form
    await user.type(screen.getByLabelText('Delivery Date'), '2026-07-15')
    await user.type(screen.getByLabelText('Customer Reference'), 'PO-2026-042')
    await user.click(screen.getByText('Generate Work Order'))

    await waitFor(() => {
      expect(screen.getByText('Forgácslap 18mm')).toBeTruthy()
      expect(screen.getByText('2026-07-08')).toBeTruthy()
      expect(screen.getByText('2026-07-14')).toBeTruthy()
    })
  })
})
