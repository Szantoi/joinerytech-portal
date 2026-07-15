import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { dmsApiHandlers, resetDmsDb } from '../../../mocks/dmsApi'
import { DmsDashboard } from '../DmsDashboard'
import { LibraryScreen } from '../LibraryScreen'
import { ExpiringScreen } from '../ExpiringScreen'
import { createDmsWrapper } from './dmsTestUtils'

/** Smoke render tesztek a DMS képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...dmsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetDmsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createDmsWrapper()

// A teljes szvit párhuzamos terhelése alatt a render+fetch lassabb lehet, mint
// az 5 mp-es alap-timeout — a smoke tesztek bő keretet kapnak (bevált minta).
const SMOKE_TIMEOUT = 20_000

describe('DMS képernyők — smoke render', () => {
  it('Áttekintés: KPI-k + státusz-eloszlás (sr-only) + ellenőrzésre váró és lejáró listák', async () => {
    render(<DmsDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Összes dokumentum')).toBeInTheDocument()
    expect(screen.getAllByText('Kiadott').length).toBeGreaterThan(0)
    expect(screen.getByText('Ellenőrzésre vár')).toBeInTheDocument()
    expect(screen.getByText('Lejáró / lejárt')).toBeInTheDocument()
    // státusz-eloszlás: sr-only szöveges összefoglaló is jár hozzá
    expect(screen.getByText(/Dokumentumok státusz szerint/)).toBeInTheDocument()
    // ellenőrzésre váró panel a Doorstar rajzzal (seed: ellenorzes)
    expect(screen.getAllByText(/Doorstar ajtó sorozat/).length).toBeGreaterThan(0)
    // lejáró panel: az FSC tanúsítvány lejárt pill-lel
    expect(screen.getAllByText(/FSC eredetigazolás/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Könyvtár: DataTable kettős render + státusz/típus chipek (S2-minta) + kereső', async () => {
    render(<LibraryScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText(/Petőfi u\. 12\./)).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: 'Státusz-szűrő' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Típus-mappák' })).toBeTruthy()

    // szűrő: Archivált → csak az archivált sor marad (szerver-oldali szűrés)
    fireEvent.click(screen.getByRole('button', { name: 'Archivált', pressed: false }))
    await waitFor(() =>
      expect(screen.queryByText(/Petőfi u\. 12\./)).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText(/CE megfelelőségi nyilatkozat/)).length).toBeGreaterThan(0)

    // S2-minta: az aktív chip nem csak színnel jelöl (pipa + font-semibold)
    const activeChip = screen.getByRole('button', { name: 'Archivált', pressed: true })
    expect(activeChip.querySelector('svg')).toBeTruthy()
    expect(activeChip.className).toContain('font-semibold')

    // kereső (szerver-oldali q)
    fireEvent.click(screen.getByRole('button', { name: 'Mind' }))
    fireEvent.change(screen.getByLabelText('Keresés'), { target: { value: 'doorstar' } })
    await waitFor(() =>
      expect(screen.queryByText(/CE megfelelőségi nyilatkozat/)).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText(/Doorstar ajtó sorozat/)).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Dokumentum-részletek: SlideOver stepperrel, verziótörténettel és érvényes-verzió sávval', async () => {
    render(<LibraryScreen />, { wrapper: wrapper() })
    fireEvent.click((await screen.findAllByText(/Doorstar ajtó sorozat/))[0])
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(await within(dialog).findByRole('list', { name: 'Dokumentum állapota' })).toBeTruthy()
    // verziótörténet: 2 bejegyzés, soronkénti aria-labellel
    const history = within(dialog).getByRole('list', { name: 'Verziótörténet' })
    expect(history.querySelectorAll('li')).toHaveLength(2)
    // runtimeVersion-tükör: a műhely a kiadott v1-et használja
    expect(within(dialog).getByText(/A műhely a kiadott/)).toBeInTheDocument()
    expect(within(dialog).getByText('Érvényes (kiadott) verzió')).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Lejáró / felülvizsgálat: szerver-szűrt sorok (archivált nélkül), lejárt pill + config-ablak felirat', async () => {
    render(<ExpiringScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText(/FSC eredetigazolás/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bognár Bútor Kft\. — keretszerződés/).length).toBeGreaterThan(0)
    // az archivált (lejárt) CE és az ablakon kívüli SOP nem jelenik meg
    expect(screen.queryByText(/CE megfelelőségi nyilatkozat/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Élzárás munkautasítás/)).not.toBeInTheDocument()
    // a küszöb a configból számított feliratban
    expect(screen.getByText(/napos ablak/)).toBeInTheDocument()
    expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hamarosan lejár').length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)
})
