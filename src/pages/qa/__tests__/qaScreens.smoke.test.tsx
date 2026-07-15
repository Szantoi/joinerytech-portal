import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { qaApiHandlers, resetQaDb } from '../../../mocks/qaApi'
import { QaDashboard } from '../QaDashboard'
import { InspectionsScreen } from '../InspectionsScreen'
import { TicketsScreen } from '../TicketsScreen'
import { TrendScreen } from '../TrendScreen'
import { createQaWrapper } from './qaTestUtils'

/** Smoke render tesztek a QA képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...qaApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetQaDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createQaWrapper()

// A teljes szvit párhuzamos terhelése alatt a render+fetch lassabb lehet, mint
// az 5 mp-es alap-timeout — a smoke tesztek bő keretet kapnak (bevált minta).
const SMOKE_TIMEOUT = 20_000

describe('QA képernyők — smoke render', () => {
  it('Áttekintés: KPI-k + súlyosság-eloszlás + nyitott hibajegyek/átvizsgálások', async () => {
    render(<QaDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Nyitott hibajegy')).toBeInTheDocument()
    expect(screen.getByText('Átvizsgálási arány')).toBeInTheDocument()
    expect(screen.getByText('Megfelelési arány')).toBeInTheDocument()
    expect(screen.getByText('Gyártás-blokkoló')).toBeInTheDocument()
    // seed: a kritikus front-karc hibajegy a nyitott listában, elöl (prioritás-sorrend)
    expect((await screen.findAllByText(/Felületi karcolás/)).length).toBeGreaterThan(0)
    // súlyosság-eloszlás: sr-only szöveges összefoglaló is jár hozzá
    expect(screen.getByText(/Nyitott hibajegyek súlyosság szerint/)).toBeInTheDocument()
    // nyitott átvizsgálások panel a folyamatban lévő ajtólap-ellenőrzéssel
    expect(screen.getAllByText('Ajtólap minőségi ellenőrzés').length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Átvizsgálások: DataTable kettős render + státusz-szűrő chipek (S2-minta)', async () => {
    render(<InspectionsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Konyhabútor végső ellenőrzés')).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Státusz-szűrő' })).toBeTruthy()

    // szűrő: selejt → csak a két selejt-sor marad (szerver-oldali szűrés)
    fireEvent.click(screen.getByRole('button', { name: 'Selejt' }))
    await waitFor(() =>
      expect(screen.queryByText('Ajtólap minőségi ellenőrzés')).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText(/Korpusz alapanyag/)).length).toBeGreaterThan(0)

    // S2-minta: az aktív chip nem csak színnel jelöl (pipa + font-semibold)
    const activeChip = screen.getByRole('button', { name: 'Selejt', pressed: true })
    expect(activeChip.querySelector('svg')).toBeTruthy()
    expect(activeChip.className).toContain('font-semibold')
  }, SMOKE_TIMEOUT)

  it('Átvizsgálás-részletek: SlideOver checklist-tel, hibajegyzetekkel és blocking-pillel', async () => {
    render(<InspectionsScreen />, { wrapper: wrapper() })
    fireEvent.click((await screen.findAllByText(/Bognár konyhabútor front-sor/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    // checklist: soronkénti aria-label + a 6 szempont listaként
    const checklist = await screen.findByRole('list', { name: 'Ellenőrzési szempontok' })
    expect(checklist.querySelectorAll('li')).toHaveLength(6)
    // selejt kritikus ponton → Gyártás-blokkoló pill + hibajegyzetek
    expect(screen.getAllByText('Gyártás-blokkoló').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Felületi karcolás a front lapokon/).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Hibajegyek: alapból a nyitottak + státusz-szűrő chipek (szerver-oldali)', async () => {
    render(<TicketsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText(/Felületi karcolás/)).length).toBeGreaterThan(0)
    // a megoldott hibajegy a „Nyitott" szűrőben nem látszik
    expect(screen.queryByText(/Mérethiba — ajtólap/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Megoldva' }))
    expect((await screen.findAllByText(/Mérethiba — ajtólap/)).length).toBeGreaterThan(0)
    await waitFor(() =>
      expect(screen.queryByText(/Felületi karcolás/)).not.toBeInTheDocument(),
    )
  }, SMOKE_TIMEOUT)

  it('Trend: saját görgethető régió (S1-minta) + sr-only táblázat-alternatíva + hibatípus-eloszlás', async () => {
    render(<TrendScreen />, { wrapper: wrapper() })
    const region = await screen.findByRole('region', { name: /trend rács/i })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')

    // sr-only táblázat-alternatíva a vizuális rácshoz (M3-lecke)
    expect(screen.getByRole('table', { name: /Heti megfelelési trend adatai/ })).toBeInTheDocument()

    // hibatípus-eloszlás a seed hibajegyzeteiből (sr-only összefoglalóval)
    expect(screen.getByText(/Hibajegyzetek típus szerint/)).toBeInTheDocument()
    expect(screen.getAllByText('Karcolás').length).toBeGreaterThan(0)

    // metrika-összesítő (QAMetricsDto-tükör)
    expect(screen.getByText('Átlagos megoldási idő')).toBeInTheDocument()
  }, SMOKE_TIMEOUT)
})
