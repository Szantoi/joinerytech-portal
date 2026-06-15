import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EhsWorldPage } from '../EhsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderEhs(path = '') {
  const url = path ? `/w/ehs/${path}` : '/w/ehs'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/ehs" element={<EhsWorldPage />} />
        <Route path="/w/ehs/:screen" element={<EhsWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EhsPage', () => {
  it('renders EHS dashboard', () => {
    renderEhs()
    expect(screen.getAllByText('EHS').length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderEhs()
    expect(screen.getAllByText('Esemény YTD').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nyitott intézkedés').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Magas kockázat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Baleset-mentes nap').length).toBeGreaterThan(0)
  })

  it('dashboard shows incident panel', () => {
    renderEhs()
    expect(screen.getByText('Legutóbbi események')).toBeTruthy()
  })

  it('dashboard shows risk matrix mini', () => {
    renderEhs()
    expect(screen.getByText('Kockázati mátrix (kivonat)')).toBeTruthy()
  })

  it('renders incidents screen', () => {
    renderEhs('incidents')
    expect(screen.getAllByText('Események').length).toBeGreaterThan(0)
  })

  it('incidents list shows incident type badges', () => {
    renderEhs('incidents')
    expect(screen.getAllByText('Baleset').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Közel-miss').length).toBeGreaterThan(0)
  })

  it('incidents list shows severity pills', () => {
    renderEhs('incidents')
    expect(screen.getAllByText('Magas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Közepes').length).toBeGreaterThan(0)
  })

  it('clicking incident opens detail SlideOver', () => {
    renderEhs('incidents')
    fireEvent.click(screen.getAllByText(/Kézsérülés/)[0])
    expect(screen.getAllByText(/INC-001/).length).toBeGreaterThan(0)
  })

  it('incident detail shows description', () => {
    renderEhs('incidents')
    fireEvent.click(screen.getAllByText(/Kézsérülés/)[0])
    expect(screen.getByText('Leírás')).toBeTruthy()
  })

  it('incident detail shows persons', () => {
    renderEhs('incidents')
    fireEvent.click(screen.getAllByText(/Kézsérülés/)[0])
    expect(screen.getAllByText(/Nagy János/).length).toBeGreaterThan(0)
  })

  it('renders risks screen with risk matrix', () => {
    renderEhs('risks')
    expect(screen.getAllByText('Kockázatok').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Val\. [123]/).length).toBeGreaterThan(0)
  })

  it('risks screen shows risk items', () => {
    renderEhs('risks')
    expect(screen.getAllByText(/Forgó alkatrészek/).length).toBeGreaterThan(0)
  })

  it('renders actions screen', () => {
    renderEhs('actions')
    expect(screen.getAllByText('Intézkedések').length).toBeGreaterThan(0)
  })

  it('actions screen shows action items with assignees', () => {
    renderEhs('actions')
    expect(screen.getAllByText(/Gábor Márton|Tóth Kinga|Nagy János/).length).toBeGreaterThan(0)
  })

  it('actions screen has checkboxes', () => {
    renderEhs('actions')
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
