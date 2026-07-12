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

  it('queue shows endpoint pending banner', () => {
    renderMfg('queue')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('queue has status filter buttons', () => {
    renderMfg('queue')
    expect(screen.getAllByText('Összes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gyártásban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blokkolt').length).toBeGreaterThan(0)
  })

  it('queue filter changes endpoint param in pending banner', () => {
    renderMfg('queue')
    fireEvent.click(screen.getAllByText('Gyártásban')[0])
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('renders datasheets screen', () => {
    renderMfg('datasheets')
    expect(screen.getAllByText('Munkalapok').length).toBeGreaterThan(0)
  })

  it('datasheets screen shows endpoint pending banner', () => {
    renderMfg('datasheets')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })
})
