import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ShopFloorPage } from '../ShopFloorPage'

function renderShopFloor() {
  return render(
    <MemoryRouter initialEntries={['/w/shopfloor']}>
      <ShopFloorPage />
    </MemoryRouter>
  )
}

describe('ShopFloorPage', () => {
  it('renders PIN stage by default', () => {
    renderShopFloor()
    expect(screen.getByText('Bejelentkezés')).toBeTruthy()
  })

  it('renders numpad digits', () => {
    renderShopFloor()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('9')).toBeTruthy()
    expect(screen.getByText('Töröl')).toBeTruthy()
  })

  it('shows error for wrong PIN', () => {
    vi.useFakeTimers()
    renderShopFloor()
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    fireEvent.click(screen.getByText('9'))
    expect(screen.getByText(/Hib/)).toBeTruthy()
    vi.useRealTimers()
  })

  it('has dark background', () => {
    const { container } = renderShopFloor()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('bg-stone-900')
  })

  it('renders kiosk label', () => {
    renderShopFloor()
    expect(screen.getByText(/Kiosk/)).toBeTruthy()
  })

  it('renders Vissza a portálra button', () => {
    renderShopFloor()
    expect(screen.getByText('Vissza a portálra')).toBeTruthy()
  })
})
