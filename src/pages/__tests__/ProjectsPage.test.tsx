import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectsWorldPage } from '../ProjectsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderProj(path = '') {
  const url = path ? `/w/projects/${path}` : '/w/projects'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/projects" element={<ProjectsWorldPage />} />
        <Route path="/w/projects/:screen" element={<ProjectsWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProjectsPage', () => {
  it('renders projects dashboard with KPI cards', () => {
    renderProj()
    expect(screen.getByText('Aktív projektek')).toBeTruthy()
    expect(screen.getByText('Lejárt határidő')).toBeTruthy()
    expect(screen.getByText('Átlagos fedezet')).toBeTruthy()
  })

  it('dashboard shows active projects', () => {
    renderProj()
    expect(screen.getAllByText('Folyamatban').length).toBeGreaterThan(0)
  })

  it('dashboard shows project with customer name', () => {
    renderProj()
    expect(screen.getAllByText(/Hegyi|Doorstar|Bognár/).length).toBeGreaterThan(0)
  })

  it('renders project list screen', () => {
    renderProj('list')
    expect(screen.getAllByText('Projektlista').length).toBeGreaterThan(0)
  })

  it('list has status filter buttons', () => {
    renderProj('list')
    expect(screen.getAllByText('Összes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Folyamatban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lezárva').length).toBeGreaterThan(0)
  })

  it('list shows projects', () => {
    renderProj('list')
    expect(screen.getByText('Hegyi lakás — konyha + nappali bútor')).toBeTruthy()
    expect(screen.getByText('Doorstar showroom — ajtóbeépítés')).toBeTruthy()
  })

  it('list filter shows only done projects', () => {
    renderProj('list')
    const doneBtn = screen.getAllByText('Lezárva')[0]
    fireEvent.click(doneBtn)
    expect(screen.getAllByText('Lezárva').length).toBeGreaterThan(0)
    expect(screen.getByText('Pesti Ablakműhely — tárgyaló berendezés')).toBeTruthy()
  })

  it('clicking project opens detail SlideOver', () => {
    renderProj('list')
    fireEvent.click(screen.getByText('Hegyi lakás — konyha + nappali bútor'))
    expect(screen.getAllByText(/PRJ-2426-001/).length).toBeGreaterThan(0)
  })

  it('project detail shows items', () => {
    renderProj('list')
    fireEvent.click(screen.getByText('Hegyi lakás — konyha + nappali bútor'))
    expect(screen.getByText('Konyhabútor alsó sor (6 elem)')).toBeTruthy()
    expect(screen.getAllByText('Tételek').length).toBeGreaterThan(0)
  })

  it('project detail shows dependencies', () => {
    renderProj('list')
    fireEvent.click(screen.getByText('Hegyi lakás — konyha + nappali bútor'))
    expect(screen.getAllByText('Szakágak').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Víz|Áram|Bútor/).length).toBeGreaterThan(0)
  })

  it('project detail shows install readiness', () => {
    renderProj('list')
    fireEvent.click(screen.getByText('Hegyi lakás — konyha + nappali bútor'))
    expect(screen.getAllByText(/Beépítés|szakág/).length).toBeGreaterThan(0)
  })

  it('renders kanban screen', () => {
    renderProj('kanban')
    expect(screen.getAllByText('Kanban').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tervezett').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Beépítésre kész').length).toBeGreaterThan(0)
  })

  it('kanban shows project cards in columns', () => {
    renderProj('kanban')
    expect(screen.getAllByText(/Hegyi|Doorstar|Bognár/).length).toBeGreaterThan(0)
  })

  it('clicking kanban card opens detail SlideOver', () => {
    renderProj('kanban')
    fireEvent.click(screen.getAllByText('Doorstar showroom — ajtóbeépítés')[0])
    expect(screen.getAllByText(/PRJ-2426-002/).length).toBeGreaterThan(0)
  })

  it('install ready project shows green badge', () => {
    renderProj('list')
    expect(screen.getAllByText('Beépítés indítható').length).toBeGreaterThan(0)
  })

  it('blocked project shows risk badge', () => {
    renderProj('list')
    expect(screen.getAllByText(/Csúszás kockázat|szakág hátravan/).length).toBeGreaterThan(0)
  })
})
