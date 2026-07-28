import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { ToastProvider } from '../Toast'
import { useToast } from '../toastContext'

/** Small trigger surface so tests can enqueue toasts through the public API. */
function Trigger() {
  const { addToast } = useToast()
  return (
    <>
      <button onClick={() => addToast('Mentve', 'success')}>ok</button>
      <button onClick={() => addToast('Hiba történt', 'error')}>err</button>
      <button onClick={() => addToast('Rövid', 'info', 100)}>short</button>
    </>
  )
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the live regions in the DOM even with zero toasts (null-render fix)', () => {
    renderWithProvider()
    expect(screen.getByRole('status')).toBeInTheDocument() // polite region
    expect(screen.getByRole('alert')).toBeInTheDocument() // assertive region
  })

  it('routes success/info toasts into the polite region', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('ok'))
    expect(within(screen.getByRole('status')).getByText('Mentve')).toBeTruthy()
    expect(within(screen.getByRole('alert')).queryByText('Mentve')).toBeNull()
  })

  it('routes errors into the assertive alert region and never auto-dismisses them', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('err'))
    expect(within(screen.getByRole('alert')).getByText('Hiba történt')).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText('Hiba történt')).toBeInTheDocument()

    // manual close works
    fireEvent.click(screen.getByRole('button', { name: 'Értesítés bezárása' }))
    expect(screen.queryByText('Hiba történt')).toBeNull()
  })

  it('auto-dismisses non-error toasts after the duration', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('ok'))
    expect(screen.getByText('Mentve')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5_001))
    expect(screen.queryByText('Mentve')).toBeNull()
  })

  it('enforces the 5 s minimum duration (WCAG 2.2.1)', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('short')) // requested 100 ms
    act(() => vi.advanceTimersByTime(3_000))
    expect(screen.getByText('Rövid')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2_001))
    expect(screen.queryByText('Rövid')).toBeNull()
  })

  it('pauses the dismiss timer while focus is inside the toast', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('ok'))
    const closeBtn = screen.getByRole('button', { name: 'Értesítés bezárása' })

    act(() => vi.advanceTimersByTime(3_000))
    act(() => closeBtn.focus()) // pause
    act(() => vi.advanceTimersByTime(10_000))
    expect(screen.getByText('Mentve')).toBeInTheDocument() // still visible while focused

    act(() => closeBtn.blur()) // resume with ~2 s remaining
    act(() => vi.advanceTimersByTime(2_001))
    expect(screen.queryByText('Mentve')).toBeNull()
  })

  it('closes the focused toast on Escape', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('ok'))
    const closeBtn = screen.getByRole('button', { name: 'Értesítés bezárása' })
    fireEvent.keyDown(closeBtn, { key: 'Escape' })
    expect(screen.queryByText('Mentve')).toBeNull()
  })

  it('close button has an explicit accessible name', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('ok'))
    expect(screen.getByRole('button', { name: 'Értesítés bezárása' })).toBeTruthy()
  })
})
