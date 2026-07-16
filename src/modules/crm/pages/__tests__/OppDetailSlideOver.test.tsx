import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, getCrmDb, CRM_SEED_IDS } from '../../mocks'
import { OppDetailSlideOver } from '../OppDetailSlideOver'
import { createCrmWrapper } from './crmTestUtils'

/**
 * Opp detail — ajánlat-csonk gomb guard (plan 3. vezérelv): lezárt lehetőségen
 * a gomb NEM tűnik el és NEM 409-re fut, hanem aria-disabled + tooltip-indoklás
 * (az MSW kontraktus-guard UI-tükre); nyitott lehetőségen végrehajt.
 */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createCrmWrapper()

describe('OppDetailSlideOver — ajánlat-csonk gomb guard', () => {
  it('lezárt (elveszett) lehetőségen a gomb aria-disabled + tooltip-indoklás', async () => {
    // seed: OPP-2426-006 elveszett, quoteId nélkül
    render(<OppDetailSlideOver oppId={CRM_SEED_IDS.oppLost} onClose={vi.fn()} />, { wrapper: wrapper() })

    const btn = await screen.findByRole('button', { name: 'Ajánlat-piszkozat létrehozása' })
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    // az indoklás tooltipként, aria-describedby-on keresztül érhető el
    const tooltipId = btn.getAttribute('aria-describedby')
    expect(tooltipId).toBeTruthy()
    expect(document.getElementById(tooltipId!)?.textContent).toBe(
      'Lezárt lehetőséghez nem hozható létre ajánlat.',
    )
  })

  it('lezárt lehetőségen a kattintás elnyelt — nem jön létre ajánlat', async () => {
    const user = userEvent.setup()
    render(<OppDetailSlideOver oppId={CRM_SEED_IDS.oppLost} onClose={vi.fn()} />, { wrapper: wrapper() })

    await user.click(await screen.findByRole('button', { name: 'Ajánlat-piszkozat létrehozása' }))
    expect(getCrmDb().opps.find((o) => o.id === CRM_SEED_IDS.oppLost)?.quoteId).toBeUndefined()
  })

  it('nyitott lehetőségen a gomb engedélyezett, kattintásra ajánlat-csonk jön létre', async () => {
    const user = userEvent.setup()
    render(<OppDetailSlideOver oppId={CRM_SEED_IDS.oppOpen} onClose={vi.fn()} />, { wrapper: wrapper() })

    const btn = await screen.findByRole('button', { name: 'Ajánlat-piszkozat létrehozása' })
    expect(btn).not.toHaveAttribute('aria-disabled')

    await user.click(btn)

    await waitFor(() => {
      expect(getCrmDb().opps.find((o) => o.id === CRM_SEED_IDS.oppOpen)?.quoteId).toBeTruthy()
    })
    // a UI a kapcsolt ajánlatot mutatja a gomb helyén
    expect(await screen.findByText(/Kapcsolt ajánlat:/)).toBeInTheDocument()
  })
})
