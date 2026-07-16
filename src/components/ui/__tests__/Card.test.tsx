import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('applies default classes (szemantikus tokenek — DS-DARKMODE)', () => {
    const { container } = render(<Card>Content</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('rounded-xl')
    // token-smoke: kártya = surface-card + border token, nem nyers paletta
    expect(div.className).toContain('bg-surface-card')
    expect(div.className).toContain('border-line')
    expect(div.className).not.toContain('bg-white')
    expect(div.className).not.toContain('stone-')
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
