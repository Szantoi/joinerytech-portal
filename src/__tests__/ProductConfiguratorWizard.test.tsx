import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ProductConfiguratorWizard } from '../pages/ProductConfiguratorWizard'
import { useConfiguratorStore } from '../stores/configuratorStore'

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
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('ProductConfiguratorWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useConfiguratorStore.getState().resetConfig()
  })

  it('renders step 1 - product type selection', () => {
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    expect(screen.getByText('Select Product Type')).toBeInTheDocument()
    expect(screen.getByText('Standard beltéri ajtó')).toBeInTheDocument()
    expect(screen.getByText('Prémium furnér ajtó')).toBeInTheDocument()
  })

  it('validates product type selection before proceeding to step 2', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(screen.getByText('Please select a product type')).toBeInTheDocument()
  })

  it('allows navigation to step 2 after selecting product type', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Select a product type
    const standardDoor = screen.getByText('Standard beltéri ajtó')
    await user.click(standardDoor)

    // Click Next
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    // Should be on step 2
    expect(screen.getByText('Enter Dimensions')).toBeInTheDocument()
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/thickness/i)).toBeInTheDocument()
  })

  it('validates dimension ranges on step 2', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 2
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Enter invalid dimensions
    const widthInput = screen.getByLabelText(/width/i)
    await user.clear(widthInput)
    await user.type(widthInput, '500') // Below minimum

    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByText(/minimum width/i)).toBeInTheDocument()
    })
  })

  it('allows navigation to step 3 after entering valid dimensions', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 2
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Default dimensions should be valid, just click next
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Should be on step 3
    expect(screen.getByText('Select Materials')).toBeInTheDocument()
  })

  it('validates materials selection on step 3', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 3
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Try to proceed without selecting materials
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByText('Core material is required')).toBeInTheDocument()
    })
  })

  it('allows navigation to step 4 after selecting materials', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 3
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Select materials
    const coreSelect = screen.getByLabelText(/core material/i)
    const veneerSelect = screen.getByLabelText(/veneer/i)
    const edgeSelect = screen.getByLabelText(/edge material/i)

    await user.selectOptions(coreSelect, 'chipboard_18mm')
    await user.selectOptions(veneerSelect, 'oak_natural')
    await user.selectOptions(edgeSelect, 'pvc_oak')

    await user.click(screen.getByRole('button', { name: /next/i }))

    // Should be on step 4
    expect(screen.getByText('Select Fittings')).toBeInTheDocument()
  })

  it('validates fittings selection on step 4', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 4
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Select materials
    await user.selectOptions(screen.getByLabelText(/core material/i), 'chipboard_18mm')
    await user.selectOptions(screen.getByLabelText(/veneer/i), 'oak_natural')
    await user.selectOptions(screen.getByLabelText(/edge material/i), 'pvc_oak')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Try to submit without selecting fittings
    await user.click(screen.getByRole('button', { name: /submit configuration/i }))

    await waitFor(() => {
      expect(screen.getByText('Hinge type is required')).toBeInTheDocument()
    })
  })

  it('allows back navigation', async () => {
    const user = userEvent.setup()
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Navigate to step 2
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Click back
    await user.click(screen.getByRole('button', { name: /back/i }))

    // Should be back on step 1
    expect(screen.getByText('Select Product Type')).toBeInTheDocument()
  })

  it('displays stepper progress correctly', () => {
    render(<ProductConfiguratorWizard />, { wrapper: createWrapper() })

    // Check stepper labels
    expect(screen.getByText('Product Type')).toBeInTheDocument()
    expect(screen.getByText('Dimensions')).toBeInTheDocument()
    expect(screen.getByText('Materials')).toBeInTheDocument()
    expect(screen.getByText('Fittings')).toBeInTheDocument()
  })
})
