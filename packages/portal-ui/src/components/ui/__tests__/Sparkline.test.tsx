import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from '../Sparkline'

describe('Sparkline', () => {
  it('renders SVG with data', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5, 4]} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('path')).toBeTruthy()
    expect(container.querySelector('circle')).toBeTruthy()
  })

  it('returns null for empty data', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with custom dimensions', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={200} height={50} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('200')
  })

  it('renders fill area when fill is set', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} fill="blue" />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(2) // area + line
  })

  it('renders responsive mode', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} responsive />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('100%')
  })
})
