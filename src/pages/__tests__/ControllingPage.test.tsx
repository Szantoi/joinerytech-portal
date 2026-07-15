import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { controllingApiHandlers, resetControllingDb } from '../../mocks/controllingApi'
import { ControllingWorldPage } from '../ControllingPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...controllingApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetControllingDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderCtrl(path = '') {
  const url = path ? `/w/kontrolling/${path}` : '/w/kontrolling'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/w/kontrolling" element={<ControllingWorldPage />} />
            <Route path="/w/kontrolling/:screen" element={<ControllingWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// A teljes szvit párhuzamos terhelése alatt a render+fetch lassabb lehet, mint
// az 5 mp-es alap-timeout (a smoke tesztekével azonos ok) — bő keret.
const ROUTE_TIMEOUT = 20_000

describe('ControllingPage (route-diszpécser, API-vezérelt képernyők)', () => {
  it('renders vezetői áttekintés with KPI cards from the API', async () => {
    renderCtrl()
    expect(await screen.findByText('Portfólió érték')).toBeTruthy()
    expect(screen.getByText('Kockázatos projekt')).toBeTruthy()
    expect(screen.getByText('EAC-túllépés')).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders portfolio DataTable with lifecycle pills', async () => {
    renderCtrl('portfolio')
    expect((await screen.findAllByText('Novitech iroda — 40 munkaállomás')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Vázlat')).length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('clicking a portfolio row opens the detail SlideOver with EAC breakdown', async () => {
    renderCtrl('portfolio')
    fireEvent.click((await screen.findAllByText(/Petőfi u\. 12/))[0])
    const dialog = await screen.findByRole('dialog')
    // S1: a kategória-tábla SAJÁT görgethető régióban él (spec 2.4 —
    // role="region" + aria-label + fókuszálható konténer, overflow-x-auto)
    const region = await screen.findByRole('region', { name: 'Kategória-bontás' })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')
    expect(screen.getByText('EAC (várható összköltség)')).toBeTruthy()
    expect(dialog).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders projekt-fedezet cards with margin percentages', async () => {
    renderCtrl('projects')
    expect((await screen.findAllByText(/Belváros Café/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terv-fedezet').length).toBeGreaterThan(0)
    expect(screen.getAllByText('EAC-fedezet').length).toBeGreaterThan(0)
  }, ROUTE_TIMEOUT)

  it('renders eltérés-elemzés with category rows', async () => {
    renderCtrl('variance')
    expect(await screen.findByRole('button', { name: /Anyag/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Munkaóra/ })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('renders utókalkuláció with seeded adjustments', async () => {
    renderCtrl('adjustments')
    expect(
      (await screen.findAllByText('Beszállítói jóváírás — élzárás reklamáció')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Új korrekció' })).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
