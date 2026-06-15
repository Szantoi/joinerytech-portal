import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CrmWorldPage } from '../CrmPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderCrm(path = '') {
  const url = path ? `/w/crm/${path}` : '/w/crm'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/crm" element={<CrmWorldPage />} />
        <Route path="/w/crm/:screen" element={<CrmWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CrmPage', () => {
  it('renders CRM dashboard with KPI cards', () => {
    renderCrm()
    expect(screen.getByText('Pipeline érték')).toBeTruthy()
    expect(screen.getByText('Win rate')).toBeTruthy()
    expect(screen.getByText('Lead konverzió')).toBeTruthy()
  })

  it('renders dashboard with lead pipeline mini', () => {
    renderCrm()
    expect(screen.getByText('Lead pipeline')).toBeTruthy()
  })

  it('renders dashboard with open opportunities', () => {
    renderCrm()
    expect(screen.getByText('Nyitott lehetőségek')).toBeTruthy()
  })

  it('renders pipeline kanban with columns', () => {
    renderCrm('pipeline')
    expect(screen.getByText('Kapcsolat')).toBeTruthy()
    expect(screen.getByText('Minősítés')).toBeTruthy()
    expect(screen.getByText('Nurturing')).toBeTruthy()
  })

  it('pipeline shows lead cards', () => {
    renderCrm('pipeline')
    expect(screen.getByText('Kele Márton')).toBeTruthy()
  })

  it('renders lead list screen', () => {
    renderCrm('leads')
    expect(screen.getAllByText(/Kapcsolatfelvétel|Minősítés|Nurturing|Új/)[0]).toBeTruthy()
  })

  it('lead list has search input', () => {
    renderCrm('leads')
    expect(screen.getAllByPlaceholderText('Keresés…').length).toBeGreaterThan(0)
  })

  it('lead list filter works', () => {
    renderCrm('leads')
    fireEvent.click(screen.getAllByText('Elvetve')[0])
    expect(screen.getByText('Tarr Niké')).toBeTruthy()
  })

  it('clicking lead opens detail SlideOver', () => {
    renderCrm('leads')
    fireEvent.click(screen.getByText('Kele Márton'))
    expect(screen.getByText('LEAD-2426-001')).toBeTruthy()
  })

  it('lead detail shows activity log', () => {
    renderCrm('leads')
    fireEvent.click(screen.getByText('Kele Márton'))
    expect(screen.getByText('Tevékenységnapló')).toBeTruthy()
  })

  it('renders opportunity list screen', () => {
    renderCrm('opps')
    expect(screen.getByText('Lehetőség')).toBeTruthy()
    expect(screen.getByText('Várdai Konyhastúdió')).toBeTruthy()
  })

  it('opp list shows status pills', () => {
    renderCrm('opps')
    expect(screen.getAllByText(/Nyitott|Igényfelmérés|Ajánlat/)[0]).toBeTruthy()
  })

  it('clicking opp opens detail SlideOver', () => {
    renderCrm('opps')
    fireEvent.click(screen.getAllByText('Mind')[0])
    fireEvent.click(screen.getByText('Bognár Bútor Kft.'))
    expect(screen.getAllByText('OPP-2426-005').length).toBeGreaterThan(0)
  })

  it('renders forecast screen', () => {
    renderCrm('forecast')
    expect(screen.getByText('Pipeline (bruttó)')).toBeTruthy()
    expect(screen.getByText('Súlyozott forecast')).toBeTruthy()
    expect(screen.getByText('Megnyert (YTD)')).toBeTruthy()
  })

  it('forecast shows forecast table', () => {
    renderCrm('forecast')
    expect(screen.getByText('Forecast fázis szerint')).toBeTruthy()
    expect(screen.getByText('Valószínűség')).toBeTruthy()
  })

  it('dashboard open tasks section shows tasks', () => {
    renderCrm()
    expect(screen.getAllByText('Nyitott feladatok').length).toBeGreaterThan(0)
  })
})
