import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LogisticsWorldPage } from '../LogisticsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderLog(path = '') {
  const url = path ? `/w/logistics/${path}` : '/w/logistics'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/logistics" element={<LogisticsWorldPage />} />
        <Route path="/w/logistics/:screen" element={<LogisticsWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LogisticsPage', () => {
  it('renders logistics dashboard', () => {
    renderLog()
    expect(screen.getAllByText('Logisztika').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderLog()
    expect(screen.getAllByText('Mai túrák').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Úton').length).toBeGreaterThan(0)
    expect(screen.getByText('Beosztásra vár')).toBeTruthy()
    expect(screen.getByText('Hiánytétel')).toBeTruthy()
  })

  it('dashboard shows today shipments panel', () => {
    renderLog()
    expect(screen.getAllByText('Mai túrák').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bognár Bútor Kft.').length).toBeGreaterThan(0)
  })

  it('dashboard shows upcoming shipments panel', () => {
    renderLog()
    expect(screen.getByText('Következő fuvarok')).toBeTruthy()
  })

  it('renders outgoing list screen', () => {
    renderLog('outgoing')
    expect(screen.getAllByText('Kiszállítások').length).toBeGreaterThan(0)
  })

  it('outgoing list shows delivery shipments', () => {
    renderLog('outgoing')
    expect(screen.getAllByText('Bognár Bútor Kft.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Doorstar Hungary Zrt.').length).toBeGreaterThan(0)
  })

  it('outgoing list shows status pills', () => {
    renderLog('outgoing')
    expect(screen.getAllByText(/Úton|Tervezett|Beszerelve|Átadva/).length).toBeGreaterThan(0)
  })

  it('outgoing list has search input', () => {
    renderLog('outgoing')
    expect(screen.getByPlaceholderText('Keresés ügyfél / azonosító…')).toBeTruthy()
  })

  it('outgoing list has status filter dropdown', () => {
    renderLog('outgoing')
    expect(screen.getByDisplayValue('Minden státusz')).toBeTruthy()
  })

  it('clicking shipment opens detail SlideOver', () => {
    renderLog('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText('SH-2426-002')).toBeTruthy()
  })

  it('shipment detail shows stepper', () => {
    renderLog('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getAllByText('Státusz').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Beszerelve').length).toBeGreaterThan(0)
  })

  it('shipment detail shows event log', () => {
    renderLog('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText('Eseménynapló')).toBeTruthy()
    expect(screen.getAllByText(/Berakodva/).length).toBeGreaterThan(0)
  })

  it('shipment detail shows handover section', () => {
    renderLog('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText('Átadás-átvétel')).toBeTruthy()
  })

  it('shipment detail shows deficiency', () => {
    renderLog('outgoing')
    fireEvent.click(screen.getAllByText('Bognár Bútor Kft.')[0])
    expect(screen.getByText(/karcos/)).toBeTruthy()
  })

  it('renders incoming list screen', () => {
    renderLog('incoming')
    expect(screen.getAllByText('Beszállítások').length).toBeGreaterThan(0)
  })

  it('incoming list shows pickup shipments', () => {
    renderLog('incoming')
    expect(screen.getAllByText('Falco Sopron Zrt.').length).toBeGreaterThan(0)
  })

  it('delegated shipment shows partner badge', () => {
    renderLog('outgoing')
    expect(screen.getAllByText(/Beépítő Csapat Kft\./).length).toBeGreaterThan(0)
  })
})
