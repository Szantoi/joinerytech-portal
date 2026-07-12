import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QualityWorldPage } from '../QualityPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderQuality(path = '') {
  const url = path ? `/w/quality/${path}` : '/w/quality'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/quality" element={<QualityWorldPage />} />
        <Route path="/w/quality/:screen" element={<QualityWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('QualityPage', () => {
  it('renders quality dashboard', () => {
    renderQuality()
    expect(screen.getAllByText('Minőség').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderQuality()
    expect(screen.getAllByText('Nyitott NCR').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Átlagos zárás').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pass rate').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív auditok').length).toBeGreaterThan(0)
  })

  it('dashboard shows NCR panel heading', () => {
    renderQuality()
    expect(screen.getByText('Nyitott NCR-ek')).toBeTruthy()
  })

  it('dashboard shows audit log heading', () => {
    renderQuality()
    expect(screen.getByText('Legutóbbi auditok')).toBeTruthy()
  })

  it('renders NCR list screen', () => {
    renderQuality('ncr')
    expect(screen.getAllByText('NCR-ek').length).toBeGreaterThan(0)
  })

  it('NCR list shows endpoint pending banner', () => {
    renderQuality('ncr')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('renders templates screen', () => {
    renderQuality('templates')
    expect(screen.getAllByText('Sablonok').length).toBeGreaterThan(0)
  })

  it('templates screen shows endpoint pending banner', () => {
    renderQuality('templates')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('renders audit log screen', () => {
    renderQuality('audits')
    expect(screen.getAllByText('Auditok').length).toBeGreaterThan(0)
  })

  it('audit log shows endpoint pending banner', () => {
    renderQuality('audits')
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })
})
