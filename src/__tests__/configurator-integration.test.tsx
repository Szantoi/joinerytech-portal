import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ProductConfiguratorWizard } from '../pages/ProductConfiguratorWizard'
import { BOMPreviewPage } from '../pages/BOMPreviewPage'
import { WorkOrderSummary } from '../pages/WorkOrderSummary'
import { useConfiguratorStore } from '../stores/configuratorStore'
import {
  mockConfigureResponse,
  mockWorkOrderResponse,
  mockBOMItems
} from '../mocks/configuratorMocks'

// Setup MSW server
const handlers = [
  http.post('/api/products/configure', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return HttpResponse.json(mockConfigureResponse)
  }),

  http.get('/api/products/preview/:configId', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return HttpResponse.json({
      configId: 'cfg_2026_042',
      bomItems: mockBOMItems,
      estimatedPrice: 45000
    })
  }),

  http.post('/api/work-orders', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return HttpResponse.json(mockWorkOrderResponse)
  })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => useConfiguratorStore.getState().resetConfig())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/configurator" element={<ProductConfiguratorWizard />} />
          <Route path="/configurator/preview/:configId" element={<BOMPreviewPage />} />
          <Route path="/work-orders/new/:configId" element={<WorkOrderSummary />} />
          <Route path="*" element={children} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Configurator Integration Flow with MSW', () => {
  it('completes full configurator workflow: wizard → BOM → work order', async () => {
    window.history.pushState({}, '', '/configurator')
    const user = userEvent.setup()

    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Step 1: Select product type
    expect(screen.getByText('Select Product Type')).toBeInTheDocument()
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: Enter dimensions (default values are valid)
    await waitFor(() => {
      expect(screen.getByText('Enter Dimensions')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 3: Select materials
    await waitFor(() => {
      expect(screen.getByText('Select Materials')).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/core material/i), 'chipboard_18mm')
    await user.selectOptions(screen.getByLabelText(/veneer/i), 'oak_natural')
    await user.selectOptions(screen.getByLabelText(/edge material/i), 'pvc_oak')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 4: Select fittings
    await waitFor(() => {
      expect(screen.getByText('Select Fittings')).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/hinge type/i), 'concealed_3d')
    await user.selectOptions(screen.getByLabelText(/handle type/i), 'lever_chrome')
    await user.selectOptions(screen.getByLabelText(/lock type/i), 'cylinder_lock')

    // Submit configuration
    await user.click(screen.getByRole('button', { name: /submit configuration/i }))

    // Should navigate to BOM preview page
    await waitFor(
      () => {
        expect(screen.getByText('Bill of Materials Preview')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify BOM items are displayed
    expect(screen.getByText('Forgácslap 18mm')).toBeInTheDocument()
    expect(screen.getByText('Tölgy furnér natúr')).toBeInTheDocument()
    expect(screen.getByText('Rejtett 3D zsanér')).toBeInTheDocument()
  })

  it('navigates from BOM preview to work order form', async () => {
    window.history.pushState({}, '', '/configurator/preview/cfg_2026_042')
    const user = userEvent.setup()

    render(<BOMPreviewPage />, { wrapper: createWrapper() })

    // Wait for BOM to load
    await waitFor(() => {
      expect(screen.getByText('Bill of Materials Preview')).toBeInTheDocument()
    })

    // Click Create Work Order button
    const createButton = screen.getByRole('button', { name: /create work order/i })
    await user.click(createButton)

    // Should navigate to work order form
    await waitFor(() => {
      expect(screen.getByText('Work Order Summary')).toBeInTheDocument()
    })
  })

  it('submits work order and displays result with MSW mock data', async () => {
    window.history.pushState({}, '', '/work-orders/new/cfg_2026_042')
    const user = userEvent.setup()

    render(<WorkOrderSummary />, { wrapper: createWrapper() })

    // Wait for config preview to load
    await waitFor(() => {
      expect(screen.getByText('Configuration Summary')).toBeInTheDocument()
    })

    // Fill work order form
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '5')
    await user.type(screen.getByLabelText(/delivery date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/customer reference/i), 'PO-2026-042')
    await user.type(screen.getByLabelText(/notes/i), 'Urgent order for Doorstar')

    // Submit
    await user.click(screen.getByRole('button', { name: /generate work order/i }))

    // Wait for work order result
    await waitFor(
      () => {
        expect(screen.getByText('Work Order Created')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify work order details from mock
    expect(screen.getByText('wo_2026_042')).toBeInTheDocument()
    expect(screen.getByText(/31,500/)).toBeInTheDocument()
    expect(screen.getByText(/18,000/)).toBeInTheDocument()
    expect(screen.getByText(/49,500/)).toBeInTheDocument()
    expect(screen.getByText('2026-07-08')).toBeInTheDocument()
    expect(screen.getByText('2026-07-14')).toBeInTheDocument()
  })

  it('handles API errors gracefully with MSW error responses', async () => {
    server.use(
      http.post('/api/products/configure', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    window.history.pushState({}, '', '/configurator')
    const user = userEvent.setup()

    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Complete all steps
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByText('Enter Dimensions')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByText('Select Materials')).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/core material/i), 'chipboard_18mm')
    await user.selectOptions(screen.getByLabelText(/veneer/i), 'oak_natural')
    await user.selectOptions(screen.getByLabelText(/edge material/i), 'pvc_oak')
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByText('Select Fittings')).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/hinge type/i), 'concealed_3d')
    await user.selectOptions(screen.getByLabelText(/handle type/i), 'lever_chrome')
    await user.selectOptions(screen.getByLabelText(/lock type/i), 'cylinder_lock')

    // Submit should fail
    await user.click(screen.getByRole('button', { name: /submit configuration/i }))

    // Should display error
    await waitFor(() => {
      expect(screen.getByText(/failed to submit configuration/i)).toBeInTheDocument()
    })
  })

  it('displays loading states during API calls', async () => {
    server.use(
      http.post('/api/products/configure', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json(mockConfigureResponse)
      })
    )

    window.history.pushState({}, '', '/configurator')
    const user = userEvent.setup()

    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Complete all steps quickly
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Enter Dimensions'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Select Materials'))
    await user.selectOptions(screen.getByLabelText(/core material/i), 'chipboard_18mm')
    await user.selectOptions(screen.getByLabelText(/veneer/i), 'oak_natural')
    await user.selectOptions(screen.getByLabelText(/edge material/i), 'pvc_oak')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Select Fittings'))
    await user.selectOptions(screen.getByLabelText(/hinge type/i), 'concealed_3d')
    await user.selectOptions(screen.getByLabelText(/handle type/i), 'lever_chrome')
    await user.selectOptions(screen.getByLabelText(/lock type/i), 'cylinder_lock')

    // Click submit
    await user.click(screen.getByRole('button', { name: /submit configuration/i }))

    // Should show loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument()

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByText('Bill of Materials Preview')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
