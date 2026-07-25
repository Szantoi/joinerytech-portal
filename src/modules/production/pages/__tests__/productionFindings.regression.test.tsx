import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../../components/ui'
import { productionApiHandlers, resetProductionDb, PRODUCTION_SEED_IDS } from '../../mocks'
import { CUTTING_API, JOINERY_ORDERS_API } from '../../services/config'
import { ProductionDashboard } from '../ProductionDashboard'
import { ExecutionDetailSlideOver } from '../ExecutionDetailSlideOver'
import { DoorOrdersScreen } from '../DoorOrdersScreen'
import { CuttingExecutionScreen } from '../CuttingExecutionScreen'
import { CuttingPlansScreen } from '../CuttingPlansScreen'
import { ProductionWorldPage } from '../../../../pages/ProductionPage'
import { createProductionWrapper } from './productionTestUtils'

/**
 * A WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24 findingjeinek regressziós őrei.
 * Egy teszt = egy finding, a riport számozásával. Ami jsdom-ban nem mérhető
 * (M-7 mobil összenyomás, M-8 tooltip-túllógás, M-10 érintési zóna), az a
 * böngésző-szintű `npm run test:smoke:keyboard` scriptben van bizonyítva —
 * ott a valós layout dönt.
 */

const server = setupServer(...productionApiHandlers)
const IDS = PRODUCTION_SEED_IDS
const TIMEOUT = 20_000

beforeAll(() => server.listen())
beforeEach(() => resetProductionDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

/** Router-teljes wrapper a világ-diszpécser (ProductionWorldPage) teszteléséhez. */
function renderWorldRoute(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/w/production" element={<ProductionWorldPage />} />
            <Route path="/w/production/:screen" element={<ProductionWorldPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('M-1 — a dashboard szekció-linkjei LÉTEZŐ képernyő-kulcsra navigálnak', () => {
  it('a Vágástervezés/Végrehajtás link a diszpécser kulcsait adja (cutting/machining)', async () => {
    const onScreen = vi.fn()
    render(<ProductionDashboard onScreen={onScreen} />, { wrapper: createProductionWrapper() })
    await screen.findByText('Aktív vágóterv')

    fireEvent.click(screen.getByRole('button', { name: 'Vágástervezés →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Végrehajtás →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rendelések →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Elemzések →' }))

    expect(onScreen.mock.calls.map(([key]) => key)).toEqual(['cutting', 'machining', 'orders', 'analytics'])
  }, TIMEOUT)

  it('a célképernyők tényleg renderelnek ezekre a kulcsokra (a másik vég)', async () => {
    const cutting = renderWorldRoute('/w/production/cutting')
    expect(await screen.findByRole('heading', { name: 'Vágótervezés' })).toBeInTheDocument()
    cutting.unmount()

    renderWorldRoute('/w/production/machining')
    expect(await screen.findByRole('heading', { name: 'Végrehajtás' })).toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-4 — DoorOrder createdAt: nem perzisztált mező, nem írunk ki dátumot', () => {
  it('a lista nem mutat létrehozási dátumot, de kimondja, miért', async () => {
    render(<DoorOrdersScreen />, { wrapper: createProductionWrapper() })
    const row = await screen.findByText(/Bognár családi ház/)

    // A seed sentinel-értéke (0001-01-01) sem szivároghat ki a felületre.
    expect(row.parentElement?.textContent).not.toMatch(/0001/)
    expect(screen.getByText(/nem perzisztálja a rendelés létrehozási idejét/)).toBeInTheDocument()
  }, TIMEOUT)

  it('a részlet-panel „—"-t mutat a Létrehozva mezőben, magyarázattal', async () => {
    render(<DoorOrdersScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(/Bognár családi ház/))
    await screen.findByRole('dialog')

    const label = await screen.findByText('Létrehozva')
    const value = label.nextElementSibling
    expect(value?.textContent).toMatch(/^—/)
    expect(value?.getAttribute('title')).toMatch(/nem perzisztálja/)
  }, TIMEOUT)
})

describe('M-6 — a rendelés-KPI bevallja, ha csak a lekért lapot vizsgálta', () => {
  it('totalCount > lekért sorok → az alcím „vizsgált"-ként fogalmaz', async () => {
    server.use(
      http.get(JOINERY_ORDERS_API, () =>
        HttpResponse.json({
          items: [{
            id: 'ord-1', tenantId: 't', flowEpicId: 'FE', projectId: 'P', projectName: 'Egy rendelés',
            status: 'Draft', itemCount: 1, deliveryDate: null, createdAt: '0001-01-01T00:00',
          }],
          totalCount: 250, page: 1, pageSize: 100,
        }),
      ),
    )
    render(<ProductionDashboard onScreen={() => {}} />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText('1 vizsgált rendelésből (250 összesen)')).toBeInTheDocument()
  }, TIMEOUT)

  it('teljes lefedettségnél a régi, tömör alcím marad', async () => {
    render(<ProductionDashboard onScreen={() => {}} />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText('7 ajtórendelés összesen')).toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-9 — a mérföldkő-lista magyar címkét mutat, nem wire-tagnevet', () => {
  it('PanelCompletion → „Panel-teljesítés"', async () => {
    render(<CuttingExecutionScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.execInProgress))
    await screen.findByRole('dialog')

    expect(await screen.findByText('Panel-teljesítés')).toBeInTheDocument()
    expect(screen.queryByText('PanelCompletion')).not.toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-11 — a detail-SlideOverek hibaága: nem örök „Betöltés…"', () => {
  it('a terv-részlet 500-as válaszra hibát és Újra gombot mutat', async () => {
    server.use(
      http.get(`${CUTTING_API}/planning/:planId`, () => new HttpResponse(null, { status: 500 })),
    )
    render(<CuttingPlansScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.planDraft))

    const dialog = await screen.findByRole('dialog')
    await waitFor(
      () => {
        expect(within(dialog).queryByText('Betöltés…')).not.toBeInTheDocument()
      },
      { timeout: 10_000 },
    )
    expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Újra' })).toBeInTheDocument()
  }, TIMEOUT)

  it('a rendelés-részlet 500-as válaszra hibát és Újra gombot mutat', async () => {
    server.use(http.get(`${JOINERY_ORDERS_API}/:id`, () => new HttpResponse(null, { status: 500 })))
    render(<DoorOrdersScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(/Bognár családi ház/))

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Újra' })).toBeInTheDocument()
    expect(within(dialog).queryByText('Betöltés…')).not.toBeInTheDocument()
  }, TIMEOUT)

  it('a végrehajtás-részlet 500-as válaszra hibát és Újra gombot mutat', async () => {
    server.use(http.get(`${CUTTING_API}/executions/:id`, () => new HttpResponse(null, { status: 500 })))
    render(<CuttingExecutionScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.execInProgress))

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Újra' })).toBeInTheDocument()
  }, TIMEOUT)

  it('a prioritás-profilok hibája kimondja, hogy emiatt blokkolt a publikálás', async () => {
    server.use(
      http.get(`${CUTTING_API}/priority-profiles/`, () => new HttpResponse(null, { status: 500 })),
    )
    render(<CuttingPlansScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.planDraft))
    await screen.findByRole('dialog')

    expect(await screen.findByText(/A prioritás-profilok nem tölthetők be/)).toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-12 — idővonal: üres ≠ hiba', () => {
  it('a progress-lekérés hibája NEM „Nincs rögzített esemény."', async () => {
    server.use(
      http.get(`${CUTTING_API}/executions/:id/progress`, () => new HttpResponse(null, { status: 500 })),
    )
    render(<CuttingExecutionScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.execInProgress))
    await screen.findByRole('dialog')
    await screen.findByText('Esemény-idővonal')

    await waitFor(() => {
      expect(screen.getByText(/esemény-idővonal betöltése nem sikerült/)).toBeInTheDocument()
    })
    expect(screen.queryByText('Nincs rögzített esemény.')).not.toBeInTheDocument()
  }, TIMEOUT)

  it('a mérföldkő-lekérés hibája NEM „Nincs mérföldkő."', async () => {
    server.use(
      http.get(`${CUTTING_API}/executions/:id/milestones`, () => new HttpResponse(null, { status: 500 })),
    )
    render(<CuttingExecutionScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(IDS.execInProgress))
    await screen.findByRole('dialog')
    await screen.findByText('Mérföldkövek')

    await waitFor(() => {
      expect(screen.getByText(/mérföldkövek betöltése nem sikerült/)).toBeInTheDocument()
    })
    expect(screen.queryByText('Nincs mérföldkő.')).not.toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-3 — api módban az aláírás-függő akciók letiltottak (a BEKÖTÉS, nem csak a guard)', () => {
  it('api módban start/progress/complete tiltott, a cancel viszont nem', async () => {
    render(
      <ExecutionDetailSlideOver executionId={IDS.execScheduled} onClose={() => {}} apiMode />,
      { wrapper: createProductionWrapper() },
    )
    await screen.findByRole('dialog')

    const start = await screen.findByRole('button', { name: 'Indítás' })
    expect(start.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('button', { name: 'Panel kész' }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('button', { name: 'Lezárás' }).getAttribute('aria-disabled')).toBe('true')
    // A cancel nem aláírás-függő — Scheduled állapotból engedélyezett marad.
    expect(screen.getByRole('button', { name: 'Megszakítás' }).getAttribute('aria-disabled')).toBeNull()
    expect(screen.getAllByText(/eszköz-integráció/).length).toBeGreaterThan(0)
  }, TIMEOUT)

  it('mock módban (alapértelmezés) az Indítás engedélyezett — a demó nem sérül', async () => {
    render(
      <ExecutionDetailSlideOver executionId={IDS.execScheduled} onClose={() => {}} />,
      { wrapper: createProductionWrapper() },
    )
    await screen.findByRole('dialog')
    const start = await screen.findByRole('button', { name: 'Indítás' })
    expect(start.getAttribute('aria-disabled')).toBeNull()
    expect(screen.queryByText(/eszköz-integráció/)).not.toBeInTheDocument()
  }, TIMEOUT)
})

describe('M-5 — a kalkuláció-toast a saját nevén nevezi a két számot', () => {
  it('szabásjegyzék-sor ≠ ajtótétel', async () => {
    render(<DoorOrdersScreen />, { wrapper: createProductionWrapper() })
    fireEvent.click(await screen.findByText(/Bognár családi ház/))
    await screen.findByRole('dialog')

    fireEvent.click(await screen.findByRole('button', { name: 'Kalkuláció indítása' }))
    // seed: ordDraft = 3 ajtótétel, a szabásjegyzék 1 sor
    expect(await screen.findByText('Kalkuláció kész — 1 szabásjegyzék-sor (3 ajtótétel)')).toBeInTheDocument()
  }, TIMEOUT)
})
