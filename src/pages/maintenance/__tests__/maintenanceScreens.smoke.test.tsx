import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { maintenanceApiHandlers, resetMaintenanceDb } from '../../../mocks/maintenanceApi'
import { MaintenanceDashboard } from '../MaintenanceDashboard'
import { AssetsScreen } from '../AssetsScreen'
import { WorkOrdersScreen } from '../WorkOrdersScreen'
import { ScheduleScreen } from '../ScheduleScreen'
import { createMaintenanceWrapper } from './maintenanceTestUtils'

/** Smoke render tesztek a Maintenance képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...maintenanceApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetMaintenanceDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createMaintenanceWrapper()

// A teljes szvit párhuzamos terhelése alatt a render+fetch lassabb lehet, mint
// az 5 mp-es alap-timeout — a smoke tesztek bő keretet kapnak (bevált minta).
const SMOKE_TIMEOUT = 20_000

describe('Maintenance képernyők — smoke render', () => {
  it('Áttekintés: KPI-k + esedékes tervek + nem üzemelő eszközök + nyitott munkalapok', async () => {
    render(<MaintenanceDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Esedékes megelőző')).toBeInTheDocument()
    expect(screen.getByText('Leállás')).toBeInTheDocument()
    expect(screen.getByText('Nyitott munkalap')).toBeInTheDocument()
    // seed: a Selco géptörésben (folyamatban lévő leállásos javítás)
    expect((await screen.findAllByText('Biesse Selco WN6')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Géptörés').length).toBeGreaterThan(0)
    // seed: a Rover üzemóra-terve esedékes
    expect(screen.getAllByText('Kenés + szűrőcsere (500 üó)').length).toBeGreaterThan(0)
    // nyitott munkalapok prioritás-sorrendben — a kritikus fűrészlap-törés elöl
    expect(screen.getAllByText(/Fűrészlap-törés/).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Eszközök: DataTable kettős render + kategória-szűrő chipek (S2-minta) + kereső', async () => {
    render(<AssetsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Holzma HPP380')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Biesse Rover CNC')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Üzemel').length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Kategória-szűrő' })).toBeTruthy()

    // kategória-szűrő: jármű → csak a Transporter marad (szerver-oldali szűrés)
    fireEvent.click(screen.getByRole('button', { name: 'Jármű' }))
    await waitFor(() =>
      expect(screen.queryByText('Holzma HPP380')).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText(/VW Transporter/)).length).toBeGreaterThan(0)

    // S2-minta: az aktív chip nem csak színnel jelöl (pipa + font-semibold)
    const activeChip = screen.getByRole('button', { name: 'Jármű', pressed: true })
    expect(activeChip.querySelector('svg')).toBeTruthy()
    expect(activeChip.className).toContain('font-semibold')
  }, SMOKE_TIMEOUT)

  it('Eszköz-részletek: SlideOver számított státusszal, tervekkel és munkalap-előzménnyel', async () => {
    render(<AssetsScreen />, { wrapper: wrapper() })
    fireEvent.click((await screen.findAllByText('Biesse Rover CNC'))[0])
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect((await screen.findAllByText('Kenés + szűrőcsere (500 üó)')).length).toBeGreaterThan(0)
    // az üzemóra-terv MOST esedékes → danger badge szöveggel (nem csak szín)
    expect(screen.getAllByText(/üó túllépés|esedékes \(üzemóra\)/).length).toBeGreaterThan(0)
    // munkalap-előzmény pillekkel
    expect((await screen.findAllByText(/X-tengely vibráció/)).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Munkalapok: alapból a nyitottak + státusz-szűrő chipek (szerver-oldali)', async () => {
    render(<WorkOrdersScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText(/Fűrészlap-törés/)).length).toBeGreaterThan(0)
    // a kesz munkalap a „Nyitott" szűrőben nem látszik
    expect(screen.queryByText('Elszívó-rendszer tisztítás')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Kész' }))
    expect((await screen.findAllByText('Elszívó-rendszer tisztítás')).length).toBeGreaterThan(0)
    await waitFor(() =>
      expect(screen.queryByText(/Fűrészlap-törés/)).not.toBeInTheDocument(),
    )
  }, SMOKE_TIMEOUT)

  it('Ütemterv: saját görgethető régió (S1-minta) + rács-cellák + sr-only alternatíva', async () => {
    render(<ScheduleScreen />, { wrapper: wrapper() })
    const region = await screen.findByRole('region', { name: /ütemterv-rács/i })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')

    // seed: az ütemezett megelőző (MWO-102) és a folyamatban lévő géptörés (MWO-103) a rácson
    expect(screen.getAllByText(/Negyedéves megelőző karbantartás/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fűrészlap-törés/).length).toBeGreaterThan(0)

    // sr-only lista-alternatíva a vizuális rácshoz (M3-lecke)
    expect(screen.getByRole('list', { name: 'Ütemezett munkalapok listája' })).toBeInTheDocument()
  }, SMOKE_TIMEOUT)
})
