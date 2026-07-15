import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import {
  maintenanceApiHandlers, resetMaintenanceDb, getMaintenanceDb, MNT_SEED_IDS,
} from '../../../mocks/maintenanceApi'
import { maintenancePermissionStub } from '../../../services/maintenance'
import { WorkOrdersScreen } from '../WorkOrdersScreen'
import { createMaintenanceWrapper } from './maintenanceTestUtils'

/**
 * Munkalap FSM-folyam UI-tesztek — a tiltott átmenet-gomb NEM rejtett, hanem
 * aria-disabled + tooltip (disabledReason); az engedélyezett akció végigmegy
 * (MSW store + rule-6 invalidálás: a lista is frissül); a start felelős-guardja
 * és a jogosultság-stub (maintenance.manage) tiltása is magyarázott gombot ad.
 */

const server = setupServer(...maintenanceApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => { resetMaintenanceDb(); maintenancePermissionStub.manage = true })
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const FLOW_TIMEOUT = 20_000
const IDS = MNT_SEED_IDS

async function openWorkOrderDetail(title: string | RegExp) {
  fireEvent.click((await screen.findAllByText(title))[0])
  return within(await screen.findByRole('dialog'))
}

/** A blokkolt gomb saját tooltipje (a Button a wrapper-spanbe rendereli). */
function tooltipOf(button: HTMLElement): HTMLElement {
  return within(button.parentElement as HTMLElement).getByRole('tooltip')
}

function woStatus(id: string): string | undefined {
  return getMaintenanceDb().workOrders.find((wo) => wo.id === id)?.status
}

describe('munkalap — FSM-folyam a UI-ban', () => {
  it('ütemezett munkalapon: start engedélyezett; schedule/complete/reopen aria-disabled + tooltip', async () => {
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail('Negyedéves megelőző karbantartás')

    const start = await d.findByRole('button', { name: 'Megkezdés' })
    expect(start).not.toHaveAttribute('aria-disabled')

    // tiltott átmenetek: láthatóak, aria-disabled + magyarázó tooltip
    for (const name of ['Ütemezés', 'Lezárás', 'Újranyitás']) {
      const btn = d.getByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('státuszból indítható')
    }

    // a tiltott gomb kattintása elnyelt: a store nem változik
    fireEvent.click(d.getByRole('button', { name: 'Lezárás' }))
    expect(woStatus(IDS.woScheduled)).toBe('utemezve')
  }, FLOW_TIMEOUT)

  it('start-folyam: utemezve → folyamatban — gombok átbillennek, store átáll (rule-6 lista-frissítés)', async () => {
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail('Negyedéves megelőző karbantartás')

    fireEvent.click(await d.findByRole('button', { name: 'Megkezdés' }))

    // a detail a szerver-válaszból frissül: a Megkezdés már tiltott…
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Megkezdés' })).toHaveAttribute('aria-disabled', 'true')
    })
    // …a Lezárás viszont engedélyezetté vált
    expect(d.getByRole('button', { name: 'Lezárás' })).not.toHaveAttribute('aria-disabled')
    // MSW store (kontraktus-igazság) is átállt
    expect(woStatus(IDS.woScheduled)).toBe('folyamatban')
    // rule-6: a lista-cache invalidálódott → a táblában már Folyamatban pill jár a sorhoz
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).getAllByText('Folyamatban').length).toBeGreaterThanOrEqual(3)
    })
  }, FLOW_TIMEOUT)

  it('start-guard: felelős nélkül magyarázottan tiltott; hozzárendelés után indítható', async () => {
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail('Vákuumszivattyú-csere')

    // FSM szerint mehetne (utemezve), de felelős nincs → felelős-guard tooltip
    const start = await d.findByRole('button', { name: 'Megkezdés' })
    expect(start).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(start)).toHaveTextContent('felelőst kell hozzárendelni')

    // hozzárendelés űrlapon át
    fireEvent.click(d.getByRole('button', { name: 'Hozzárendelés' }))
    fireEvent.change(await d.findByLabelText(/Felelős neve/), { target: { value: 'Varga László' } })
    fireEvent.click(d.getByRole('button', { name: 'Hozzárendelés mentése' }))

    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Megkezdés' })).not.toHaveAttribute('aria-disabled')
    })
    expect(
      getMaintenanceDb().workOrders.find((wo) => wo.id === IDS.woScheduledNoAssignee)?.assigneeName,
    ).toBe('Varga László')
  }, FLOW_TIMEOUT)

  it('complete-folyam: óraszám nélkül magyarázottan tiltott beküldés, óraszámmal kesz + lista-frissülés', async () => {
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail(/Fűrészlap-törés/)

    fireEvent.click(await d.findByRole('button', { name: 'Lezárás' }))
    const submit = await d.findByRole('button', { name: 'Lezárás megerősítése' })

    // üres óraszámmal a beküldés aria-disabled + tooltip, a kattintás elnyelt
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('óraszámot')
    fireEvent.click(submit)
    expect(woStatus(IDS.woBreakdown)).toBe('folyamatban')

    fireEvent.change(d.getByLabelText(/Tényleges óraszám/), { target: { value: '2.5' } })
    fireEvent.click(d.getByRole('button', { name: 'Lezárás megerősítése' }))

    await waitFor(() => {
      expect(woStatus(IDS.woBreakdown)).toBe('kesz')
    })
    // rule-6: a „Nyitott" szűrős listából eltűnik a lezárt munkalap
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).queryByText(/Fűrészlap-törés/)).not.toBeInTheDocument()
    })
  }, FLOW_TIMEOUT)

  it('halasztás: kötelező indokkal, a mellékállapot a stepper felett jelvényként látszik', async () => {
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail('Negyedéves megelőző karbantartás')

    fireEvent.click(await d.findByRole('button', { name: 'Halasztás' }))
    fireEvent.change(await d.findByLabelText(/Halasztás indoka/), {
      target: { value: 'Alkatrészre várunk.' },
    })
    fireEvent.click(d.getByRole('button', { name: 'Halasztás megerősítése' }))

    await waitFor(() => {
      expect(woStatus(IDS.woScheduled)).toBe('halasztva')
    })
    expect(
      getMaintenanceDb().workOrders.find((wo) => wo.id === IDS.woScheduled)?.postponementReason,
    ).toBe('Alkatrészre várunk.')
    // az Újranyitás vált engedélyezetté (halasztva → bejelentve, backend reopen-tükör)
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Újranyitás' })).not.toHaveAttribute('aria-disabled')
    })
  }, FLOW_TIMEOUT)

  it('maintenance.manage nélkül minden akció jogosultsági indokkal tiltott (nem rejtett)', async () => {
    maintenancePermissionStub.manage = false
    render(<WorkOrdersScreen />, { wrapper: createMaintenanceWrapper() })
    const d = await openWorkOrderDetail('Negyedéves megelőző karbantartás')

    for (const name of ['Megkezdés', 'Hozzárendelés', 'Halasztás']) {
      const btn = await d.findByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('maintenance.manage')
    }
  }, FLOW_TIMEOUT)
})
