import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders initials', () => {
    render(<Avatar id="NJ" />)
    expect(screen.getByText('NJ')).toBeTruthy()
  })

  it('shows title with full name', () => {
    const { container } = render(<Avatar id="NJ" />)
    const div = container.firstElementChild as HTMLElement
    expect(div.title).toBe('Nagy János')
  })

  it('respects custom size', () => {
    const { container } = render(<Avatar id="TK" size={32} />)
    const div = container.firstElementChild as HTMLElement
    expect(div.style.width).toBe('32px')
    expect(div.style.height).toBe('32px')
  })

  it('falls back to id for unknown initials', () => {
    render(<Avatar id="XX" />)
    expect(screen.getByText('XX')).toBeTruthy()
  })
})
