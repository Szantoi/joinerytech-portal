import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import {
  qaApiHandlers, resetQaDb, getQaDb, QA_SEED_IDS,
} from '../../../mocks/qaApi'
import { qaPermissionStub } from '../../../services/qa'
import { InspectionsScreen } from '../InspectionsScreen'
import { TicketsScreen } from '../TicketsScreen'
import { createQaWrapper } from './qaTestUtils'

/**
 * QA FSM-folyam UI-tesztek — a tiltott átmenet-gomb NEM rejtett, hanem
 * aria-disabled + tooltip (disabledReason); az engedélyezett akció végigmegy
 * (MSW store + rule-6 invalidálás: a lista is frissül); a payload-guardok
 * (hibajegyzet/intézkedés-építő), az eszkaláció-guard és a jogosultság-stub
 * (qa.manage) tiltása is magyarázott gombot ad. A kapcsolt hibajegy-nyitás a
 * kereszt-invalidálást is fedi (openTickets a detailben).
 */

const server = setupServer(...qaApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => { resetQaDb(); qaPermissionStub.manage = true })
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const FLOW_TIMEOUT = 20_000
const IDS = QA_SEED_IDS

async function openDetail(text: string | RegExp) {
  fireEvent.click((await screen.findAllByText(text))[0])
  return within(await screen.findByRole('dialog'))
}

/** A blokkolt gomb saját tooltipje (a Button a wrapper-spanbe rendereli). */
function tooltipOf(button: HTMLElement): HTMLElement {
  return within(button.parentElement as HTMLElement).getByRole('tooltip')
}

function inspectionStatus(id: string): string | undefined {
  return getQaDb().inspections.find((i) => i.id === id)?.status
}

function ticketStatus(id: string): string | undefined {
  return getQaDb().tickets.find((t) => t.id === id)?.status
}

describe('átvizsgálás — FSM-folyam a UI-ban', () => {
  it('nyitott átvizsgáláson: start engedélyezett; pass/fail aria-disabled + tooltip, kattintás elnyelt', async () => {
    render(<InspectionsScreen />, { wrapper: createQaWrapper() })
    // az INSP-201 a legfrissebb tervezett → az első „Konyhabútor végső ellenőrzés" sor
    const d = await openDetail(/Bognár konyhabútor sor/)

    const start = await d.findByRole('button', { name: 'Megkezdés' })
    expect(start).not.toHaveAttribute('aria-disabled')

    for (const name of ['Megfelelt — lezárás', 'Selejtezés']) {
      const btn = d.getByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('státuszból indítható')
    }
    // hibajegy csak selejtből nyitható — magyarázott tiltás
    const ticketBtn = d.getByRole('button', { name: 'Hibajegy nyitása' })
    expect(ticketBtn).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(ticketBtn)).toHaveTextContent('selejt állapotú')

    // a tiltott gomb kattintása elnyelt: a store nem változik
    fireEvent.click(d.getByRole('button', { name: 'Selejtezés' }))
    expect(inspectionStatus(IDS.inspPlanned)).toBe('nyitott')
  }, FLOW_TIMEOUT)

  it('start-folyam: nyitott → folyamatban — a gombok átbillennek, a store átáll', async () => {
    render(<InspectionsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Bognár konyhabútor sor/)

    fireEvent.click(await d.findByRole('button', { name: 'Megkezdés' }))

    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Megkezdés' })).toHaveAttribute('aria-disabled', 'true')
    })
    expect(d.getByRole('button', { name: 'Megfelelt — lezárás' })).not.toHaveAttribute('aria-disabled')
    expect(inspectionStatus(IDS.inspPlanned)).toBe('folyamatban')
  }, FLOW_TIMEOUT)

  it('selejtezés-folyam: hibajegyzet nélkül magyarázottan tiltott beküldés; jegyzettel selejt + lista-frissülés (rule-6)', async () => {
    render(<InspectionsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Doorstar ajtó csomag/)

    fireEvent.click(await d.findByRole('button', { name: 'Selejtezés' }))
    const submit = await d.findByRole('button', { name: 'Selejtezés megerősítése' })

    // üres építővel a beküldés aria-disabled + tooltip, a kattintás elnyelt
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('legalább egy hibajegyzet')
    fireEvent.click(submit)
    expect(inspectionStatus(IDS.inspInProgress)).toBe('folyamatban')

    // hibajegyzet hozzáadása az építőben → a beküldés felszabadul
    fireEvent.change(d.getByLabelText('Leírás'), { target: { value: 'Furnér-hólyagosodás 3 lapon' } })
    fireEvent.click(d.getByRole('button', { name: 'Hibajegyzet hozzáadása' }))
    fireEvent.click(d.getByRole('button', { name: 'Selejtezés megerősítése' }))

    await waitFor(() => {
      expect(inspectionStatus(IDS.inspInProgress)).toBe('selejt')
    })
    // rule-6: a lista-cache invalidálódott → a sor pillje Selejt-re vált
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).getAllByText('Selejt').length).toBeGreaterThanOrEqual(3)
    })
  }, FLOW_TIMEOUT)

  it('kapcsolt hibajegy nyitása selejt-átvizsgálásból → openTickets kereszt-frissül a detailben', async () => {
    render(<InspectionsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Bognár konyhabútor front-sor/)

    expect(await d.findByText(/kapcsolt nyitott hibajegy: 1/)).toBeInTheDocument()

    fireEvent.click(d.getByRole('button', { name: 'Hibajegy nyitása' }))
    // az űrlap az első hibajegyzetből előtöltött (cím + leírás) — csak beküldjük
    fireEvent.click(await d.findByRole('button', { name: 'Hibajegy létrehozása' }))

    // a store-ba került az új, kapcsolt hibajegy…
    await waitFor(() => {
      expect(
        getQaDb().tickets.filter((t) => t.inspectionId === IDS.inspFailedCritical),
      ).toHaveLength(2)
    })
    // …és a rule-6 kereszt-invalidálás frissíti az átvizsgálás-detailt
    expect(await d.findByText(/kapcsolt nyitott hibajegy: 2/)).toBeInTheDocument()
  }, FLOW_TIMEOUT)
})

describe('hibajegy — FSM-folyam a UI-ban', () => {
  it('assign → start → resolve lánc az intézkedés-építő guardjával; a megoldott sor kikerül a Nyitott listából (rule-6)', async () => {
    render(<TicketsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Hiányzó kötőelem-csomag/)

    // bejelentve: csak a Kiosztás engedélyezett a fő úton
    const startBtn = await d.findByRole('button', { name: 'Megkezdés' })
    expect(startBtn).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(startBtn)).toHaveTextContent('státuszból indítható')

    // kiosztás űrlapon át
    fireEvent.click(d.getByRole('button', { name: 'Kiosztás' }))
    fireEvent.change(await d.findByLabelText(/Felelős neve/), { target: { value: 'Varga László' } })
    fireEvent.click(d.getByRole('button', { name: 'Kiosztás mentése' }))
    await waitFor(() => expect(ticketStatus(IDS.ticketReported)).toBe('kiosztva'))

    // megkezdés
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Megkezdés' })).not.toHaveAttribute('aria-disabled')
    })
    fireEvent.click(d.getByRole('button', { name: 'Megkezdés' }))
    await waitFor(() => expect(ticketStatus(IDS.ticketReported)).toBe('folyamatban'))

    // megoldás: üres építővel tiltott beküldés (Resolve-guard tükör)
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Megoldás' })).not.toHaveAttribute('aria-disabled')
    })
    fireEvent.click(d.getByRole('button', { name: 'Megoldás' }))
    const submit = await d.findByRole('button', { name: 'Megoldás megerősítése' })
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('legalább egy intézkedés')

    fireEvent.change(d.getByLabelText('Leírás'), { target: { value: 'Kötőelem-csomag pótolva' } })
    fireEvent.click(d.getByRole('button', { name: 'Intézkedés hozzáadása' }))
    fireEvent.click(d.getByRole('button', { name: 'Megoldás megerősítése' }))

    await waitFor(() => expect(ticketStatus(IDS.ticketReported)).toBe('megoldva'))
    // rule-6: a „Nyitott" szűrős listából eltűnik a megoldott hibajegy
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).queryByText(/Hiányzó kötőelem-csomag/)).not.toBeInTheDocument()
    })
  }, FLOW_TIMEOUT)

  it('eszkaláció: kritikus hibajegyen magyarázottan tiltott (nincs magasabb fokozat)', async () => {
    render(<TicketsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Felületi karcolás/)

    const escalateBtn = await d.findByRole('button', { name: 'Eszkaláció' })
    expect(escalateBtn).toBeVisible()
    expect(escalateBtn).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(escalateBtn)).toHaveTextContent('legmagasabb')
  }, FLOW_TIMEOUT)

  it('eszkaláció-folyam: közepes → magas (csak magasabb fokozat választható)', async () => {
    render(<TicketsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Hiányzó kötőelem-csomag/)

    fireEvent.click(await d.findByRole('button', { name: 'Eszkaláció' }))
    const select = await d.findByLabelText(/Új prioritás/)
    // a jelenlegi (közepes) és az alacsonyabb fokozat NEM választható
    const options = within(select).getAllByRole('option').map((o) => o.textContent)
    expect(options).toContain('Magas')
    expect(options).toContain('Kritikus')
    expect(options).not.toContain('Közepes')
    expect(options).not.toContain('Alacsony')

    fireEvent.change(select, { target: { value: 'magas' } })
    fireEvent.click(d.getByRole('button', { name: 'Eszkaláció megerősítése' }))

    await waitFor(() => {
      expect(getQaDb().tickets.find((t) => t.id === IDS.ticketReported)?.priority).toBe('magas')
    })
  }, FLOW_TIMEOUT)

  it('qa.manage nélkül minden akció jogosultsági indokkal tiltott (nem rejtett)', async () => {
    qaPermissionStub.manage = false
    render(<TicketsScreen />, { wrapper: createQaWrapper() })
    const d = await openDetail(/Hiányzó kötőelem-csomag/)

    for (const name of ['Kiosztás', 'Megkezdés', 'Megoldás', 'Elutasítás', 'Eszkaláció']) {
      const btn = await d.findByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('qa.manage')
    }
  }, FLOW_TIMEOUT)
})
