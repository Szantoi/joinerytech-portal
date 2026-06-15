import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ExecBiWorldPage } from '../ExecBiPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderExecBi(path = '') {
  const url = path ? `/w/execbi/${path}` : '/w/execbi'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/execbi" element={<ExecBiWorldPage />} />
        <Route path="/w/execbi/:screen" element={<ExecBiWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExecBiPage', () => {
  it('renders execbi dashboard', () => {
    renderExecBi()
    expect(screen.getAllByText(/Vezetői BI/).length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderExecBi()
    expect(screen.getAllByText(/Havi árbevétel|Fedezet|Backlog|árbevétel/).length).toBeGreaterThan(0)
  })

  it('dashboard shows finance tab by default', () => {
    renderExecBi()
    expect(screen.getAllByText(/Pénzügy/).length).toBeGreaterThan(0)
  })

  it('finance tab shows revenue data', () => {
    renderExecBi()
    expect(screen.getAllByText(/17|árbevétel|Árbevétel/).length).toBeGreaterThan(0)
  })

  it('finance tab shows top customers', () => {
    renderExecBi()
    expect(screen.getAllByText(/Doorstar|Bognár/).length).toBeGreaterThan(0)
  })

  it('clicking production tab renders production content', () => {
    renderExecBi()
    fireEvent.click(screen.getAllByText('Gyártás')[0])
    expect(screen.getAllByText(/Aktív gép|terhelés|kihasználtság/).length).toBeGreaterThan(0)
  })

  it('clicking sales tab renders sales content', () => {
    renderExecBi()
    fireEvent.click(screen.getAllByText('Értékesítés')[0])
    expect(screen.getAllByText(/Pipeline|projekt|Aktív projekt/).length).toBeGreaterThan(0)
  })

  it('clicking HR tab renders HR content', () => {
    renderExecBi()
    fireEvent.click(screen.getAllByText('HR')[0])
    expect(screen.getAllByText(/Headcount|Létszám|Ma jelen/).length).toBeGreaterThan(0)
  })

  it('dashboard shows trend data', () => {
    renderExecBi()
    expect(screen.getAllByText(/Árbevétel trend|2026|2025/).length).toBeGreaterThan(0)
  })

  it('finance tab shows margin data', () => {
    renderExecBi()
    expect(screen.getAllByText(/25%|fedezet|Fedezet/).length).toBeGreaterThan(0)
  })

  it('finance tab shows top projects or backlog', () => {
    renderExecBi()
    expect(screen.getAllByText(/Backlog|Top 5|ügyfél/).length).toBeGreaterThan(0)
  })

  it('production tab shows machine data', () => {
    renderExecBi()
    fireEvent.click(screen.getAllByText('Gyártás')[0])
    expect(screen.getAllByText(/6|87%|gép/).length).toBeGreaterThan(0)
  })

  it('sales tab shows top projects', () => {
    renderExecBi()
    fireEvent.click(screen.getAllByText('Értékesítés')[0])
    expect(screen.getAllByText(/Petőfi|Doorstar|Belváros/).length).toBeGreaterThan(0)
  })

  it('execbi renders without errors', () => {
    const { container } = renderExecBi()
    expect(container).toBeTruthy()
  })

  it('tab switching works correctly', () => {
    renderExecBi()
    // Start on finance
    expect(screen.getAllByText(/Havi árbevétel|Top 5 ügyfél/).length).toBeGreaterThan(0)
    // Switch to HR
    fireEvent.click(screen.getAllByText('HR')[0])
    expect(screen.getAllByText(/Headcount|Ma jelen/).length).toBeGreaterThan(0)
    // Switch back to Pénzügy
    fireEvent.click(screen.getAllByText('Pénzügy')[0])
    expect(screen.getAllByText(/Havi árbevétel|Top 5 ügyfél/).length).toBeGreaterThan(0)
  })
})
