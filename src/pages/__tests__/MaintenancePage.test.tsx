import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { maintenanceApiHandlers, resetMaintenanceDb } from '../../modules/maintenance/mocks'
import { MaintenanceWorldPage } from '../MaintenancePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...maintenanceApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetMaintenanceDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderMnt(path = '') {
  const url = path ? `/w/maintenance/${path}` : '/w/maintenance'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/maintenance" element={<MaintenanceWorldPage />} />
            <Route path="/w/maintenance/:screen" element={<MaintenanceWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// Teljes-suite párhuzamos terhelés alatt az 5 mp-es alap-timeout kevés lehet
// (a Kontrolling/HR route-tesztek bevált mintája).
const ROUTE_TIMEOUT = 20_000

describe('MaintenancePage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders áttekintés with KPI cards from the API', async () => {
    renderMnt()
    expect(await screen.findByText('Esedékes megelőző')).toBeTruthy()
    expect(screen.getByText('Leállás')).toBeTruthy()
    expect(screen.getByText('Nyitott munkalap')).toBeTruthy()
    // számított eszköz-státusz a nem üzemelő panelben
    expect((await screen.findAllByText('Géptörés')).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders eszközök with asset DataTable and kind filter', async () => {
    renderMnt('assets')
    expect((await screen.findAllByText('Holzma HPP380')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Biesse Rover CNC')).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Kategória-szűrő' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('clicking an asset opens the detail SlideOver with plans', async () => {
    renderMnt('assets')
    fireEvent.click((await screen.findAllByText('Holzma HPP380'))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/Megelőző tervek/)).toBeTruthy()
    expect(within(dialog).getByText(/Munkalapok/)).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders munkalapok with FSM status pills', async () => {
    renderMnt('workorders')
    expect((await screen.findAllByText(/Fűrészlap-törés/)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Folyamatban')).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders ütemterv as its own scrollable region', async () => {
    renderMnt('schedule')
    const region = await screen.findByRole('region', { name: /ütemterv-rács/i })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')
  }, ROUTE_TIMEOUT)

  it('clicking a work order opens the detail SlideOver with the FSM stepper', async () => {
    renderMnt('workorders')
    fireEvent.click((await screen.findAllByText(/X-tengely vibráció/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Állapot-átmenetek')).toBeTruthy()
    // FsmStepper fő út
    expect(within(dialog).getByRole('list', { name: 'Munkalap állapota' })).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
