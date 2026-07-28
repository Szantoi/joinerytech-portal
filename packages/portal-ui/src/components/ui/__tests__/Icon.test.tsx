import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Icon } from '../Icon'

describe('Icon', () => {
  it('renders dashboard icon', () => {
    const { container } = render(<Icon name="dashboard" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders with custom size', () => {
    const { container } = render(<Icon name="orders" size={24} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
  })

  it('renders with custom className', () => {
    const { container } = render(<Icon name="settings" className="text-red-500" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('text-red-500')).toBe(true)
  })

  it('returns null for unknown icon', () => {
    const { container } = render(<Icon name="nonexistent" />)
    expect(container.innerHTML).toBe('')
  })

  const iconNames = [
    'dashboard', 'orders', 'production', 'inventory', 'procurement',
    'analytics', 'settings', 'search', 'bell', 'plus', 'filter',
    'chevron', 'down', 'up', 'check', 'x', 'alert', 'user', 'logout',
    'workflow', 'chat', 'send', 'sparkle', 'cut', 'layers', 'cpu',
    'more', 'box', 'ruler', 'wrench', 'briefcase', 'bolt',
  ]

  iconNames.forEach((name) => {
    it(`renders ${name} icon without crashing`, () => {
      const { container } = render(<Icon name={name} />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })
})
