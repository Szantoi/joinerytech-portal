import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OperatorLoginScreen } from '../OperatorLoginScreen'

// Mock hooks
vi.mock('../../../../hooks/useWorkstations', () => ({
  useWorkstations: () => ({
    workstations: [
      { id: 'ws-001', name: 'Szabász gép #1', type: 'cutting' },
      { id: 'ws-002', name: 'Szabász gép #2', type: 'cutting' },
    ],
    loading: false,
    error: null,
  }),
}))

describe('OperatorLoginScreen', () => {
  it('renders the login form', () => {
    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    expect(screen.getByText('Operátor bejelentkezés')).toBeInTheDocument()
    expect(screen.getByText('Gép kiválasztása')).toBeInTheDocument()
    expect(screen.getByText('PIN kód')).toBeInTheDocument()
  })

  it('allows PIN input', () => {
    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    const button1 = screen.getByText('1')
    const button2 = screen.getByText('2')

    fireEvent.click(button1)
    fireEvent.click(button2)

    // Check that PIN dots are displayed
    const pinDots = document.querySelectorAll('.bg-emerald-500.rounded-full')
    expect(pinDots).toHaveLength(2)
  })

  it('clears PIN on clear button', () => {
    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))

    const pinDots = document.querySelectorAll('.bg-emerald-500.rounded-full')
    expect(pinDots).toHaveLength(2)

    fireEvent.click(screen.getByText('Törlés'))

    const pinDotsAfterClear = document.querySelectorAll('.bg-emerald-500.rounded-full')
    expect(pinDotsAfterClear).toHaveLength(0)
  })

  it('calls onLogin with session when PIN is 1234', async () => {
    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    // Select workstation
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'ws-001' } })

    // Enter PIN 1234
    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByText('4'))

    // Click OK
    fireEvent.click(screen.getByText('OK'))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          operatorName: 'Nagy József',
          workstationId: 'ws-001',
        })
      )
    })
  })

  it('shows error for wrong PIN', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      })
    ) as any

    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'ws-001' } })

    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))

    fireEvent.click(screen.getByText('OK'))

    await waitFor(() => {
      expect(screen.getByText('Hibás PIN vagy gép kiválasztás')).toBeInTheDocument()
    })
  })

  it('disables OK button when PIN is incomplete', () => {
    const onLogin = vi.fn()
    render(<OperatorLoginScreen onLogin={onLogin} />)

    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))

    const okButton = screen.getByText('OK')
    expect(okButton).toBeDisabled()
  })
})
