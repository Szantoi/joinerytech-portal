import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { hrApiHandlers, resetHrDb } from '../../modules/hr/mocks'
import { HrWorldPage } from '../HrPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...hrApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetHrDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderHr(path = '') {
  const url = path ? `/w/hr/${path}` : '/w/hr'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/hr" element={<HrWorldPage />} />
            <Route path="/w/hr/:screen" element={<HrWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// Teljes-suite párhuzamos terhelés alatt az 5 mp-es alap-timeout kevés lehet
// (a Kontrolling route-tesztek bevált mintája).
const ROUTE_TIMEOUT = 20_000

describe('HrPage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders áttekintés with KPI cards from the API', async () => {
    renderHr()
    expect(await screen.findByText('Mai jelenlét')).toBeTruthy()
    expect(screen.getByText('Kapacitás-kihasználtság')).toBeTruthy()
    expect(screen.getByText('Túlterheltek')).toBeTruthy()
    expect((await screen.findAllByText(/Nyitott kérelmek/)).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders dolgozók with employee DataTable and dept filter', async () => {
    renderHr('people')
    expect((await screen.findAllByText('Nagy János')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Kiss András')).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Részleg-szűrő' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('clicking an employee opens the profile SlideOver with skills', async () => {
    renderHr('people')
    fireEvent.click((await screen.findAllByText('Nagy János'))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Készségek')).toBeTruthy()
    expect(within(dialog).getByText('Munkaóra-napló')).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders kapacitás-rács as its own scrollable region', async () => {
    renderHr('capacity')
    const region = await screen.findByRole('region', { name: /Kapacitás-rács/ })
    expect(region.className).toContain('overflow-x-auto')
  }, ROUTE_TIMEOUT)

  it('renders távollét with FSM status pills', async () => {
    renderHr('absences')
    expect((await screen.findAllByText('Balogh Márk')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Kért')).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders készség-mátrix with coverage row', async () => {
    renderHr('skills')
    expect(await screen.findByRole('region', { name: 'Készség-mátrix' })).toBeTruthy()
    expect(await screen.findByText(/Lefedettség \(10 fő\)/)).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders munkaidő-napló with push button', async () => {
    renderHr('timelogs')
    expect((await screen.findAllByText('Átadásra vár')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Átadás a Kontrollingnak/ })).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
