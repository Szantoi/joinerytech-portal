import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { WorkOrderSummary } from '../pages/WorkOrderSummary'
import type { BOMPreview, WorkOrderResponse } from '../types/configurator.types'

const mockBOMPreview: BOMPreview = {
  configId: 'cfg_2026_042',
  bomItems: [
    {
      itemType: 'material',
      name: 'Forgácslap 18mm',
      quantity: 1,
      unit: 'db',
      unitPrice: 8500,
      totalPrice: 8500,
      supplier: 'Kronospan Hungary',
      inStock: true
    }
  ],
  estimatedPrice: 45000
}

const mockWorkOrderResponse: WorkOrderResponse = {
  workOrderId: 'wo_2026_042',
  pdfUrl: '/mock/work-order-sheet.pdf',
  bomItems: mockBOMPreview.bomItems,
  totalMaterialCost: 31500,
  estimatedLabor: 18000,
  totalCost: 49500,
  scheduledStart: '2026-07-08',
  estimatedCompletion: '2026-07-14'
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/work-orders/new/:configId" element={children} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('WorkOrderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn() as any
  })

  it('renders work order form with config summary', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBOMPreview
    })

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Work Order Summary')).toBeInTheDocument()
    })

    expect(screen.getByText('Configuration Summary')).toBeInTheDocument()
    expect(screen.getByText(/cfg_2026_042/i)).toBeInTheDocument()
  })

  it('validates form fields before submission', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBOMPreview
    })

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /generate work order/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/customer reference is required/i)).toBeInTheDocument()
    })
  })

  it('submits work order with valid form data', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMPreview
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkOrderResponse
      })

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Fill form
    await user.type(screen.getByLabelText(/quantity/i), '5')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.type(screen.getByLabelText(/notes/i), 'Urgent order')

    // Submit
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/work-orders',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    // Should download PDF
    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith('/mock/work-order-sheet.pdf', '_blank')
    })

    windowOpenSpy.mockRestore()
  })

  it('displays work order result after successful submission', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMPreview
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkOrderResponse
      })

    vi.spyOn(window, 'open').mockImplementation(() => null)

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Fill and submit form
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '1')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    // Wait for result
    await waitFor(() => {
      expect(screen.getByText('Work Order Created')).toBeInTheDocument()
    })

    expect(screen.getByText('wo_2026_042')).toBeInTheDocument()
    expect(screen.getByText(/31,500/)).toBeInTheDocument() // totalMaterialCost
    expect(screen.getByText(/18,000/)).toBeInTheDocument() // estimatedLabor
    expect(screen.getByText(/49,500/)).toBeInTheDocument() // totalCost
  })

  it('displays BOM items table with supplier and stock info', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMPreview
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkOrderResponse
      })

    vi.spyOn(window, 'open').mockImplementation(() => null)

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Submit form
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '1')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    await waitFor(() => {
      expect(screen.getByText('Work Order Created')).toBeInTheDocument()
    })

    // Check BOM table
    expect(screen.getByText('Forgácslap 18mm')).toBeInTheDocument()
    expect(screen.getByText('Kronospan Hungary')).toBeInTheDocument()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })

  it('displays scheduling information', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMPreview
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkOrderResponse
      })

    vi.spyOn(window, 'open').mockImplementation(() => null)

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Submit form
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '1')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    await waitFor(() => {
      expect(screen.getByText('Work Order Created')).toBeInTheDocument()
    })

    expect(screen.getByText(/scheduled start/i)).toBeInTheDocument()
    expect(screen.getByText('2026-07-08')).toBeInTheDocument()
    expect(screen.getByText(/estimated completion/i)).toBeInTheDocument()
    expect(screen.getByText('2026-07-14')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMPreview
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      })

    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')

    const user = userEvent.setup()
    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    // Submit form
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '1')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument()
    })
  })
})
