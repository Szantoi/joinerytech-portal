import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SchedulingPage } from '../SchedulingPage'
import * as useApiModule from '../../hooks/useApi'
import * as useAuthModule from '../../auth'
import type { Batch, Machine, Operator, Execution } from '../../types/scheduling.types'

// Mock data
const mockOperators: Operator[] = [
  { id: 'op-1', name: 'John Operator', email: 'john@example.com', role: 'machine_operator' },
]

const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    name: 'Frame Assembly',
    materialType: 'Oak',
    quantity: 50,
    priority: 3,
    status: 'Unassigned',
    estimatedMinutes: 120,
  },
]

const mockMachines: Machine[] = [
  { id: 'machine-1', name: 'Saw Station', type: 'Cutting', capacity: 100, status: 'Available' },
]

const mockExecutions: Execution[] = []

describe('SchedulingPage', () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: 'mock-token',
      tenantId: 'tenant-1',
      roles: ['machine_operator'],
      enabledModules: ['production'],
      facilityId: 'facility-1',
      facilityName: 'Main Facility',
    })

    vi.spyOn(useApiModule, 'useApi').mockImplementation((url: string | null) => ({
      data:
        url?.includes('/batches') ? mockBatches
        : url?.includes('/machines') ? mockMachines
        : url?.includes('/executions') ? mockExecutions
        : null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }))

    vi.spyOn(useApiModule, 'useMutation').mockReturnValue({
      mutate: vi.fn().mockResolvedValue({ executionId: 'exec-1', status: 'Planned' }),
      isLoading: false,
      error: null,
    })
  })

  it('renders scheduling page with title', () => {
    render(<SchedulingPage />)
    expect(screen.getByText('Machine & Operator Scheduling')).toBeTruthy()
  })

  it('displays operator autocomplete', () => {
    render(<SchedulingPage />)
    expect(screen.getByPlaceholderText('Select operator...')).toBeTruthy()
  })

  it('displays unassigned batches', () => {
    render(<SchedulingPage />)
    expect(screen.getByText('Frame Assembly')).toBeTruthy()
  })

  it('displays machine drop zones', () => {
    render(<SchedulingPage />)
    expect(screen.getAllByText('Saw Station')[0]).toBeTruthy()
  })

  it('displays execution timeline', () => {
    render(<SchedulingPage />)
    expect(screen.getByText('Execution Timeline')).toBeTruthy()
  })

  it('displays batch count in header', () => {
    render(<SchedulingPage />)
    expect(screen.getByText('Unassigned Batches (1)')).toBeTruthy()
  })

  it('shows RBAC message for machine_operator', () => {
    render(<SchedulingPage />)

    // machine_operator should see maxPriority=5
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.max).toBe('5')
  })

  it('shows RBAC message when user is viewer', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: 'mock-token',
      tenantId: 'tenant-1',
      roles: ['viewer'],
      enabledModules: ['production'],
      facilityId: 'facility-1',
      facilityName: 'Main Facility',
    })

    render(<SchedulingPage />)

    expect(screen.getByText(/View-only mode/i)).toBeTruthy()
  })

  it('displays batch count in header', () => {
    render(<SchedulingPage />)
    expect(screen.getByText('Unassigned Batches (1)')).toBeTruthy()
  })
})
