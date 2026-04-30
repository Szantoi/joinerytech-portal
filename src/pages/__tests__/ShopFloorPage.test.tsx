import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShopFloorPage } from '../ShopFloorPage'

describe('ShopFloorPage', () => {
  it('renders PIN stage by default', () => {
    render(<ShopFloorPage />)
    expect(screen.getByText('Shopfloor')).toBeTruthy()
  })

  it('renders numpad digits', () => {
    render(<ShopFloorPage />)
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('9')).toBeTruthy()
    expect(screen.getByText('C')).toBeTruthy()
  })

  it('shows error for wrong PIN', () => {
    vi.useFakeTimers()
    render(<ShopFloorPage />)
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    expect(screen.getByText(/Hib/)).toBeTruthy()
    vi.useRealTimers()
  })

  it('has dark background', () => {
    const { container } = render(<ShopFloorPage />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('bg-[#0a0f1a]')
  })

  it('renders kiosk label', () => {
    render(<ShopFloorPage />)
    expect(screen.getByText(/Kiosk/)).toBeTruthy()
  })
})
