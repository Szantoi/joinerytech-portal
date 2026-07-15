import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { hrApiHandlers, resetHrDb } from '../../../mocks/hrApi'
import { HrDashboard } from '../HrDashboard'
import { PeopleScreen } from '../PeopleScreen'
import { CapacityScreen } from '../CapacityScreen'
import { AbsencesScreen } from '../AbsencesScreen'
import { SkillsScreen } from '../SkillsScreen'
import { TimeLogsScreen } from '../TimeLogsScreen'
import { createHrWrapper } from './hrTestUtils'

/** Smoke render tesztek a HR képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...hrApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetHrDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createHrWrapper()

// A teljes szvit párhuzamos terhelése alatt a render+fetch lassabb lehet, mint
// az 5 mp-es alap-timeout — a smoke tesztek bő keretet kapnak (bevált minta).
const SMOKE_TIMEOUT = 20_000

describe('HR képernyők — smoke render', () => {
  it('Áttekintés: KPI-k + túlterhelt- és kérelem-lista az API-ból', async () => {
    render(<HrDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Mai jelenlét')).toBeInTheDocument()
    expect(screen.getByText('Kapacitás-kihasználtság')).toBeInTheDocument()
    expect(screen.getByText('Túlterheltek')).toBeInTheDocument()
    expect(screen.getByText('Nyitott kérelmek')).toBeInTheDocument()
    // seed: Kiss András két átfedő beosztással túlterhelt
    expect((await screen.findAllByText('Kiss András')).length).toBeGreaterThan(0)
    // seed: Balogh Márk nyitott kérelme
    expect((await screen.findAllByText('Balogh Márk')).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Dolgozók: DataTable kettős render + részleg-szűrő chipek (S2-minta)', async () => {
    render(<PeopleScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Nagy János')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Horváth Éva')).length).toBeGreaterThan(0)

    // részleg-szűrő: tervezes → a gyártási dolgozó eltűnik (szerver-oldali szűrés)
    fireEvent.click(screen.getByRole('button', { name: 'Tervezés' }))
    await waitFor(() =>
      expect(screen.queryByText('Nagy János')).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText('Kovács Péter')).length).toBeGreaterThan(0)

    // S2-minta: az aktív chip nem csak színnel jelöl (pipa + font-semibold)
    const activeChip = screen.getByRole('button', { name: 'Tervezés', pressed: true })
    expect(activeChip.querySelector('svg')).toBeTruthy()
    expect(activeChip.className).toContain('font-semibold')
  }, SMOKE_TIMEOUT)

  it('Kapacitás-rács: saját görgethető régió (S1-minta) + túlterhelt cella + hét-léptetés', async () => {
    render(<CapacityScreen />, { wrapper: wrapper() })
    const region = await screen.findByRole('region', { name: /Kapacitás-rács/ })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')

    // seed: Kiss András túlterhelt (11/8) cellát kap; Tóth Kinga táppénz-cellát
    expect((await screen.findAllByText('Kiss András')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Betegszabadság').length).toBeGreaterThan(0)

    // hét-léptetés gombok
    expect(screen.getByRole('button', { name: '← Előző hét' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Következő hét →' }))
    expect(await screen.findByRole('region', { name: /Kapacitás-rács/ })).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Távollét: kérelmek FSM-pillekkel + státusz-szűrő', async () => {
    render(<AbsencesScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Balogh Márk')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Kért')).length).toBeGreaterThan(0)

    // szűrő: elutasitva → csak Varga László kérelme
    fireEvent.click(screen.getByRole('button', { name: 'Elutasítva' }))
    await waitFor(() =>
      expect(screen.queryByText('Balogh Márk')).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText('Varga László')).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Készség-mátrix: saját görgethető régió + szintezett cellák + lefedettség', async () => {
    render(<SkillsScreen />, { wrapper: wrapper() })
    const region = await screen.findByRole('region', { name: 'Készség-mátrix' })
    expect(region.className).toContain('overflow-x-auto')
    expect(region.getAttribute('tabindex')).toBe('0')

    expect(screen.getAllByText('CNC').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/3 · Mester/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Lefedettség \(10 fő\)/)).toBeInTheDocument()

    // készség-szűrő (szerver-oldali): csak a CNC-sek maradnak
    fireEvent.click(screen.getByRole('button', { name: 'CNC', pressed: false }))
    await waitFor(() =>
      expect(screen.queryByText(/Lefedettség \(10 fő\)/)).not.toBeInTheDocument(),
    )
  }, SMOKE_TIMEOUT)

  it('Munkaidő-napló: tételek átadási státusszal + push-gomb', async () => {
    render(<TimeLogsScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Átadásra vár')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Átadva').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: /Átadás a Kontrollingnak \(4\)/ }),
    ).toBeInTheDocument()
  }, SMOKE_TIMEOUT)
})
