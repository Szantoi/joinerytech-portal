import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrioritySlider } from '../PrioritySlider'

describe('PrioritySlider', () => {
  it('renders with initial value', () => {
    render(
      <PrioritySlider
        value={3}
        max={10}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Priority:/)).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('calls onChange when slider moved', () => {
    const onChange = vi.fn()
    render(
      <PrioritySlider
        value={5}
        max={10}
        onChange={onChange}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '7' } })

    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('respects maxPriority limit for machine_operator', () => {
    render(
      <PrioritySlider
        value={5}
        max={5}
        onChange={vi.fn()}
      />
    )

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.max).toBe('5')
  })

  it('respects maxPriority limit for production_manager', () => {
    render(
      <PrioritySlider
        value={7}
        max={10}
        onChange={vi.fn()}
      />
    )

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.max).toBe('10')
  })

  it('disabled state works', () => {
    const onChange = vi.fn()
    render(
      <PrioritySlider
        value={3}
        max={10}
        onChange={onChange}
        disabled={true}
      />
    )

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.disabled).toBe(true)
  })

  it('displays min and max labels', () => {
    render(
      <PrioritySlider
        value={5}
        max={10}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })
})
