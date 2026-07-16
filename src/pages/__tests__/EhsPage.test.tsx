import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { ehsApiHandlers, resetEhsDb } from '../../modules/ehs/mocks'
import { EhsWorldPage } from '../EhsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderEhs(path = '') {
  const url = path ? `/w/ehs/${path}` : '/w/ehs'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/ehs" element={<EhsWorldPage />} />
            <Route path="/w/ehs/:screen" element={<EhsWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

describe('EhsPage', () => {
  it('renders EHS dashboard', () => {
    renderEhs()
    expect(screen.getAllByText('EHS').length).toBeGreaterThan(0)
  })

  it('dashboard shows the new KPI cards (task 5)', () => {
    renderEhs()
    expect(screen.getByText('Lejáró SDS')).toBeTruthy()
    expect(screen.getByText('Nyitott CAPA')).toBeTruthy()
    expect(screen.getByText('Lejáró EVE')).toBeTruthy()
    expect(screen.getByText('Esedékes bejárás')).toBeTruthy()
    expect(screen.getByText('Magas kockázat')).toBeTruthy()
  })

  it('dashboard shows incident panel wired to the API', async () => {
    renderEhs()
    expect(screen.getByText('Legutóbbi események')).toBeTruthy()
    expect(await screen.findByText(/Targonca majdnem elütött/)).toBeTruthy()
  })

  it('mounts the incident report FAB in the EHS world (task 2)', () => {
    renderEhs()
    expect(screen.getByLabelText('Baleset bejelentése')).toBeTruthy()
  })

  it('renders incidents screen from the API', async () => {
    renderEhs('incidents')
    expect(screen.getAllByText('Események').length).toBeGreaterThan(0)
    expect(await screen.findByText(/Anyagleesés a polcrendszerről/)).toBeTruthy()
  })

  it('clicking an incident opens the detail SlideOver with FSM actions', async () => {
    renderEhs('incidents')
    fireEvent.click(await screen.findByText(/Targonca majdnem elütött/))
    expect(await screen.findByRole('button', { name: 'Kivizsgálás indítása' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Lezárás' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders risks screen with risk matrix', () => {
    renderEhs('risks')
    expect(screen.getAllByText('Kockázatok').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Forgó alkatrészek/).length).toBeGreaterThan(0)
  })

  it('renders SDS screen (task 4a)', async () => {
    renderEhs('sds')
    expect(screen.getAllByText('Veszélyes anyagok').length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Nitro hígító')).length).toBeGreaterThan(0)
  })

  it('renders PPE screen (task 4b)', async () => {
    renderEhs('ppe')
    expect(screen.getAllByText('EVE kiadások').length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: 'Átvétel' })).length).toBeGreaterThan(0)
  })

  it('renders walks screen (task 4c)', async () => {
    renderEhs('walks')
    expect(screen.getAllByText('Bejárások').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: 'CAPA tábla' })).toBeTruthy()
    expect((await screen.findAllByText('Ütemezett')).length).toBeGreaterThan(0)
  })

  it('legacy actions screen renders the unified CAPA board tab', async () => {
    renderEhs('actions')
    expect((await screen.findAllByText(/Szellőző-szűrő csere/)).length).toBeGreaterThan(0)
  })
})
