import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '../../components/ui'
import { productionApiHandlers, resetProductionDb, PRODUCTION_SEED_IDS } from '../../modules/production/mocks'
import { ProductionWorldPage } from '../ProductionPage'

/**
 * Production world route-diszpécser tesztje (MODULE-FOLDERS precedens,
 * QaPage/CrmPage mintája). A `cutting` screen-kulcs VÁLTOZATLAN (a Design
 * világ anyaglista-generálása erre navigál highlightPlanId state-tel) —
 * ezt a highlight-integrációt itt bizonyítjuk.
 */

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true, isLoading: false, token: 'mock',
    user: { profile: { name: 'Test User' } }, roles: ['Admin'],
  })),
}))

const server = setupServer(...productionApiHandlers)
const IDS = PRODUCTION_SEED_IDS

beforeAll(() => server.listen())
beforeEach(() => resetProductionDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Teljes-suite párhuzamos terhelés alatt az 5 mp-es alap-timeout kevés lehet
// (a QaPage/CrmPage route-tesztek bevált mintája — mind a findBy* várakozás,
// mind maga az it()-timeout megkapja).
const ROUTE_TIMEOUT = 20_000

function renderProduction(path = '', state?: unknown) {
  const url = path ? `/w/production/${path}` : '/w/production'
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[{ pathname: url, state }]}>
          <Routes>
            <Route path="/w/production" element={<ProductionWorldPage />} />
            <Route path="/w/production/:screen" element={<ProductionWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('ProductionWorldPage (route-diszpécser)', () => {
  it('dash: áttekintés KPI-kkal az API-ból', async () => {
    renderProduction()
    expect(await screen.findByText('Aktív vágóterv', {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('cutting: vágótervezés-képernyő (a route-kulcs a legacy Design-integráció miatt változatlan)', async () => {
    renderProduction('cutting')
    expect(await screen.findByText('Vágótervezés', {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('cutting + highlightPlanId state: kiválasztja és kiemeli a tervet (legacy DesignPage-integráció tükre)', async () => {
    renderProduction('cutting', { highlightPlanId: IDS.planDraft })
    const dialog = await screen.findByRole('dialog', {}, { timeout: ROUTE_TIMEOUT })
    expect(dialog).toBeTruthy()
    expect(await screen.findByText(
      `Vágóterv létrehozva: ${IDS.planDraft.slice(0, 8).toUpperCase()}`,
      {}, { timeout: ROUTE_TIMEOUT },
    )).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('machining: végrehajtás-képernyő', async () => {
    renderProduction('machining')
    expect(await screen.findByText('Végrehajtás', {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  // ⚠ A screen-tartalom h1-je szándékosan ugyanazt a magyar szót használja,
  // mint a WorldShell nav-címkéje (sidebar/breadcrumb/mobil fejléc/alsó nav) —
  // ezért az "Ajtórendelések"/"Árajánlatok"/"Elemzések"/"Munkafolyamat"
  // findByText TÖBBSZÖRÖS találatra futna. Egyedi, csak a képernyő-tartalomban
  // szereplő alcím-szöveggel azonosítjuk a renderelt képernyőt.
  it('orders: ajtórendelések-képernyő', async () => {
    renderProduction('orders')
    expect(await screen.findByText(/Calculating/, {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('quotes: árajánlatok-képernyő', async () => {
    renderProduction('quotes')
    expect(await screen.findByText(/PendingReview/, {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('analytics: elemzések-képernyő az őszinte gap-kártyával', async () => {
    renderProduction('analytics')
    expect(await screen.findByText('Hulladék-összesítő a valós kontraktusból', {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
    expect(await screen.findByText(/WORLDS-CUTTING-AUTHFIX/, {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)

  it('workflow: a kernel-scope legacy WorkflowPage marad (nem cutting/joinery kontraktus-hatókör)', async () => {
    renderProduction('workflow')
    expect(await screen.findByText('Felmérés', {}, { timeout: ROUTE_TIMEOUT })).toBeTruthy()
  }, ROUTE_TIMEOUT)
})
