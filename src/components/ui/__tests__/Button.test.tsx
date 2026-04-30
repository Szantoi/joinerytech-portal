import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrimaryBtn, GhostBtn } from '../Button'

describe('PrimaryBtn', () => {
  it('renders children', () => {
    render(<PrimaryBtn>Mentés</PrimaryBtn>)
    expect(screen.getByText('Mentés')).toBeTruthy()
  })

  it('handles click', () => {
    const fn = vi.fn()
    render(<PrimaryBtn onClick={fn}>Click</PrimaryBtn>)
    fireEvent.click(screen.getByText('Click'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('renders with icon', () => {
    const { container } = render(<PrimaryBtn icon="plus">Add</PrimaryBtn>)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('has teal background', () => {
    const { container } = render(<PrimaryBtn>Test</PrimaryBtn>)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('bg-teal-700')
  })
})

describe('GhostBtn', () => {
  it('renders children', () => {
    render(<GhostBtn>Mégse</GhostBtn>)
    expect(screen.getByText('Mégse')).toBeTruthy()
  })

  it('handles click', () => {
    const fn = vi.fn()
    render(<GhostBtn onClick={fn}>Go</GhostBtn>)
    fireEvent.click(screen.getByText('Go'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('has white background and border', () => {
    const { container } = render(<GhostBtn>Test</GhostBtn>)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('bg-white')
    expect(btn?.className).toContain('border')
  })
})
