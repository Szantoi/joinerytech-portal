import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar', () => {
  it('renders with default props', () => {
    const { container } = render(<ProgressBar value={50} />)
    const bar = container.querySelector('.rounded-full > .rounded-full') as HTMLElement
    expect(bar.style.width).toBe('50%')
  })

  it('clamps at 100%', () => {
    const { container } = render(<ProgressBar value={150} max={100} />)
    const bar = container.querySelector('.rounded-full > .rounded-full') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })

  it('clamps at 0%', () => {
    const { container } = render(<ProgressBar value={-10} />)
    const bar = container.querySelector('.rounded-full > .rounded-full') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })

  it('applies custom tone', () => {
    const { container } = render(<ProgressBar value={50} tone="rose" />)
    const bar = container.querySelector('.rounded-full > .rounded-full') as HTMLElement
    expect(bar.className).toContain('bg-rose-500')
  })
})
