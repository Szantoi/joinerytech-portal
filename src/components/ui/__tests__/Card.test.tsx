import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('applies default classes', () => {
    const { container } = render(<Card>Content</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('rounded-xl')
    expect(div.className).toContain('bg-white')
  })

  it('applies interactive classes when interactive', () => {
    const { container } = render(<Card interactive>Click me</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('cursor-pointer')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="p-4">Styled</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('p-4')
  })
})
