import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ShopWorldPage } from '../ShopPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderShop(path = '') {
  const url = path ? `/w/shop/${path}` : '/w/shop'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/shop" element={<ShopWorldPage />} />
        <Route path="/w/shop/:screen" element={<ShopWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ShopPage', () => {
  it('renders shop dashboard', () => {
    renderShop()
    expect(screen.getAllByText('Bolt').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderShop()
    expect(screen.getAllByText(/Nyitott rendelések|Havi forgalom|Kosárban/).length).toBeGreaterThan(0)
  })

  it('dashboard shows recent orders', () => {
    renderShop()
    expect(screen.getAllByText(/SHO-2426/).length).toBeGreaterThan(0)
  })

  it('renders catalog screen', () => {
    renderShop('catalog')
    expect(screen.getAllByText(/Katalógus|Termék katalógus/).length).toBeGreaterThan(0)
  })

  it('catalog shows products', () => {
    renderShop('catalog')
    expect(screen.getAllByText(/Konyhai alsó|Gardrób|Beltéri ajtó/).length).toBeGreaterThan(0)
  })

  it('catalog shows category badges', () => {
    renderShop('catalog')
    expect(screen.getAllByText(/Konyha|Szekrény|Ajtó|Tartozék/).length).toBeGreaterThan(0)
  })

  it('catalog shows prices', () => {
    renderShop('catalog')
    expect(screen.getAllByText(/285|195|340/).length).toBeGreaterThan(0)
  })

  it('catalog shows stock indicator', () => {
    renderShop('catalog')
    expect(screen.getAllByText(/Készleten|Alacsony készlet/).length).toBeGreaterThan(0)
  })

  it('renders cart screen', () => {
    renderShop('cart')
    expect(screen.getAllByText(/Kosár|Kosárban/).length).toBeGreaterThan(0)
  })

  it('cart shows items', () => {
    renderShop('cart')
    expect(screen.getAllByText(/Konyhai alsó|Szekrénysor|Blum/).length).toBeGreaterThan(0)
  })

  it('cart shows quantities', () => {
    renderShop('cart')
    expect(screen.getAllByText(/qty|db|pár|2|10/).length).toBeGreaterThan(0)
  })

  it('renders orders screen', () => {
    renderShop('orders')
    expect(screen.getAllByText(/Rendelések/).length).toBeGreaterThan(0)
  })

  it('orders screen shows order items', () => {
    renderShop('orders')
    expect(screen.getAllByText(/SHO-2426-005|SHO-2426-004|SHO-2426-003/).length).toBeGreaterThan(0)
  })

  it('orders screen shows status badges', () => {
    renderShop('orders')
    expect(screen.getAllByText(/Feldolgozás|Visszaigazolt|Szállítás|Lezárt/).length).toBeGreaterThan(0)
  })

  it('clicking order opens detail SlideOver', () => {
    renderShop('orders')
    fireEvent.click(screen.getAllByText(/SHO-2426-005/)[0])
    expect(screen.getAllByText(/SHO-2426-005/).length).toBeGreaterThan(0)
  })
})
