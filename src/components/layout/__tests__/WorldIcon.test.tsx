import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WorldIcon } from '../WorldIcon'

describe('WorldIcon', () => {
  const names = ['factory', 'briefcase', 'ruler', 'box', 'wrench', 'settings']

  names.forEach((name) => {
    it(`renders ${name} icon`, () => {
      const { container } = render(<WorldIcon name={name} />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  it('falls back to box for unknown name', () => {
    const { container } = render(<WorldIcon name="unknown" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('applies custom size', () => {
    const { container } = render(<WorldIcon name="factory" size={60} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('60')
  })
})
