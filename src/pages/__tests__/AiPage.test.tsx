import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AiWorldPage } from '../AiPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

function renderAi(path = '') {
  const url = path ? `/w/ai/${path}` : '/w/ai'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/w/ai" element={<AiWorldPage />} />
        <Route path="/w/ai/:screen" element={<AiWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AiPage', () => {
  it('renders ai dashboard', () => {
    renderAi()
    expect(screen.getAllByText(/AI munkaterület/).length).toBeGreaterThan(0)
  })

  it('dashboard shows KPI cards', () => {
    renderAi()
    expect(screen.getAllByText('Ma indított sessionök').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tool hívások').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mentett receptek').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aktív ágensek').length).toBeGreaterThan(0)
  })

  it('dashboard shows agent list preview', () => {
    renderAi()
    expect(screen.getAllByText(/Értékesítési|Reklamáció|Gyártás/).length).toBeGreaterThan(0)
  })

  it('renders chat screen', () => {
    renderAi('chat')
    expect(screen.getAllByText(/AI Chat|Chat/).length).toBeGreaterThan(0)
  })

  it('chat shows empty state when no messages', () => {
    renderAi('chat')
    expect(screen.getByText(/Kezdj el egy beszélgetést/)).toBeTruthy()
  })

  it('chat shows input field', () => {
    renderAi('chat')
    expect(screen.getByPlaceholderText(/Írj üzenetet/)).toBeTruthy()
  })

  it('renders agents screen', () => {
    renderAi('agents')
    expect(screen.getAllByText(/Ágensek/).length).toBeGreaterThan(0)
  })

  it('agents screen shows agent names', () => {
    renderAi('agents')
    expect(screen.getAllByText(/Értékesítési|Reklamáció|Gyártás/).length).toBeGreaterThan(0)
  })

  it('clicking agent opens detail SlideOver', () => {
    renderAi('agents')
    fireEvent.click(screen.getAllByText(/Értékesítési asszisztens/)[0])
    expect(screen.getAllByText(/ag-sales/).length).toBeGreaterThan(0)
  })

  it('agent detail shows role/description', () => {
    renderAi('agents')
    fireEvent.click(screen.getAllByText(/Értékesítési asszisztens/)[0])
    expect(screen.getAllByText(/Ajánlatok|lead-minősítés|ügyfél-kommunikáció/).length).toBeGreaterThan(0)
  })

  it('agent detail shows skills list', () => {
    renderAi('agents')
    fireEvent.click(screen.getAllByText(/Értékesítési asszisztens/)[0])
    expect(screen.getAllByText(/Ajánlat-szövegező|Lead-minősítő|Email-piszkozat/).length).toBeGreaterThan(0)
  })

  it('renders skills screen', () => {
    renderAi('skills')
    expect(screen.getAllByText(/Receptek/).length).toBeGreaterThan(0)
  })

  it('skills screen shows skill names', () => {
    renderAi('skills')
    expect(screen.getAllByText(/Ajánlat|Lead|Reklamáció|Ütemezés/).length).toBeGreaterThan(0)
  })

  it('skills screen shows descriptions', () => {
    renderAi('skills')
    expect(screen.getAllByText(/generálása|pontozása|összefoglalás/).length).toBeGreaterThan(0)
  })

  it('agents screen shows stage badges', () => {
    renderAi('agents')
    expect(screen.getAllByText(/Aktív|Definiált|Várakozik/).length).toBeGreaterThan(0)
  })
})
