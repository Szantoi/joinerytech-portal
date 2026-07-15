import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, getCrmDb, CRM_SEED_IDS } from '../../../mocks/crmApi'
import { PipelineScreen } from '../PipelineScreen'
import { createCrmWrapper } from './crmTestUtils'

/**
 * Kanban fázis-léptetés — a kártya „következő fázis" gombja validált
 * FSM-átmenetet hív; siker után a kártya a következő oszlopba kerül
 * (invalidálás → friss lista a szerverről).
 */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('PipelineScreen — fázis-léptetés', () => {
  it('a nyitott kártya léptetése átmozgatja az Igényfelmérés oszlopba', async () => {
    const user = userEvent.setup()
    render(<PipelineScreen />, { wrapper: createCrmWrapper() })

    // seed: OPP-2426-001 (Vella) nyitott fázisban — oszlop-név + darabszám (spec §3.3)
    const openColumn = await screen.findByRole('region', { name: 'Nyitott, 1 elem' })
    expect(within(openColumn).getByText('Vella Interior Design')).toBeInTheDocument()

    await user.click(within(openColumn).getByRole('button', { name: /Igényfelmérés indítása/ }))

    // a szerver-állapot átment
    await waitFor(() => {
      expect(getCrmDb().opps.find((o) => o.id === CRM_SEED_IDS.oppOpen)?.status).toBe('igenyfelmeres')
    })
    // a kártya az új oszlopban jelenik meg, a darabszám a fejlécben követi a mozgást
    await waitFor(() => {
      const discoveryColumn = screen.getByRole('region', { name: 'Igényfelmérés, 2 elem' })
      expect(within(discoveryColumn).getByText('Vella Interior Design')).toBeInTheDocument()
    })
    expect(
      within(screen.getByRole('region', { name: 'Nyitott, 0 elem' })).queryByText('Vella Interior Design'),
    ).not.toBeInTheDocument()
  })

  it('tárgyalás fázisból a léptetés a Megnyert oszlopba visz (fő lánc vége)', async () => {
    const user = userEvent.setup()
    render(<PipelineScreen />, { wrapper: createCrmWrapper() })

    const negotiationColumn = await screen.findByRole('region', { name: /^Tárgyalás,/ })
    await user.click(within(negotiationColumn).getByRole('button', { name: /Megnyert/ }))

    await waitFor(() => {
      expect(getCrmDb().opps.find((o) => o.id === CRM_SEED_IDS.oppNegotiation)?.status).toBe('megnyert')
    })
    await waitFor(() => {
      const wonColumn = screen.getByRole('region', { name: /^Megnyert,/ })
      expect(within(wonColumn).getByText('Hegyi Lakberendezés')).toBeInTheDocument()
    })
    // terminális kártyán nincs további léptetés-gomb
    const wonColumn = screen.getByRole('region', { name: /^Megnyert,/ })
    expect(within(wonColumn).queryByRole('button', { name: /→/ })).not.toBeInTheDocument()
  })

  it('a kanban-sáv a spec §3.3 mintáját hozza: fókuszálható region, snap, edge-fade, 280 px oszlop', async () => {
    render(<PipelineScreen />, { wrapper: createCrmWrapper() })

    // fókuszálható görgetési konténer — üres oszlop is képernyőre hozható billentyűzettel
    const strip = await screen.findByRole('region', { name: 'Pipeline fázis-oszlopok' })
    expect(strip).toHaveAttribute('tabindex', '0')
    expect(strip.className).toContain('snap-x')
    expect(strip.className).toContain('snap-mandatory')
    expect(strip.className).toContain('touch-pan-x')
    expect(strip.className).toContain('mask-image')

    // oszlop: min. 280 px, snap-célpont, darabszám az accessible name-ben
    const column = screen.getByRole('region', { name: 'Nyitott, 1 elem' })
    expect(column.className).toContain('w-[280px]')
    expect(column.className).toContain('snap-start')
  })

  it('kártya-koppintás megnyitja a detail SlideOvert', async () => {
    const user = userEvent.setup()
    render(<PipelineScreen />, { wrapper: createCrmWrapper() })

    await user.click(await screen.findByText('Vella Interior Design'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect((await screen.findAllByText(CRM_SEED_IDS.oppOpen)).length).toBeGreaterThan(0)
  })
})
