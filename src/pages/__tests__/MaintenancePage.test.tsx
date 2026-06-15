import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MaintenanceWorldPage } from '../MaintenancePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderMnt(path = '') {
  const url = path ? `/w/maintenance/${path}` : '/w/maintenance'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/maintenance" element={<MaintenanceWorldPage />} />
        <Route path="/w/maintenance/:screen" element={<MaintenanceWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MaintenancePage', () => {
  it('renders maintenance dashboard', () => {
    renderMnt()
    expect(screen.getAllByText('Karbantartás').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderMnt()
    expect(screen.getAllByText('Aktív gépek').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Figyelmeztetés').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Leállt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nyitott jegyek').length).toBeGreaterThan(0)
  })

  it('dashboard shows asset panel', () => {
    renderMnt()
    expect(screen.getByText('Gépek állapota')).toBeTruthy()
  })

  it('dashboard shows ticket panel', () => {
    renderMnt()
    expect(screen.getByText('Aktív jegyek')).toBeTruthy()
  })

  it('renders assets screen', () => {
    renderMnt('assets')
    expect(screen.getAllByText('Eszközök').length).toBeGreaterThan(0)
  })

  it('assets screen shows asset names', () => {
    renderMnt('assets')
    expect(screen.getAllByText(/Holzma HPP380/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Biesse Rover CNC/).length).toBeGreaterThan(0)
  })

  it('assets screen shows status pills', () => {
    renderMnt('assets')
    expect(screen.getAllByText('Üzemel').length).toBeGreaterThan(0)
  })

  it('clicking asset opens SlideOver', () => {
    renderMnt('assets')
    fireEvent.click(screen.getAllByText(/Holzma HPP380/)[0])
    expect(screen.getAllByText(/ASS-001/).length).toBeGreaterThan(0)
  })

  it('asset SlideOver shows service dates', () => {
    renderMnt('assets')
    fireEvent.click(screen.getAllByText(/Holzma HPP380/)[0])
    expect(screen.getByText('Utolsó szerviz')).toBeTruthy()
    expect(screen.getByText('Következő szerviz')).toBeTruthy()
  })

  it('renders tickets screen', () => {
    renderMnt('tickets')
    expect(screen.getAllByText('Jegyek').length).toBeGreaterThan(0)
  })

  it('tickets screen shows ticket type badges', () => {
    renderMnt('tickets')
    expect(screen.getAllByText('Megelőző').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Javítás').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sürgős').length).toBeGreaterThan(0)
  })

  it('clicking ticket opens SlideOver', () => {
    renderMnt('tickets')
    fireEvent.click(screen.getAllByText(/X-tengely vibráció/)[0])
    expect(screen.getAllByText(/TKT-001/).length).toBeGreaterThan(0)
  })

  it('renders schedule screen', () => {
    renderMnt('schedule')
    expect(screen.getAllByText('Ütemterv').length).toBeGreaterThan(0)
  })

  it('schedule shows upcoming items', () => {
    renderMnt('schedule')
    expect(screen.getAllByText(/Biesse Selco WN6|Holzma HPP380/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Horváth Péter|Varga László/).length).toBeGreaterThan(0)
  })
})
