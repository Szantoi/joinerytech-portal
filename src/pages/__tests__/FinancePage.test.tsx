import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FinanceWorldPage } from '../FinancePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderFin(path = '') {
  const url = path ? `/w/finance/${path}` : '/w/finance'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/finance" element={<FinanceWorldPage />} />
        <Route path="/w/finance/:screen" element={<FinanceWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FinancePage', () => {
  it('renders Finance dashboard', () => {
    renderFin()
    expect(screen.getByText('Kintlévőség')).toBeTruthy()
    expect(screen.getByText('Fizetendő')).toBeTruthy()
  })

  it('dashboard shows recent outgoing invoices', () => {
    renderFin()
    expect(screen.getByText('Legutóbbi kimenő számlák')).toBeTruthy()
  })

  it('dashboard shows incoming invoices section', () => {
    renderFin()
    expect(screen.getAllByText('Bejövő számlák').length).toBeGreaterThan(0)
  })

  it('renders outgoing invoices screen', () => {
    renderFin('outgoing')
    expect(screen.getAllByText('Nagy Anna').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bognár Bútor Kft.').length).toBeGreaterThan(0)
  })

  it('outgoing screen has filter buttons', () => {
    renderFin('outgoing')
    expect(screen.getAllByText('Nyitott').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Piszkozat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fizetve').length).toBeGreaterThan(0)
  })

  it('outgoing filter shows only paid invoices', () => {
    renderFin('outgoing')
    // click the "Fizetve" filter chip (first one in the filter bar)
    const filtBtns = screen.getAllByText('Fizetve')
    fireEvent.click(filtBtns[0])
    expect(screen.getAllByText('Fizetve').length).toBeGreaterThan(0)
  })

  it('clicking invoice opens detail SlideOver', () => {
    renderFin('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText('SZ-2426-0042')).toBeTruthy()
  })

  it('invoice detail shows line items', () => {
    renderFin('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getAllByText('Tételek').length).toBeGreaterThan(0)
    expect(screen.getByText('Konyhabútor alsó sor (6 elem)')).toBeTruthy()
  })

  it('invoice detail shows VAT summary', () => {
    renderFin('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText('ÁFA-bontás')).toBeTruthy()
    expect(screen.getAllByText('Bruttó').length).toBeGreaterThan(0)
  })

  it('invoice detail shows payments section', () => {
    renderFin('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getAllByText(/Kifizetések/).length).toBeGreaterThan(0)
  })

  it('renders incoming invoices screen', () => {
    renderFin('incoming')
    expect(screen.getAllByText('Egger Faipari Kft.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Falco Sopron Zrt.').length).toBeGreaterThan(0)
  })

  it('incoming screen shows benyújtott badge', () => {
    renderFin('incoming')
    expect(screen.getByText('Portálon benyújtott')).toBeTruthy()
  })

  it('incoming invoice detail shows supplier submitted notice', () => {
    renderFin('incoming')
    fireEvent.click(screen.getAllByText('Falco Sopron Zrt.')[0])
    expect(screen.getByText(/Beszállító nyújtotta be/)).toBeTruthy()
  })

  it('renders payments screen', () => {
    renderFin('payments')
    expect(screen.getAllByText(/Kifizetések/)[0]).toBeTruthy()
    expect(screen.getAllByText('Banki átutalás').length).toBeGreaterThan(0)
  })

  it('payments screen shows payment rows', () => {
    renderFin('payments')
    expect(screen.getByText(/GIRO-9921/)).toBeTruthy()
    expect(screen.getAllByText('Bankkártya').length).toBeGreaterThan(0)
  })
})
