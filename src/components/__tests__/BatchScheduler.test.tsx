import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BatchScheduler, type Batch } from '../BatchScheduler'

// Mock useApi hook
vi.mock('../../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    data: [
      { id: 'u1', username: 'janos.nagy', email: 'janos.nagy@example.com', firstName: 'János', lastName: 'Nagy', roles: ['machine_operator'] },
      { id: 'u2', username: 'anna.kovacs', email: 'anna.kovacs@example.com', firstName: 'Anna', lastName: 'Kovács', roles: ['machine_operator'] },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(() => Promise.resolve()),
    isLoading: false,
    error: null,
  })),
  API_BASE: {
    identity: '/identity',
    cutting: '/cutting',
  },
}))

// Mock useAuth hook
vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({ token: 'mock-token' })),
}))

const mockBatches: Batch[] = [
  { id: 'b1', planId: 'p1', planName: 'CP-2026-001-A', status: 'pending', partsCount: 45 },
  { id: 'b2', planId: 'p2', planName: 'CP-2026-002-B', status: 'pending', partsCount: 32 },
]

describe('BatchScheduler', () => {
  it('renders batch scheduler title and date', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    expect(screen.getByText('Batch ütemezés')).toBeTruthy()
    expect(screen.getByText(/2026-06-17/)).toBeTruthy()
  })

  it('renders pending batches count', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    expect(screen.getByText(/2 hozzárendelésre váró batch/)).toBeTruthy()
  })

  it('renders batch cards for pending batches', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    expect(screen.getByText('CP-2026-001-A')).toBeTruthy()
    expect(screen.getByText('CP-2026-002-B')).toBeTruthy()
    expect(screen.getByText('45 alkatrész · ID: B1')).toBeTruthy()
  })

  it('renders empty state when no pending batches', () => {
    render(<BatchScheduler date="2026-06-17" batches={[]} />)
    expect(screen.getByText('Nincs hozzárendelésre váró batch ezen a napon')).toBeTruthy()
  })

  it('renders operator autocomplete field', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const autocompleteInputs = screen.getAllByPlaceholderText(/Keresés név vagy felhasználónév alapján/)
    expect(autocompleteInputs.length).toBeGreaterThan(0)
  })

  it('renders machine selector dropdown', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const machineSelects = screen.getAllByText('Válasszon gépet...')
    expect(machineSelects.length).toBeGreaterThan(0)
  })

  it('renders priority slider with default value 5', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const priorityLabels = screen.getAllByText(/Prioritás: 5/)
    expect(priorityLabels.length).toBeGreaterThan(0)
  })

  it('renders start time picker', () => {
    const { container } = render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const timeInputs = container.querySelectorAll('input[type="datetime-local"]')
    expect(timeInputs.length).toBeGreaterThan(0)
  })

  it('disables submit button when fields are not filled', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const submitButtons = screen.getAllByRole('button', { name: /Hozzárendelés/ })
    submitButtons.forEach(button => {
      expect(button).toHaveProperty('disabled', true)
    })
  })

  it('updates priority value when slider changes', () => {
    render(<BatchScheduler date="2026-06-17" batches={mockBatches} />)
    const sliders = screen.getAllByRole('slider')
    const firstSlider = sliders[0]

    fireEvent.change(firstSlider, { target: { value: '8' } })

    waitFor(() => {
      expect(screen.getByText(/Prioritás: 8/)).toBeTruthy()
    })
  })
})
