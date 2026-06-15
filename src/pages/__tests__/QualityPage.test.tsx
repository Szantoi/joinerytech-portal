import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('dashboard shows NCR panel', () => {
    renderQuality()
    expect(screen.getByText('Nyitott NCR-ek')).toBeTruthy()
  })

  it('dashboard shows audit log snippet', () => {
    renderQuality()
    expect(screen.getByText('Legutóbbi auditok')).toBeTruthy()
  })

  it('renders NCR list screen', () => {
    renderQuality('ncr')
    expect(screen.getAllByText('NCR-ek').length).toBeGreaterThan(0)
  })

  it('NCR list shows NCRs with severity badges', () => {
    renderQuality('ncr')
    expect(screen.getAllByText('Kritikus').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Súlyos').length).toBeGreaterThan(0)
  })

  it('clicking NCR opens detail SlideOver', () => {
    renderQuality('ncr')
    fireEvent.click(screen.getAllByText(/Felületi karcolás/)[0])
    expect(screen.getAllByText(/NCR-001/).length).toBeGreaterThan(0)
  })

  it('NCR detail shows description', () => {
    renderQuality('ncr')
    fireEvent.click(screen.getAllByText(/Felületi karcolás/)[0])
    expect(screen.getByText('Leírás')).toBeTruthy()
  })

  it('NCR detail shows status change buttons for open NCR', () => {
    renderQuality('ncr')
    fireEvent.click(screen.getAllByText(/Felületi karcolás/)[0])
    expect(screen.getByText('Vizsgálat indítása')).toBeTruthy()
  })

  it('renders templates screen', () => {
    renderQuality('templates')
    expect(screen.getAllByText('Sablonok').length).toBeGreaterThan(0)
  })

  it('templates list shows checklist item count', () => {
    renderQuality('templates')
    expect(screen.getAllByText(/Konyhabútor végső ellenőrzés/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ajtólap minőségi ellenőrzés/).length).toBeGreaterThan(0)
  })

  it('renders audit log screen', () => {
    renderQuality('audits')
    expect(screen.getAllByText('Auditok').length).toBeGreaterThan(0)
  })

  it('audit log shows results', () => {
    renderQuality('audits')
    expect(screen.getAllByText('Megfelelt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Feltételes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nem felelt').length).toBeGreaterThan(0)
  })

  it('audit log shows inspector names', () => {
    renderQuality('audits')
    expect(screen.getAllByText(/Tóth K\.|Kiss A\./).length).toBeGreaterThan(0)
  })
})
