import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MfgPrepWorldPage } from '../MfgPrepPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderMfg(path = '') {
  const url = path ? `/w/mfgprep/${path}` : '/w/mfgprep'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/mfgprep" element={<MfgPrepWorldPage />} />
        <Route path="/w/mfgprep/:screen" element={<MfgPrepWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MfgPrepPage', () => {
  it('renders mfgprep dashboard', () => {
    renderMfg()
    expect(screen.getAllByText('Gyártás-előkészítés').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderMfg()
    expect(screen.getAllByText('Kiadásra vár').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gyártásban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Beépítésre kész').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blokkolt').length).toBeGreaterThan(0)
  })

  it('dashboard shows pending items panel', () => {
    renderMfg()
    expect(screen.getByText('Sürgős kiadásra vár')).toBeTruthy()
  })

  it('dashboard shows datasheets panel', () => {
    renderMfg()
    expect(screen.getAllByText('Munkalapok').length).toBeGreaterThan(0)
  })

  it('renders release queue screen', () => {
    renderMfg('queue')
    expect(screen.getAllByText('Release queue').length).toBeGreaterThan(0)
  })

  it('queue shows release items', () => {
    renderMfg('queue')
    expect(screen.getAllByText(/Bognár Bútor Kft/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Doorstar Hungary Zrt/).length).toBeGreaterThan(0)
  })

  it('queue has status filter buttons', () => {
    renderMfg('queue')
    expect(screen.getAllByText('Összes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gyártásban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blokkolt').length).toBeGreaterThan(0)
  })

  it('queue shows priority badges', () => {
    renderMfg('queue')
    expect(screen.getAllByText('Sürgős').length).toBeGreaterThan(0)
  })

  it('clicking release item opens detail SlideOver', () => {
    renderMfg('queue')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getAllByText(/REL-2426-001/).length).toBeGreaterThan(0)
  })

  it('release detail shows checklist', () => {
    renderMfg('queue')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getByText('Ellenőrzőlista')).toBeTruthy()
    expect(screen.getByText('Anyaglista ellenőrzve')).toBeTruthy()
  })

  it('release detail shows material note', () => {
    renderMfg('queue')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getByText(/Bükk 18mm/)).toBeTruthy()
  })

  it('blocked item shows in queue', () => {
    renderMfg('queue')
    expect(screen.getAllByText(/Tóth Konyha|Fehér fényezett/).length).toBeGreaterThan(0)
  })

  it('queue filter works — in_production filter', () => {
    renderMfg('queue')
    fireEvent.click(screen.getAllByText('Gyártásban')[0])
    expect(screen.getByText('Konyhabútor — 16 fiókos sor')).toBeTruthy()
  })

  it('renders datasheets screen', () => {
    renderMfg('datasheets')
    expect(screen.getAllByText('Munkalapok').length).toBeGreaterThan(0)
  })

  it('datasheets list shows active sheets', () => {
    renderMfg('datasheets')
    expect(screen.getAllByText(/Bognár Bútor Kft|Doorstar|Hegyi/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0)
  })

  it('clicking datasheet opens detail SlideOver', () => {
    renderMfg('datasheets')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getAllByText(/DS-2426-001/).length).toBeGreaterThan(0)
  })

  it('datasheet detail shows operations', () => {
    renderMfg('datasheets')
    fireEvent.click(screen.getAllByText(/Bognár Bútor Kft/)[0])
    expect(screen.getAllByText('Műveletek').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Szabászat').length).toBeGreaterThan(0)
  })
})
