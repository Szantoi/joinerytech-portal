import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { crmApiHandlers, resetCrmDb } from '../../mocks/crmApi'
import { CrmWorldPage } from '../CrmPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderCrm(path = '') {
  const url = path ? `/w/crm/${path}` : '/w/crm'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/crm" element={<CrmWorldPage />} />
            <Route path="/w/crm/:screen" element={<CrmWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

describe('CrmPage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders CRM dashboard with KPI cards from the API', async () => {
    renderCrm()
    expect(await screen.findByText('Pipeline érték')).toBeTruthy()
    expect(screen.getByText('Súlyozott forecast')).toBeTruthy()
    expect(screen.getByText('Lead-konverzió')).toBeTruthy()
  })

  it('dashboard shows recent activities', async () => {
    renderCrm()
    expect(await screen.findByText('Legutóbbi tevékenységek')).toBeTruthy()
  })

  it('renders pipeline kanban with stage columns', async () => {
    renderCrm('pipeline')
    expect((await screen.findAllByText('Igényfelmérés')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tárgyalás').length).toBeGreaterThan(0)
    expect(await screen.findByText('Vella Interior Design')).toBeTruthy()
  })

  it('renders lead list from the API', async () => {
    renderCrm('leads')
    expect((await screen.findAllByText('Kele Márton')).length).toBeGreaterThan(0)
  })

  it('lead list filter works (server-side)', async () => {
    renderCrm('leads')
    await screen.findAllByText('Kele Márton')
    fireEvent.click(screen.getAllByRole('button', { name: 'Elvetve' })[0])
    expect((await screen.findAllByText('Tarr Niké')).length).toBeGreaterThan(0)
  })

  it('clicking a lead opens the detail SlideOver with FSM actions', async () => {
    renderCrm('leads')
    fireEvent.click((await screen.findAllByText('Kele Márton'))[0])
    const dialog = await screen.findByRole('dialog')
    // új leadnél: contact engedélyezett, qualify tiltott (aria-disabled)
    expect(await within(dialog).findByRole('button', { name: 'Kapcsolatfelvétel' })).not.toHaveAttribute('aria-disabled')
    expect(within(dialog).getByRole('button', { name: 'Minősítés' })).toHaveAttribute('aria-disabled', 'true')
    expect(within(dialog).getByText(/Tevékenységnapló/)).toBeTruthy()
  })

  it('renders opportunity list with weighted column', async () => {
    renderCrm('opps')
    expect((await screen.findAllByText('Doorstar Hungary Zrt.')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Súlyozott').length).toBeGreaterThan(0)
  })

  it('renders tasks screen with SLA badges', async () => {
    renderCrm('tasks')
    expect((await screen.findAllByText('Késésben')).length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: 'Teljesítés' })).length).toBeGreaterThan(0)
  })

  it('renders forecast screen with stage table', async () => {
    renderCrm('forecast')
    expect(await screen.findByText('Pipeline (bruttó)')).toBeTruthy()
    expect(screen.getByText('Megnyert (YTD)')).toBeTruthy()
    expect(screen.getByText('Valószínűség')).toBeTruthy()
  })
})
