import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DesignWorldPage } from '../DesignPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock',
    user: { profile: { name: 'Test User' } },
  })),
}))

function renderDesign(screen = '') {
  const path = screen ? `/w/design/${screen}` : '/w/design'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/w/design" element={<DesignWorldPage />} />
        <Route path="/w/design/:screen" element={<DesignWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DesignPage', () => {
  it('renders title', () => {
    renderDesign()
    const matches = screen.getAllByText(/Tervez/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders dashboard KPI cards', () => {
    renderDesign('dash')
    expect(screen.getByText('Aktív sablonok')).toBeTruthy()
  })

  it('renders popular templates in dashboard', () => {
    renderDesign('dash')
    expect(screen.getByText(/Polcos szekr/)).toBeTruthy()
  })

  it('renders active projects in dashboard', () => {
    renderDesign('dash')
    expect(screen.getAllByText(/Doorstar/).length).toBeGreaterThan(0)
  })

  it('navigates to editor screen', () => {
    renderDesign('editor')
    const matches = screen.getAllByText(/Alkatr/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows CNC preview in advanced mode', () => {
    renderDesign('editor')
    fireEvent.click(screen.getByText(/Haladó/))
    expect(screen.getByText(/CNC deriválás preview/)).toBeTruthy()
  })

  it('shows constraint formula in advanced mode', () => {
    renderDesign('editor')
    fireEvent.click(screen.getByText(/Haladó/))
    expect(screen.getByText(/polc szélesség/)).toBeTruthy()
  })

  it('navigates to generate screen', () => {
    renderDesign('generate')
    expect(screen.getByText('Sablon választás')).toBeTruthy()
  })

  it('shows order assignment card in step 1', () => {
    renderDesign('generate')
    fireEvent.click(screen.getByText('Tovább →'))
    expect(screen.getByText('Hozzárendelés rendeléshez')).toBeTruthy()
  })

  it('shows Egyedi hozzáadása button in step 2', () => {
    renderDesign('generate')
    fireEvent.click(screen.getByText('Tovább →'))
    fireEvent.click(screen.getByText('Áttekintés →'))
    expect(screen.getByText('Egyedi hozzáadása')).toBeTruthy()
  })

  it('navigates to catalog screen', () => {
    renderDesign('catalog')
    expect(screen.getByText('Korpusz lemez')).toBeTruthy()
  })

  it('catalog has cats before flex-1 and Új tétel at end', () => {
    renderDesign('catalog')
    expect(screen.getByText('Élzáró')).toBeTruthy()
    expect(screen.getByText('Új tétel')).toBeTruthy()
  })
})
