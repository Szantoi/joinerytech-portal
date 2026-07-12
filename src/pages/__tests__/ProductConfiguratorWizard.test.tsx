import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductConfiguratorWizard } from '../ProductConfiguratorWizard'
import { useConfiguratorStore } from '../../stores/configuratorStore'

// Mock router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProductConfiguratorWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useConfiguratorStore.getState().resetConfig()
  })

  it('renders step 1 (product type selection) initially', () => {
    renderWithProviders(<ProductConfiguratorWizard />)

    expect(screen.getByText('Select Product Type')).toBeTruthy()
    expect(screen.getByText('Standard beltéri ajtó')).toBeTruthy()
  })

  it('shows stepper with 4 steps', () => {
    renderWithProviders(<ProductConfiguratorWizard />)

    expect(screen.getByText('Product Type')).toBeTruthy()
    expect(screen.getByText('Dimensions')).toBeTruthy()
    expect(screen.getByText('Materials')).toBeTruthy()
    expect(screen.getByText('Fittings')).toBeTruthy()
  })

  it('shows validation error when Next clicked without product selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductConfiguratorWizard />)

    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Please select a product type')).toBeTruthy()
    })
  })

  it('advances to step 2 after selecting product type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductConfiguratorWizard />)

    // Select a product type
    const standardDoor = screen.getByText('Standard beltéri ajtó')
    await user.click(standardDoor)

    // Click Next
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Enter Dimensions')).toBeTruthy()
    })
  })

  it('allows navigation back to previous step', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductConfiguratorWizard />)

    // Select product and go to step 2
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Enter Dimensions')).toBeTruthy()
    })

    // Click Back
    const backButton = screen.getByText('Back')
    await user.click(backButton)

    await waitFor(() => {
      expect(screen.getByText('Select Product Type')).toBeTruthy()
    })
  })

  it('validates dimension inputs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductConfiguratorWizard />)

    // Go to step 2
    await user.click(screen.getByText('Standard beltéri ajtó'))
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Enter Dimensions')).toBeTruthy()
    })

    // Enter invalid width (too low)
    const widthInput = screen.getByLabelText('Width (mm)')
    await user.clear(widthInput)
    await user.type(widthInput, '500')

    // Try to proceed
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText(/Minimum width/)).toBeTruthy()
    })
  })

  it('disables Back button on first step', () => {
    renderWithProviders(<ProductConfiguratorWizard />)

    const backButton = screen.getByText('Back') as HTMLButtonElement
    expect(backButton.disabled).toBe(true)
  })
})
