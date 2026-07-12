import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HrWorldPage } from '../HrPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderHr(path = '') {
  const url = path ? `/w/hr/${path}` : '/w/hr'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/hr" element={<HrWorldPage />} />
        <Route path="/w/hr/:screen" element={<HrWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HrPage', () => {
  it('renders HR dashboard', () => {
    renderHr()
    expect(screen.getAllByText('HR / Kapacitás').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderHr()
    expect(screen.getAllByText('Létszám').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Heti kapacitás').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lekötött').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kihasználtság').length).toBeGreaterThan(0)
  })

  it('dashboard shows presence panel', () => {
    renderHr()
    expect(screen.getByText('Mai jelenlét')).toBeTruthy()
  })

  it('dashboard shows open requests panel', () => {
    renderHr()
    expect(screen.getAllByText(/Nyitott kérelmek/).length).toBeGreaterThan(0)
  })

  it('dashboard shows capacity overview', () => {
    renderHr()
    expect(screen.getByText('Heti kapacitás — áttekintés')).toBeTruthy()
  })

  it('dashboard lists employees in overview', () => {
    renderHr()
    expect(screen.getAllByText(/Kovács Péter/).length).toBeGreaterThan(0)
  })

  it('renders people screen', () => {
    renderHr('people')
    expect(screen.getAllByText('Dolgozók').length).toBeGreaterThan(0)
  })

  it('people screen shows employee list', () => {
    renderHr('people')
    expect(screen.getAllByText(/Nagy János/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Kiss András/).length).toBeGreaterThan(0)
  })

  it('people screen has department filter', () => {
    renderHr('people')
    expect(screen.getAllByText('Összes').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Gyártás/).length).toBeGreaterThan(0)
  })

  it('people screen has search input', () => {
    renderHr('people')
    const inputs = screen.getAllByPlaceholderText(/Keresés/)
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('clicking employee opens detail SlideOver', () => {
    renderHr('people')
    fireEvent.click(screen.getAllByText(/Nagy János/)[0])
    expect(screen.getAllByText(/Beépítő vezető/).length).toBeGreaterThan(0)
  })

  it('employee detail shows skills', () => {
    renderHr('people')
    fireEvent.click(screen.getAllByText(/Nagy János/)[0])
    expect(screen.getAllByText('Készségek').length).toBeGreaterThan(0)
  })

  it('renders capacity screen', () => {
    renderHr('capacity')
    expect(screen.getAllByText('Kapacitás-naptár').length).toBeGreaterThan(0)
  })

  it('capacity screen shows employee rows', () => {
    renderHr('capacity')
    expect(screen.getAllByText(/Nagy János/).length).toBeGreaterThan(0)
  })

  it('renders absences screen', () => {
    renderHr('absences')
    expect(screen.getAllByText('Távollétek').length).toBeGreaterThan(0)
  })

  it('absences screen shows absence records', () => {
    renderHr('absences')
    expect(screen.getAllByText(/Szabadság|Betegszabadság/).length).toBeGreaterThan(0)
  })
})
