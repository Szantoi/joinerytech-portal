import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import {
  dmsApiHandlers, resetDmsDb, getDmsDb, DMS_SEED_IDS,
} from '../../mocks'
import { dmsPermissionStub } from '../../services'
import { LibraryScreen } from '../LibraryScreen'
import { createDmsWrapper } from './dmsTestUtils'

/**
 * DMS FSM-folyam UI-tesztek — a tiltott átmenet-gomb NEM rejtett, hanem
 * aria-disabled + tooltip (disabledReason); az engedélyezett akció végigmegy
 * (MSW store + rule-6 invalidálás: a lista is frissül); a payload-guardok
 * (visszautasítás-indok, verzió-mezők), a verzió-lánc léptetése és a
 * jogosultság-stub (dms.manage) tiltása is magyarázott gombot ad.
 */

const server = setupServer(...dmsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => { resetDmsDb(); dmsPermissionStub.manage = true })
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const FLOW_TIMEOUT = 20_000
const IDS = DMS_SEED_IDS

async function openDetail(text: string | RegExp) {
  fireEvent.click((await screen.findAllByText(text))[0])
  return within(await screen.findByRole('dialog'))
}

/** A blokkolt gomb saját tooltipje (a Button a wrapper-spanbe rendereli). */
function tooltipOf(button: HTMLElement): HTMLElement {
  return within(button.parentElement as HTMLElement).getByRole('tooltip')
}

function docStatus(id: string): string | undefined {
  return getDmsDb().documents.find((d) => d.id === id)?.status
}

function docVersion(id: string): number | undefined {
  return getDmsDb().documents.find((d) => d.id === id)?.version
}

describe('dokumentum — jóváhagyás-folyam a UI-ban', () => {
  it('piszkozaton: submit engedélyezett; approve/reject/recall/reopen aria-disabled + tooltip, kattintás elnyelt', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Várdai Konyhastúdió/)

    const submit = await d.findByRole('button', { name: 'Ellenőrzésre küldés' })
    expect(submit).not.toHaveAttribute('aria-disabled')

    for (const name of ['Jóváhagyás — kiadás', 'Visszautasítás', 'Felülvizsgálat', 'Újranyitás']) {
      const btn = d.getByRole('button', { name })
      expect(btn).toBeVisible()
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(tooltipOf(btn)).toHaveTextContent('státuszból indítható')
    }

    // a tiltott gomb kattintása elnyelt: a store nem változik
    fireEvent.click(d.getByRole('button', { name: 'Jóváhagyás — kiadás' }))
    expect(docStatus(IDS.docDraft)).toBe('piszkozat')
  }, FLOW_TIMEOUT)

  it('submit-folyam: piszkozat → ellenorzes — a gombok átbillennek, a store átáll', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Várdai Konyhastúdió/)

    fireEvent.click(await d.findByRole('button', { name: 'Ellenőrzésre küldés' }))

    await waitFor(() => {
      expect(d.getByRole('button', { name: 'Ellenőrzésre küldés' })).toHaveAttribute('aria-disabled', 'true')
    })
    expect(d.getByRole('button', { name: 'Jóváhagyás — kiadás' })).not.toHaveAttribute('aria-disabled')
    expect(d.getByRole('button', { name: 'Visszautasítás' })).not.toHaveAttribute('aria-disabled')
    expect(docStatus(IDS.docDraft)).toBe('ellenorzes')
  }, FLOW_TIMEOUT)

  it('visszautasítás-folyam: indok nélkül magyarázottan tiltott beküldés; indokkal → piszkozat + lista-frissülés (rule-6)', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Doorstar ajtó sorozat/)

    fireEvent.click(await d.findByRole('button', { name: 'Visszautasítás' }))
    const confirm = await d.findByRole('button', { name: 'Visszautasítás megerősítése' })

    // üres indokkal a beküldés aria-disabled + tooltip, a kattintás elnyelt
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(confirm)).toHaveTextContent('kötelező az indok')
    fireEvent.click(confirm)
    expect(docStatus(IDS.docInReview)).toBe('ellenorzes')

    // indokkal a beküldés felszabadul és átmegy
    fireEvent.change(d.getByLabelText(/Visszautasítás indoka/), {
      target: { value: 'Pánt-furat raszter újraszámolandó' },
    })
    fireEvent.click(d.getByRole('button', { name: 'Visszautasítás megerősítése' }))

    await waitFor(() => {
      expect(docStatus(IDS.docInReview)).toBe('piszkozat')
    })
    // rule-6: a lista-cache invalidálódott → a sor pillje Piszkozat-ra vált
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).getAllByText('Piszkozat').length).toBeGreaterThanOrEqual(2)
    })
  }, FLOW_TIMEOUT)

  it('jóváhagyás-folyam: ellenorzes → kiadott, az érvényes-verzió sáv átáll', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Doorstar ajtó sorozat/)

    // a v2 még kiadásra vár — a sáv a kiadott v1-et mutatja
    expect(await d.findByText(/A műhely a kiadott/)).toBeInTheDocument()

    fireEvent.click(d.getByRole('button', { name: 'Jóváhagyás — kiadás' }))
    fireEvent.change(await d.findByLabelText(/Megjegyzés \(opcionális\)/), {
      target: { value: 'Raszter rendben' },
    })
    fireEvent.click(d.getByRole('button', { name: 'Jóváhagyás megerősítése' }))

    await waitFor(() => expect(docStatus(IDS.docInReview)).toBe('kiadott'))
    // az érvényes-verzió sáv átbillen: most az aktuális v2 a kiadott
    expect(await d.findByText(/az érvényes — a műhely ezt használja/)).toBeInTheDocument()
  }, FLOW_TIMEOUT)

  it('verzió-feltöltés: kötelező mezők guardja; sikeres feltöltésnél verziószám-léptetés + lista-frissülés (rule-6); archiváltnál tiltott gomb', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Petőfi u\. 12\./)

    fireEvent.click(await d.findByRole('button', { name: 'Új verzió feltöltése' }))
    const submit = await d.findByRole('button', { name: 'Verzió rögzítése' })

    // üres mezőkkel a beküldés magyarázottan tiltott (közös payload-guard)
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('fájl-címké')

    fireEvent.change(d.getByLabelText(/Fájl-címke/), {
      target: { value: 'petofi-konyha-kiviteli-v4.pdf' },
    })
    fireEvent.change(d.getByLabelText(/Változás-jegyzet/), {
      target: { value: 'Fogantyú-kiosztás módosítva' },
    })
    fireEvent.click(d.getByRole('button', { name: 'Verzió rögzítése' }))

    // verzió-lánc: léptetés + megőrzés; az új munkapéldány piszkozat
    await waitFor(() => expect(docVersion(IDS.docReleased)).toBe(4))
    expect(docStatus(IDS.docReleased)).toBe('piszkozat')
    expect((await d.findAllByText('v4')).length).toBeGreaterThan(0)
    // a korábbi kiadott v3 az érvényes a láncban
    expect(await d.findByText('Érvényes (kiadott) verzió')).toBeInTheDocument()

    // rule-6: a lista is frissül — az érvényes-verzió jelzés megjelenik a sorban
    const table = await screen.findByRole('table')
    await waitFor(() => {
      expect(within(table).getAllByText('érvényes: v3').length).toBeGreaterThan(0)
    })
  }, FLOW_TIMEOUT)

  it('archivált dokumentumon a verzió-feltöltés magyarázottan tiltott (AddVersion-tükör)', async () => {
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/CE megfelelőségi nyilatkozat/)

    const uploadBtn = await d.findByRole('button', { name: 'Új verzió feltöltése' })
    expect(uploadBtn).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(uploadBtn)).toHaveTextContent('Archivált')
    // az újranyitás viszont engedélyezett (archivalt → piszkozat)
    expect(d.getByRole('button', { name: 'Újranyitás' })).not.toHaveAttribute('aria-disabled')
  }, FLOW_TIMEOUT)

  it('dms.manage nélkül minden akció jogosultsági indokkal tiltott', async () => {
    dmsPermissionStub.manage = false
    render(<LibraryScreen />, { wrapper: createDmsWrapper() })
    const d = await openDetail(/Várdai Konyhastúdió/)

    const submit = await d.findByRole('button', { name: 'Ellenőrzésre küldés' })
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(submit)).toHaveTextContent('dms.manage')

    const upload = d.getByRole('button', { name: 'Új verzió feltöltése' })
    expect(upload).toHaveAttribute('aria-disabled', 'true')
    expect(tooltipOf(upload)).toHaveTextContent('dms.manage')
  }, FLOW_TIMEOUT)
})
