import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { productionApiHandlers, resetProductionDb, PRODUCTION_SEED_IDS } from '../../mocks'
import { ProductionDashboard } from '../ProductionDashboard'
import { CuttingPlansScreen } from '../CuttingPlansScreen'
import { CuttingExecutionScreen } from '../CuttingExecutionScreen'
import { DoorOrdersScreen } from '../DoorOrdersScreen'
import { QuotesScreen } from '../QuotesScreen'
import { CuttingAnalyticsScreen } from '../CuttingAnalyticsScreen'
import { createProductionWrapper } from './productionTestUtils'

/** Smoke render tesztek a production képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...productionApiHandlers)
const IDS = PRODUCTION_SEED_IDS

beforeAll(() => server.listen())
beforeEach(() => resetProductionDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const SMOKE_TIMEOUT = 20_000

describe('Production képernyők — smoke render', () => {
  it('Áttekintés: KPI-k + vágótervek/rendelések/végrehajtás/hulladék-összesítő', async () => {
    render(<ProductionDashboard onScreen={() => {}} />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText('Aktív vágóterv')).toBeInTheDocument()
    expect(screen.getByText('Futó végrehajtás')).toBeInTheDocument()
    expect(screen.getByText('Rendelés kalkulációban')).toBeInTheDocument()
    expect(screen.getByText('Döntésre váró ajánlat')).toBeInTheDocument()
    expect((await screen.findAllByText(IDS.planDraft)).length).toBeGreaterThan(0)
    expect(screen.getByText('Hulladék-összesítő')).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Vágótervezés: lista + részlet-SlideOver FSM-akciókkal (disabledReason a tiltott átmenetre)', async () => {
    render(<CuttingPlansScreen />, { wrapper: createProductionWrapper() })
    const draftRow = await screen.findByText(IDS.planDraft)
    fireEvent.click(draftRow)

    await screen.findByRole('dialog')
    // Draft-terven: fagyasztás/lezárás tiltott (aria-disabled, NEM rejtett) —
    // a terv-adat aszinkron töltődik be a SlideOverben, ezért findByRole vár rá.
    const freezeBtn = await screen.findByRole('button', { name: 'Fagyasztás' })
    expect(freezeBtn.getAttribute('aria-disabled')).toBe('true')
  }, SMOKE_TIMEOUT)

  it('Végrehajtás: státusz-szűrő chipek + részlet-SlideOver idővonallal', async () => {
    render(<CuttingExecutionScreen />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText(IDS.execScheduled)).toBeInTheDocument()
    // alapból "Nyitott (aktív)" szűrő — a Completed/Cancelled/Failed nem látszik
    expect(screen.queryByText(IDS.execCompleted)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mind' }))
    expect(await screen.findByText(IDS.execCompleted)).toBeInTheDocument()

    fireEvent.click(screen.getByText(IDS.execInProgress))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(await screen.findByText('Esemény-idővonal')).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Ajtórendelések: lapozott lista + részlet-SlideOver gap-jelöléssel', async () => {
    render(<DoorOrdersScreen />, { wrapper: createProductionWrapper() })
    const row = await screen.findByText(/Bognár családi ház/)
    fireEvent.click(row)

    await screen.findByRole('dialog')
    // gap-jelölés: az elérhetetlen szakasz tooltippel, NEM interaktív gombként
    // (a rendelés-adat aszinkron töltődik be, ezért findByText vár rá)
    expect(await screen.findByText(/Gyártásban \/ Elkészült/)).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Árajánlatok: szűrő + jóváhagyás-SlideOver', async () => {
    render(<QuotesScreen />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText('Kiss Ágnes')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Jóváhagyás' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Jóváhagyás küldése')).toBeInTheDocument())
  }, SMOKE_TIMEOUT)

  it('Elemzések: valós waste-összesítő + őszinte gap-kártya az OEE/anyagfelhasználásra', async () => {
    render(<CuttingAnalyticsScreen />, { wrapper: createProductionWrapper() })
    expect(await screen.findByText('Összes hulladék')).toBeInTheDocument()
    expect(screen.getByText(/WORLDS-CUTTING-AUTHFIX/)).toBeInTheDocument()
  }, SMOKE_TIMEOUT)
})
