import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchCard } from '../BatchCard'
import type { Batch } from '../../../types/scheduling.types'

const mockBatch: Batch = {
  id: 'batch-1',
  name: 'Frame Assembly',
  materialType: 'Oak',
  quantity: 50,
  priority: 3,
  status: 'Unassigned',
  estimatedMinutes: 120,
}

describe('BatchCard', () => {
  it('renders batch information', () => {
    render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={vi.fn()}
        maxPriority={10}
      />
    )

    expect(screen.getByText('Frame Assembly')).toBeTruthy()
    expect(screen.getByText('Material: Oak')).toBeTruthy()
    expect(screen.getByText('Quantity: 50')).toBeTruthy()
    expect(screen.getByText(/Priority:/)).toBeTruthy()
  })

  it('calls onPriorityChange when slider updated', () => {
    const onPriorityChange = vi.fn()
    render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={onPriorityChange}
        maxPriority={10}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '7' } })

    expect(onPriorityChange).toHaveBeenCalledWith('batch-1', 7)
  })

  it('drag events fire correctly', () => {
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()

    const { container } = render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={vi.fn()}
        maxPriority={10}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    )

    const draggableDiv = container.querySelector('[draggable="true"]')
    expect(draggableDiv).toBeTruthy()

    if (draggableDiv) {
      fireEvent.dragStart(draggableDiv, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move',
        },
      })
      expect(onDragStart).toHaveBeenCalledWith(mockBatch)

      fireEvent.dragEnd(draggableDiv)
      expect(onDragEnd).toHaveBeenCalled()
    }
  })

  it('read-only mode disables drag and slider', () => {
    const { container } = render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={vi.fn()}
        maxPriority={10}
        readOnly={true}
      />
    )

    const draggableDiv = container.querySelector('[draggable="true"]')
    expect(draggableDiv).toBeFalsy()

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.disabled).toBe(true)
  })

  it('displays estimated time', () => {
    render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={vi.fn()}
        maxPriority={10}
      />
    )

    expect(screen.getByText('Est. time: 120 min')).toBeTruthy()
  })

  it('respects maxPriority from RBAC', () => {
    render(
      <BatchCard
        batch={mockBatch}
        onPriorityChange={vi.fn()}
        maxPriority={5}
      />
    )

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.max).toBe('5')
  })
})
