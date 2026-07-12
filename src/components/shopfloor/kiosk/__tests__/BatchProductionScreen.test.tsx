import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BatchProductionScreen } from '../BatchProductionScreen'
import type { Batch, OperatorSession } from '../../../../types/shopfloor'

describe('BatchProductionScreen', () => {
  const mockBatch: Batch = {
    batchId: 'BATCH-2026-001',
    pieceCount: 24,
    material: 'PAL 18mm Fehér',
  }

  const mockSession: OperatorSession = {
    sessionId: 'session-123',
    operatorId: 'op-001',
    operatorName: 'Nagy József',
    operatorPin: '1234',
    workstationId: 'ws-001',
    workstationName: 'Szabász gép #1',
    loginTime: new Date().toISOString(),
  }

  // Removed fake timers - using real timers for better async handling

  it('renders production screen', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('Gyártás alatt')).toBeInTheDocument()
    expect(screen.getByText(/Batch BATCH-2026/)).toBeInTheDocument()
    expect(screen.getByText('Eltelt idő')).toBeInTheDocument()
  })

  it('timer increments every second', async () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('00:00:00')).toBeInTheDocument()

    // Wait for 2 seconds and check timer updated
    await waitFor(
      () => {
        const timerText = screen.getByText(/00:00:0[1-2]/)
        expect(timerText).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('allows adjusting produced pieces', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    const minusButtons = screen.getAllByText('-')
    const plusButtons = screen.getAllByText('+')

    // Produced pieces is 24 initially
    expect(screen.getByText('24')).toBeInTheDocument()

    // Increment
    fireEvent.click(plusButtons[0])
    expect(screen.getByText('25')).toBeInTheDocument()

    // Decrement
    fireEvent.click(minusButtons[0])
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('allows adjusting waste pieces', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    const plusButtons = screen.getAllByText('+')

    // Waste pieces is 0 initially
    const wasteCounts = screen.getAllByText('0')
    expect(wasteCounts.length).toBeGreaterThan(0)

    // Increment waste
    fireEvent.click(plusButtons[1])

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onComplete when complete button is clicked', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response)
    )
    globalThis.fetch = mockFetch

    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    const completeButton = screen.getByText('Gyártás befejezése')
    fireEvent.click(completeButton)

    await waitFor(
      () => {
        expect(onComplete).toHaveBeenCalledTimes(1)
      },
      { timeout: 1000 }
    )
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <BatchProductionScreen
        batch={mockBatch}
        session={mockSession}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByText('Mégse'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
