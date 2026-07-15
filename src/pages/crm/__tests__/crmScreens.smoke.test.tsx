import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb } from '../../../mocks/crmApi'
import { CrmDashboard } from '../CrmDashboard'
import { PipelineScreen } from '../PipelineScreen'
import { LeadsScreen } from '../LeadsScreen'
import { OppsScreen } from '../OppsScreen'
import { TasksScreen } from '../TasksScreen'
import { ForecastScreen } from '../ForecastScreen'
import { createCrmWrapper } from './crmTestUtils'

/** Smoke render tesztek a CRM képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createCrmWrapper()

describe('CRM képernyők — smoke render', () => {
  it('Áttekintés: KPI-k a query hookokból + legutóbbi tevékenységek', async () => {
    render(<CrmDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Pipeline érték')).toBeInTheDocument()
    expect(screen.getByText('Súlyozott forecast')).toBeInTheDocument()
    expect(screen.getByText('Nyitott feladatok')).toBeInTheDocument()
    expect(screen.getByText('Lead-konverzió')).toBeInTheDocument()
    // seed: 2 lejárt feladat → SLA-sértés jelzés
    expect(await screen.findByText('2 SLA-sértés')).toBeInTheDocument()
    expect(await screen.findByText('Legutóbbi tevékenységek')).toBeInTheDocument()
  })

  it('Pipeline: fázis-oszlopok + kártyák + léptetés-gomb', async () => {
    render(<PipelineScreen />, { wrapper: wrapper() })
    expect(await screen.findByText('Vella Interior Design')).toBeInTheDocument()
    // nyitott fázis-oszlopok jelen vannak (accessible name: oszlop-név + darabszám)
    expect(screen.getByRole('region', { name: /^Igényfelmérés,/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Tárgyalás,/ })).toBeInTheDocument()
    // a nyitott kártyán van validált léptetés-gomb
    expect(
      (await screen.findAllByRole('button', { name: /Igényfelmérés indítása/ })).length,
    ).toBeGreaterThan(0)
  })

  it('Leadek: DataTable kettős render + státusz-pillek', async () => {
    render(<LeadsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Kele Márton')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Nurturing')).length).toBeGreaterThan(0)
  })

  it('Lehetőségek: DataTable + súlyozott érték oszlop (nyitott szűrő)', async () => {
    render(<OppsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Doorstar Hungary Zrt.')).length).toBeGreaterThan(0)
    expect(screen.getByText('Súlyozott')).toBeInTheDocument()
    // a nyitott szűrő nem mutatja a megnyert/elveszett sorokat
    expect(screen.queryByText('Bognár Bútor Kft.')).not.toBeInTheDocument()
  })

  it('Feladatok: SLA-jelvények (ok/soon/overdue) + teljesítés gomb', async () => {
    render(<TasksScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Késésben')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Hamarosan esedékes')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Határidőn belül')).length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: 'Teljesítés' })).length).toBeGreaterThan(0)
  })

  it('Forecast: KPI-k + fázis-táblázat', async () => {
    render(<ForecastScreen />, { wrapper: wrapper() })
    expect(await screen.findByText('Pipeline (bruttó)')).toBeInTheDocument()
    expect(screen.getByText('Megnyert (YTD)')).toBeInTheDocument()
    expect(
      await screen.findByRole('table', { name: /Forecast fázisonként/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Valószínűség')).toBeInTheDocument()
  })
})
