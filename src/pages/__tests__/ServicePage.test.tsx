import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ServiceWorldPage } from '../ServicePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderService(path = '') {
  const url = path ? `/w/service/${path}` : '/w/service'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/service" element={<ServiceWorldPage />} />
        <Route path="/w/service/:screen" element={<ServiceWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ServicePage — Dashboard', () => {
  it('renders service world', () => {
    renderService()
    expect(screen.getAllByText('Szerviz').length).toBeGreaterThan(0)
  })

  it('shows dashboard KPI cards', () => {
    renderService()
    expect(screen.getByText('Nyitott jegy')).toBeTruthy()
    expect(screen.getByText('SLA-ban')).toBeTruthy()
    expect(screen.getByText('Garanciás')).toBeTruthy()
    expect(screen.getByText('Mai látogatás')).toBeTruthy()
  })

  it('shows open tickets panel', () => {
    renderService()
    expect(screen.getByText('Nyitott jegyek')).toBeTruthy()
  })

  it('open tickets list shows ticket titles', () => {
    renderService()
    expect(screen.getAllByText(/Karcos fiókfront|Gardróbajtó|Konyhaajtók|Sorozat-ajtó/).length).toBeGreaterThan(0)
  })

  it('shows today visit panel when visits exist', () => {
    renderService()
    expect(screen.getByText('Mai kiszállások')).toBeTruthy()
  })

  it('clicking ticket opens SlideOver', () => {
    renderService()
    fireEvent.click(screen.getAllByText(/Karcos fiókfront/)[0])
    expect(screen.getAllByText(/REK-2426-001/).length).toBeGreaterThan(0)
  })

  it('ticket detail shows customer info section', () => {
    renderService()
    fireEvent.click(screen.getAllByText(/Karcos fiókfront/)[0])
    expect(screen.getByText('Ügyfél')).toBeTruthy()
  })

  it('ticket detail shows description', () => {
    renderService()
    fireEvent.click(screen.getAllByText(/Karcos fiókfront/)[0])
    expect(screen.getByText('Leírás')).toBeTruthy()
  })
})

describe('ServicePage — Ticket List', () => {
  it('renders ticket list screen', () => {
    renderService('tickets')
    expect(screen.getAllByText('Jegyek').length).toBeGreaterThan(0)
  })

  it('shows all 6 ticket IDs', () => {
    renderService('tickets')
    expect(screen.getAllByText(/REK-2426/).length).toBe(6)
  })

  it('has status filter select', () => {
    renderService('tickets')
    expect(screen.getByText('Minden státusz')).toBeTruthy()
  })

  it('has type filter select', () => {
    renderService('tickets')
    expect(screen.getByText('Minden típus')).toBeTruthy()
  })

  it('shows customer names in table', () => {
    renderService('tickets')
    expect(screen.getAllByText(/Bognár Bútor|Doorstar|Hegyi/).length).toBeGreaterThan(0)
  })

  it('search filters tickets', () => {
    renderService('tickets')
    const input = screen.getByPlaceholderText('Keresés...')
    fireEvent.change(input, { target: { value: 'Doorstar' } })
    expect(screen.getAllByText(/REK-2426-006/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/REK-2426-001/)).toBeFalsy()
  })

  it('clicking ticket row opens detail SlideOver', () => {
    renderService('tickets')
    fireEvent.click(screen.getAllByText(/Karcos fiókfront/)[0])
    expect(screen.getAllByText(/REK-2426-001/).length).toBeGreaterThan(0)
  })
})

describe('ServicePage — Warranties', () => {
  it('renders warranties screen', () => {
    renderService('warranties')
    expect(screen.getAllByText('Garanciák').length).toBeGreaterThan(0)
  })

  it('shows warranty heading', () => {
    renderService('warranties')
    expect(screen.getByText('Aktív garanciák')).toBeTruthy()
  })

  it('shows warranty customers', () => {
    renderService('warranties')
    expect(screen.getAllByText(/Bognár Bútor|Doorstar|Hegyi|Nagy Anna/).length).toBe(4)
  })

  it('shows active warranty status pills', () => {
    renderService('warranties')
    expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0)
  })

  it('shows warranty product names', () => {
    renderService('warranties')
    expect(screen.getAllByText(/konyhabútor|gardrób|Konyha|ajtók/i).length).toBeGreaterThan(0)
  })
})

describe('ServicePage — Visits', () => {
  it('renders visits screen', () => {
    renderService('visits')
    expect(screen.getAllByText('Látogatások').length).toBeGreaterThan(0)
  })

  it('shows week grid heading', () => {
    renderService('visits')
    expect(screen.getByText(/Heti látogatás-naptár/)).toBeTruthy()
  })

  it('shows visit list with technicians', () => {
    renderService('visits')
    expect(screen.getAllByText(/Kiss András|Horváth Gábor|Nagy János/).length).toBeGreaterThan(0)
  })

  it('shows visit customers', () => {
    renderService('visits')
    expect(screen.getAllByText(/Bognár Bútor|Doorstar|Nagy Anna|Belváros/).length).toBeGreaterThan(0)
  })

  it('shows visit time slots', () => {
    renderService('visits')
    expect(screen.getAllByText(/\d{2}:\d{2}–\d{2}:\d{2}/).length).toBeGreaterThan(0)
  })
})
