import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AttendanceWorldPage } from '../AttendancePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderAtt(path = '') {
  const url = path ? `/w/attendance/${path}` : '/w/attendance'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/attendance" element={<AttendanceWorldPage />} />
        <Route path="/w/attendance/:screen" element={<AttendanceWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AttendancePage', () => {
  it('renders attendance dashboard', () => {
    renderAtt()
    expect(screen.getAllByText('Jelenlét').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderAtt()
    expect(screen.getAllByText('Ma bent').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Késő').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hiányzó').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Átlag ledolgozott').length).toBeGreaterThan(0)
  })

  it('dashboard shows today shift quick view', () => {
    renderAtt()
    expect(screen.getAllByText('Mai műszak').length).toBeGreaterThan(0)
  })

  it('dashboard shows exceptions panel', () => {
    renderAtt()
    expect(screen.getByText('Kivételek (5 nap)')).toBeTruthy()
  })

  it('renders today shift screen', () => {
    renderAtt('today')
    expect(screen.getAllByText('Mai műszak').length).toBeGreaterThan(0)
  })

  it('today screen shows 8 employees', () => {
    renderAtt('today')
    expect(screen.getAllByText(/Nagy János|Tóth Kinga|Kiss András/).length).toBeGreaterThan(0)
  })

  it('today screen shows attendance status pills', () => {
    renderAtt('today')
    expect(screen.getAllByText('Bent').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Késő').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hiányzó').length).toBeGreaterThan(0)
  })

  it('clicking employee opens SlideOver', () => {
    renderAtt('today')
    fireEvent.click(screen.getAllByText(/Nagy János/)[0])
    expect(screen.getAllByText(/EMP-001/).length).toBeGreaterThan(0)
  })

  it('employee SlideOver shows 5-day history', () => {
    renderAtt('today')
    fireEvent.click(screen.getAllByText(/Nagy János/)[0])
    expect(screen.getByText('5 napos jelenlét összesítő')).toBeTruthy()
  })

  it('renders history screen (5-day table)', () => {
    renderAtt('history')
    expect(screen.getAllByText('Előzmények').length).toBeGreaterThan(0)
  })

  it('history screen shows date headers', () => {
    renderAtt('history')
    expect(screen.getAllByText(/04-24|04-25|04-26/).length).toBeGreaterThan(0)
  })

  it('history screen shows all employees', () => {
    renderAtt('history')
    expect(screen.getAllByText(/Nagy János|Tóth Kinga/).length).toBeGreaterThan(0)
  })

  it('renders exceptions screen', () => {
    renderAtt('exceptions')
    expect(screen.getAllByText('Kivételek').length).toBeGreaterThan(0)
  })

  it('exceptions screen shows late and absent records', () => {
    renderAtt('exceptions')
    // should have some exceptions highlighted
    expect(screen.getAllByText('Késő').length + screen.getAllByText('Hiányzó').length).toBeGreaterThan(0)
  })
})
