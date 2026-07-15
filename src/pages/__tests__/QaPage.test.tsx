import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { qaApiHandlers, resetQaDb } from '../../mocks/qaApi'
import { QualityWorldPage } from '../QualityPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...qaApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetQaDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderQa(path = '') {
  const url = path ? `/w/quality/${path}` : '/w/quality'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/quality" element={<QualityWorldPage />} />
            <Route path="/w/quality/:screen" element={<QualityWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// Teljes-suite párhuzamos terhelés alatt az 5 mp-es alap-timeout kevés lehet
// (a Kontrolling/HR/Maintenance route-tesztek bevált mintája).
const ROUTE_TIMEOUT = 20_000

describe('QaPage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders áttekintés with KPI cards from the API', async () => {
    renderQa()
    expect(await screen.findByText('Nyitott hibajegy')).toBeTruthy()
    expect(screen.getByText('Átvizsgálási arány')).toBeTruthy()
    expect(screen.getByText('Megfelelési arány')).toBeTruthy()
    expect(screen.getByText('Gyártás-blokkoló')).toBeTruthy()
    // a kritikus nyitott hibajegy a listában (prioritás-sorrend)
    expect((await screen.findAllByText(/Felületi karcolás/)).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders átvizsgálások with DataTable and status filter chips', async () => {
    renderQa('inspections')
    expect((await screen.findAllByText('Konyhabútor végső ellenőrzés')).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Státusz-szűrő' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('clicking an inspection opens the detail SlideOver with checklist and FSM stepper', async () => {
    renderQa('inspections')
    fireEvent.click((await screen.findAllByText(/Doorstar ajtó csomag/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Állapot-átmenetek')).toBeTruthy()
    expect(within(dialog).getByRole('list', { name: 'Átvizsgálás állapota' })).toBeTruthy()
    expect(within(dialog).getByRole('list', { name: 'Ellenőrzési szempontok' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders hibajegyek with status pills', async () => {
    renderQa('tickets')
    expect((await screen.findAllByText(/Felületi karcolás/)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Bejelentve')).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('clicking a ticket opens the detail SlideOver with the FSM stepper', async () => {
    renderQa('tickets')
    fireEvent.click((await screen.findAllByText(/Hiányzó kötőelem-csomag/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Állapot-átmenetek')).toBeTruthy()
    expect(within(dialog).getByRole('list', { name: 'Hibajegy állapota' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders trend as its own scrollable region with sr-only table', async () => {
    renderQa('trend')
    const region = await screen.findByRole('region', { name: /trend rács/i })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')
    expect(screen.getByRole('table', { name: /Heti megfelelési trend adatai/ })).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
