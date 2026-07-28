import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@spaceos/portal-ui'
import { productionApiHandlers, resetProductionDb } from '@joinerytech/world-production/mocks'
import { ProductionWorldPage } from '../ProductionPage'

/**
 * A production-diszpécser app-oldali őre (a csomagbeli
 * productionFindings.regression.test M-1 párja): a dashboard által használt
 * screen-kulcsokra a diszpécser TÉNYLEG a célképernyőt rendereli. A teszt
 * app-oldalon él, mert a ProductionWorldPage app-tulajdon — a csomag-teszt
 * nem importálhat visszafelé az appból (workspace boundary-szabály).
 */

const server = setupServer(...productionApiHandlers)
const TIMEOUT = 15000

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetProductionDb()
  vi.restoreAllMocks()
})

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

describe('Production diszpécser — a dashboard-kulcsok célképernyőre oldódnak', () => {
  it('a célképernyők tényleg renderelnek a cutting/machining kulcsokra', async () => {
    const cutting = renderWorldRoute('/w/production/cutting')
    expect(await screen.findByRole('heading', { name: 'Szabászat', level: 2 })).toBeTruthy()
    cutting.unmount()

    renderWorldRoute('/w/production/machining')
    expect(await screen.findByRole('heading', { name: 'Megmunkálás', level: 2 })).toBeTruthy()
  }, TIMEOUT)
})
