import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InteriorWorldPage } from '../InteriorPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderInt(path = '') {
  const url = path ? `/w/interior/${path}` : '/w/interior'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/interior" element={<InteriorWorldPage />} />
        <Route path="/w/interior/:screen" element={<InteriorWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('InteriorPage', () => {
  it('renders interior dashboard', () => {
    renderInt()
    expect(screen.getAllByText('Belső tér').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderInt()
    expect(screen.getAllByText('Aktív konfiguráció').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Véglegesített').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Összesített bútor érték').length).toBeGreaterThan(0)
  })

  it('dashboard shows room config list', () => {
    renderInt()
    expect(screen.getAllByText('Szoba-konfigurációk').length).toBeGreaterThan(0)
  })

  it('dashboard shows room names', () => {
    renderInt()
    expect(screen.getAllByText(/Konyha \+ Nappali|Hálószoba|Konyhabútor csomag|Dolgozószoba/).length).toBeGreaterThan(0)
  })

  it('dashboard shows room status badges', () => {
    renderInt()
    expect(screen.getAllByText(/Tervezés|Jóváhagyva|Véglegesített|Vázlat/).length).toBeGreaterThan(0)
  })

  it('clicking room opens detail SlideOver', () => {
    renderInt()
    fireEvent.click(screen.getAllByText(/Konyha \+ Nappali/)[0])
    expect(screen.getAllByText(/RM-001/).length).toBeGreaterThan(0)
  })

  it('room detail shows furniture list', () => {
    renderInt()
    fireEvent.click(screen.getAllByText(/Konyha \+ Nappali/)[0])
    expect(screen.getAllByText('Bútorok').length).toBeGreaterThan(0)
  })

  it('room detail shows material summary', () => {
    renderInt()
    fireEvent.click(screen.getAllByText(/Konyha \+ Nappali/)[0])
    expect(screen.getAllByText('Anyag összesítő').length).toBeGreaterThan(0)
  })

  it('room detail shows total value', () => {
    renderInt()
    fireEvent.click(screen.getAllByText(/Konyha \+ Nappali/)[0])
    expect(screen.getAllByText('Összesített bútor érték').length).toBeGreaterThan(0)
  })

  it('renders rooms screen', () => {
    renderInt('rooms')
    expect(screen.getAllByText('Szoba-konfigurációk').length).toBeGreaterThan(0)
  })

  it('rooms screen shows all rooms', () => {
    renderInt('rooms')
    expect(screen.getAllByText(/Konyha \+ Nappali|Hálószoba|Konyhabútor csomag|Dolgozószoba/).length).toBeGreaterThan(0)
  })

  it('rooms screen shows designer names', () => {
    renderInt('rooms')
    expect(screen.getAllByText(/Kovács P\.|Szabó A\./).length).toBeGreaterThan(0)
  })

  it('clicking room in list opens detail', () => {
    renderInt('rooms')
    fireEvent.click(screen.getAllByText(/Konyha \+ Nappali/)[0])
    expect(screen.getAllByText(/Vella Interior/).length).toBeGreaterThan(0)
  })

  it('renders furniture screen', () => {
    renderInt('furniture')
    expect(screen.getAllByText('Bútor kártyák').length).toBeGreaterThan(0)
  })

  it('furniture screen shows items', () => {
    renderInt('furniture')
    expect(screen.getAllByText(/Konyhai alsó sor|Konyhai felső sor|Nappali polcfal/).length).toBeGreaterThan(0)
  })

  it('furniture screen shows type badges', () => {
    renderInt('furniture')
    expect(screen.getAllByText(/Konyha|Polc|Szekrény|Gardrób|Íróasztal/).length).toBeGreaterThan(0)
  })

  it('furniture cards show material info', () => {
    renderInt('furniture')
    expect(screen.getAllByText(/Egger W1000 fehér|Egger H1334 tölgy/).length).toBeGreaterThan(0)
  })
})
