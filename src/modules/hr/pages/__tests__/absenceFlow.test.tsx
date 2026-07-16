import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { hrApiHandlers, resetHrDb, getHrDb, HR_SEED_IDS } from '../../mocks'
import { hrPermissionStub } from '../../services'
import { AbsencesScreen } from '../AbsencesScreen'
import { createHrWrapper } from './hrTestUtils'

/**
 * Távollét FSM-folyam UI-tesztek — a tiltott átmenet-gomb NEM rejtett, hanem
 * aria-disabled + tooltip (disabledReason); az engedélyezett akció végigmegy
 * (MSW store + rule-6 invalidálás: a lista-pill is frissül); a jogosultság-
 * stub (hr.manage) tiltása is magyarázott gombot ad.
 */

const server = setupServer(...hrApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => { resetHrDb(); hrPermissionStub.manage = true })
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const FLOW_TIMEOUT = 20_000

async function openAbsenceDetail(empName: string) {
  fireEvent.click((await screen.findAllByText(empName))[0])
  return within(await screen.findByRole('dialog'))
}

/** A blokkolt gomb saját tooltipje (a Button a wrapper-spanbe rendereli). */
function tooltipOf(button: HTMLElement): HTMLElement {
  return within(button.parentElement as HTMLElement).getByRole('tooltip')
}

describe('távollét — FSM-folyam a UI-ban', () => {
  it('kert kérelmen: approve engedélyezett, start/complete/reopen aria-disabled + tooltip', async () => {
    render(<AbsencesScreen />, { wrapper: createHrWrapper() })
    const d = await openAbsenceDetail('Balogh Márk')

    const approve = await d.findByRole('button', { name: 'Jóváhagyás' })
    expect(approve).not.toHaveAttribute('aria-disabled')

    // tiltott átmenetek: láthatóak, aria-disabled + magyarázó tooltip
    for (const name of ['Megkezdés', 'Lezárás', 'Újranyitás']) {
      const btn = d.getByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('státuszból indítható')
    }

    // a tiltott gomb kattintása elnyelt: a store nem változik
    fireEvent.click(d.getByRole('button', { name: 'Megkezdés' }))
    expect(getHrDb().absences.find((a) => a.id === HR_SEED_IDS.absRequested)?.status).toBe('kert')
  }, FLOW_TIMEOUT)

  it('approve-folyam: kert → jovahagyva — gombok átbillennek, store átáll, lista frissül (rule-6)', async () => {
    render(<AbsencesScreen />, { wrapper: createHrWrapper() })
    // a lista-táblában a seed egyetlen „Kért" pillje látszik
    const table = await screen.findByRole('table')
    expect(within(table).getAllByText('Kért').length).toBeGreaterThan(0)

    const d = await openAbsenceDetail('Balogh Márk')
    fireEvent.click(await d.findByRole('button', { name: 'Jóváhagyás' }))

    // a detail a szerver-válaszból frissül: a Jóváhagyás már tiltott…
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Jóváhagyás' })).toHaveAttribute('aria-disabled', 'true')
    })
    // …a Megkezdés viszont engedélyezetté vált
    expect(d.getByRole('button', { name: 'Megkezdés' })).not.toHaveAttribute('aria-disabled')
    // MSW store (kontraktus-igazság) is átállt
    expect(getHrDb().absences.find((a) => a.id === HR_SEED_IDS.absRequested)?.status).toBe('jovahagyva')
    // rule-6: a lista-cache invalidálódott → a táblában nem maradt „Kért" pill
    await waitFor(() => {
      expect(within(table).queryByText('Kért')).not.toBeInTheDocument()
    })
  }, FLOW_TIMEOUT)

  it('reject-folyam: indok nélkül magyarázottan tiltott beküldés, indokkal elutasítva', async () => {
    render(<AbsencesScreen />, { wrapper: createHrWrapper() })
    const d = await openAbsenceDetail('Balogh Márk')

    fireEvent.click(await d.findByRole('button', { name: 'Elutasítás' }))
    const submit = await d.findByRole('button', { name: 'Elutasítás megerősítése' })

    // üres indokkal a beküldés aria-disabled + tooltip, a kattintás elnyelt
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('Add meg az indokot.')
    fireEvent.click(submit)
    expect(getHrDb().absences.find((a) => a.id === HR_SEED_IDS.absRequested)?.status).toBe('kert')

    fireEvent.change(d.getByLabelText(/Elutasítás indoka/), { target: { value: 'Határidős lakkozás.' } })
    fireEvent.click(d.getByRole('button', { name: 'Elutasítás megerősítése' }))

    await waitFor(() => {
      const abs = getHrDb().absences.find((a) => a.id === HR_SEED_IDS.absRequested)
      expect(abs?.status).toBe('elutasitva')
      expect(abs?.rejectReason).toBe('Határidős lakkozás.')
    })
    // az Újranyitás vált engedélyezetté (elutasitva → kert, backend reopen-tükör)
    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Újranyitás' })).not.toHaveAttribute('aria-disabled')
    })
  }, FLOW_TIMEOUT)

  it('hr.manage nélkül a döntési gombok jogosultsági indokkal tiltottak (nem rejtettek)', async () => {
    hrPermissionStub.manage = false
    render(<AbsencesScreen />, { wrapper: createHrWrapper() })
    const d = await openAbsenceDetail('Balogh Márk')

    for (const name of ['Jóváhagyás', 'Elutasítás']) {
      const btn = await d.findByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('hr.manage')
    }
    // a nem-döntési akció guardja továbbra is az FSM-ből jön
    expect(tooltipOf(d.getByRole('button', { name: 'Megkezdés' }))).toHaveTextContent('státuszból indítható')
  }, FLOW_TIMEOUT)
})
