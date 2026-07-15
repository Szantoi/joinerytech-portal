import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { dmsApiHandlers, resetDmsDb } from '../../mocks/dmsApi'
import { DocsWorldPage } from '../DocsPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...dmsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetDmsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderDms(path = '') {
  const url = path ? `/w/docs/${path}` : '/w/docs'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/docs" element={<DocsWorldPage />} />
            <Route path="/w/docs/:screen" element={<DocsWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// Teljes-suite párhuzamos terhelés alatt az 5 mp-es alap-timeout kevés lehet
// (a QA/Kontrolling/HR/Maintenance route-tesztek bevált mintája).
const ROUTE_TIMEOUT = 20_000

describe('DmsPage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders áttekintés with KPI cards from the API', async () => {
    renderDms()
    expect(await screen.findByText('Összes dokumentum')).toBeTruthy()
    expect(screen.getByText('Ellenőrzésre vár')).toBeTruthy()
    expect(screen.getByText('Lejáró / lejárt')).toBeTruthy()
    // az ellenőrzésre váró Doorstar rajz a listában
    expect((await screen.findAllByText(/Doorstar ajtó sorozat/)).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders könyvtár with DataTable and filter chips', async () => {
    renderDms('library')
    expect((await screen.findAllByText(/Petőfi u\. 12\./)).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Státusz-szűrő' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Típus-mappák' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('clicking a document opens the detail SlideOver with FSM stepper and version history', async () => {
    renderDms('library')
    fireEvent.click((await screen.findAllByText(/Doorstar ajtó sorozat/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Állapot-átmenetek')).toBeTruthy()
    expect(within(dialog).getByRole('list', { name: 'Dokumentum állapota' })).toBeTruthy()
    expect(within(dialog).getByRole('list', { name: 'Verziótörténet' })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders lejáró/felülvizsgálat with server-filtered rows', async () => {
    renderDms('expiring')
    expect((await screen.findAllByText(/FSC eredetigazolás/)).length).toBeGreaterThan(0)
    // az archivált lejárt CE nem akció-tétel — nem jelenik meg
    expect(screen.queryByText(/CE megfelelőségi nyilatkozat/)).toBeNull()
    expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('ismeretlen képernyő-kulcs a dashboardra esik vissza', async () => {
    renderDms('nincs-ilyen')
    expect(await screen.findByText('Összes dokumentum')).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
