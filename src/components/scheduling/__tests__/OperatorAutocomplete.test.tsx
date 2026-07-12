import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OperatorAutocomplete } from '../OperatorAutocomplete'
import * as useApiModule from '../../../hooks/useApi'
import type { Operator } from '../../../types/scheduling.types'

const mockOperators: Operator[] = [
  { id: 'op-1', name: 'John Doe', email: 'john@example.com', role: 'machine_operator' },
  { id: 'op-2', name: 'Jane Smith', email: 'jane@example.com', role: 'machine_operator' },
]

describe('OperatorAutocomplete', () => {
  beforeEach(() => {
    vi.spyOn(useApiModule, 'useApi').mockReturnValue({
      data: mockOperators,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders autocomplete input', () => {
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...')
    expect(input).toBeTruthy()
  })

  it('filters operators by name', async () => {
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...')
    fireEvent.change(input, { target: { value: 'John' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy()
      expect(screen.queryByText('Jane Smith')).toBeFalsy()
    })
  })

  it('filters operators by email', async () => {
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...')
    fireEvent.change(input, { target: { value: 'jane@' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy()
      expect(screen.queryByText('John Doe')).toBeFalsy()
    })
  })

  it('calls onOperatorChange when operator selected', async () => {
    const onOperatorChange = vi.fn()
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={onOperatorChange}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'John' } })

    await waitFor(() => {
      const button = screen.getByText('John Doe').closest('button')
      if (button) fireEvent.mouseDown(button)
    })

    await waitFor(() => {
      expect(onOperatorChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'op-1' }))
    })
  })

  it('displays empty state when no results', async () => {
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'NonExistent' } })

    await waitFor(() => {
      expect(screen.getByText('No operators found')).toBeTruthy()
    })
  })

  it('displays selected operator', () => {
    render(
      <OperatorAutocomplete
        selectedOperator={mockOperators[0]}
        onOperatorChange={vi.fn()}
      />
    )

    expect(screen.getByText('John Doe')).toBeTruthy()
    expect(screen.getByText('john@example.com')).toBeTruthy()
  })

  it('disabled state prevents interaction', () => {
    render(
      <OperatorAutocomplete
        selectedOperator={null}
        onOperatorChange={vi.fn()}
        disabled={true}
      />
    )

    const input = screen.getByPlaceholderText('Select operator...') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
