import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ControllingWorldPage } from '../ControllingPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderCtrl(path = '') {
  const url = path ? `/w/kontrolling/${path}` : '/w/kontrolling'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/kontrolling" element={<ControllingWorldPage />} />
        <Route path="/w/kontrolling/:screen" element={<ControllingWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ControllingPage', () => {
  it('renders Kontrolling dashboard', () => {
    renderCtrl()
    expect(screen.getAllByText('Kontrolling').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderCtrl()
    expect(screen.getAllByText('Portfólió érték').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terv-fedezet').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tény-fedezet').length).toBeGreaterThan(0)
  })

  it('dashboard shows portfolio table', () => {
    renderCtrl()
    expect(screen.getAllByText('Projekt-portfólió').length).toBeGreaterThan(0)
  })

  it('portfolio table shows project rows', () => {
    renderCtrl()
    expect(screen.getAllByText(/Petőfi u\. 12/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Belváros Café/).length).toBeGreaterThan(0)
  })

  it('portfolio table shows customers', () => {
    renderCtrl()
    expect(screen.getAllByText(/Nagy Anna/).length).toBeGreaterThan(0)
  })

  it('dashboard shows top/flop panels', () => {
    renderCtrl()
    expect(screen.getByText('Legjobb fedezet')).toBeTruthy()
    expect(screen.getByText('Leggyengébb fedezet')).toBeTruthy()
  })

  it('clicking project row opens detail SlideOver', () => {
    renderCtrl()
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12/)[0])
    expect(screen.getAllByText('Kategória-bontás').length).toBeGreaterThan(0)
  })

  it('project detail shows cost categories', () => {
    renderCtrl()
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12/)[0])
    expect(screen.getAllByText(/Anyag|Munkaóra|Szállítás/).length).toBeGreaterThan(0)
  })

  it('project detail shows plan vs actual columns', () => {
    renderCtrl()
    fireEvent.click(screen.getAllByText(/Petőfi u\. 12/)[0])
    expect(screen.getAllByText('Terv').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tény').length).toBeGreaterThan(0)
  })

  it('renders project list screen', () => {
    renderCtrl('projects')
    expect(screen.getAllByText('Projekt-fedezet').length).toBeGreaterThan(0)
  })

  it('project list shows all projects', () => {
    renderCtrl('projects')
    expect(screen.getAllByText(/Petőfi u\. 12/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Doorstar ajtók/).length).toBeGreaterThan(0)
  })

  it('project list shows margin pills', () => {
    renderCtrl('projects')
    const joPills = screen.getAllByText(/Jó|Közepes|Gyenge|Veszteséges/)
    expect(joPills.length).toBeGreaterThan(0)
  })
})
