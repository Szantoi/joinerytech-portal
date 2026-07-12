import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchQueueCard } from '../BatchQueueCard'
import type { QueuedBatch } from '../../../../types/shopfloor'

describe('BatchQueueCard', () => {
  const mockBatch: QueuedBatch = {
    batchId: 'BATCH-2026-001',
    queuePosition: 1,
    status: 'Queued',
    pieceCount: 24,
    material: 'PAL 18mm Fehér',
    estimatedDuration: '1h 20m',
  }

  it('renders batch information', () => {
    const onStart = vi.fn()
    render(<BatchQueueCard batch={mockBatch} canStart={false} onStart={onStart} />)

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText(/Batch BATCH-2026/)).toBeInTheDocument()
    expect(screen.getByText('24 darab')).toBeInTheDocument()
    expect(screen.getByText(/Becsült idő: 1h 20m/)).toBeInTheDocument()
  })

  it('shows start button when canStart is true', () => {
    const onStart = vi.fn()
    render(<BatchQueueCard batch={mockBatch} canStart={true} onStart={onStart} />)

    expect(screen.getByText('Gyártás indítása')).toBeInTheDocument()
  })

  it('does not show start button when canStart is false', () => {
    const onStart = vi.fn()
    render(<BatchQueueCard batch={mockBatch} canStart={false} onStart={onStart} />)

    expect(screen.queryByText('Gyártás indítása')).not.toBeInTheDocument()
  })

  it('calls onStart when start button is clicked', () => {
    const onStart = vi.fn()
    render(<BatchQueueCard batch={mockBatch} canStart={true} onStart={onStart} />)

    fireEvent.click(screen.getByText('Gyártás indítása'))

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('displays correct status label', () => {
    const onStart = vi.fn()
    const inProgressBatch = { ...mockBatch, status: 'InProgress' as const }

    const { rerender } = render(
      <BatchQueueCard batch={inProgressBatch} canStart={false} onStart={onStart} />
    )

    expect(screen.getByText('Gyártás alatt')).toBeInTheDocument()

    const completedBatch = { ...mockBatch, status: 'Completed' as const }
    rerender(<BatchQueueCard batch={completedBatch} canStart={false} onStart={onStart} />)

    expect(screen.getByText('Kész')).toBeInTheDocument()
  })
})
