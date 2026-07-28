import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Wordmark, GrainMark } from '../Wordmark'

describe('Wordmark', () => {
  it('renders with dark tone', () => {
    const { container } = render(<Wordmark tone="dark" />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.textContent).toContain('joinery')
    expect(container.textContent).toContain('tech')
  })

  it('renders with light tone', () => {
    const { container } = render(<Wordmark tone="light" />)
    expect(container.textContent).toContain('joinery')
  })

  it('renders with custom size', () => {
    const { container } = render(<Wordmark size={20} />)
    const div = container.firstElementChild as HTMLElement
    expect(div.style.fontSize).toBe('20px')
  })
})

describe('GrainMark', () => {
  it('renders SVG with dark tone', () => {
    const { container } = render(<GrainMark tone="dark" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders SVG with light tone', () => {
    const { container } = render(<GrainMark tone="light" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
