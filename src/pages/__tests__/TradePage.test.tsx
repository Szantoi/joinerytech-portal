import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TradeWorldPage } from '../TradePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderTrade(path = '') {
  const url = path ? `/w/trade/${path}` : '/w/trade'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/trade" element={<TradeWorldPage />} />
        <Route path="/w/trade/:screen" element={<TradeWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TradePage', () => {
  it('renders trade dashboard', () => {
    renderTrade()
    expect(screen.getAllByText('Kereskedelem').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderTrade()
    expect(screen.getAllByText('Nyitott ajánlatok').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív PO').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Elfogadott/).length).toBeGreaterThan(0)
  })

  it('dashboard shows open quotes list', () => {
    renderTrade()
    expect(screen.getAllByText(/Bognár Bútor Kft/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Doorstar Hungary Zrt/).length).toBeGreaterThan(0)
  })

  it('renders quotes screen', () => {
    renderTrade('quotes')
    expect(screen.getAllByText('Árajánlatok').length).toBeGreaterThan(0)
  })

  it('quotes list shows all quotes', () => {
    renderTrade('quotes')
    expect(screen.getAllByText(/Bognár Bútor Kft/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Tóth Konyha/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Szabó Lakberendezés/).length).toBeGreaterThan(0)
  })

  it('quotes list shows status badges', () => {
    renderTrade('quotes')
    expect(screen.getAllByText(/Piszkozat|Elküldve|Elfogadva|Elutasítva/).length).toBeGreaterThan(0)
  })

  it('clicking quote opens detail SlideOver', () => {
    renderTrade('quotes')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getAllByText(/AJ-2426-018/).length).toBeGreaterThan(0)
  })

  it('quote detail shows total amount', () => {
    renderTrade('quotes')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getByText('Nettó összeg')).toBeTruthy()
  })

  it('quote detail shows note if present', () => {
    renderTrade('quotes')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getByText(/Konyhabútor sor/)).toBeTruthy()
  })

  it('renders pos screen', () => {
    renderTrade('pos')
    expect(screen.getAllByText(/Megrendelés|PO/).length).toBeGreaterThan(0)
  })

  it('PO list shows suppliers', () => {
    renderTrade('pos')
    expect(screen.getAllByText(/Egger Faipari|Hettich Hungary/).length).toBeGreaterThan(0)
  })

  it('PO list shows status badges', () => {
    renderTrade('pos')
    expect(screen.getAllByText(/Megerősítve|Megérkezett|Számlázva|Függőben/).length).toBeGreaterThan(0)
  })

  it('clicking PO opens detail SlideOver', () => {
    renderTrade('pos')
    fireEvent.click(screen.getAllByText(/Egger Faipari/)[0])
    expect(screen.getAllByText(/PO-2426-044/).length).toBeGreaterThan(0)
  })

  it('renders partners screen', () => {
    renderTrade('partners')
    expect(screen.getAllByText('Partnerek').length).toBeGreaterThan(0)
  })

  it('partners list shows all partners', () => {
    renderTrade('partners')
    expect(screen.getAllByText(/Bognár Bútor Kft/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Doorstar Hungary Zrt/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Egger Faipari/).length).toBeGreaterThan(0)
  })

  it('partners show kind badges', () => {
    renderTrade('partners')
    expect(screen.getAllByText(/Vevő|Szállító|Mindkettő/).length).toBeGreaterThan(0)
  })

  it('partners show YTD turnover', () => {
    renderTrade('partners')
    expect(screen.getAllByText('YTD forgalom').length).toBeGreaterThan(0)
  })
})
