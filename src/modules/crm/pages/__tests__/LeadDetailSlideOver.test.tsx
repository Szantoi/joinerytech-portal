import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, getCrmDb, CRM_SEED_IDS } from '../../mocks'
import { LeadDetailSlideOver } from '../LeadDetailSlideOver'
import { createCrmWrapper } from './crmTestUtils'

/**
 * Lead detail — átmenet-gomb logika (plan 3. vezérelv): a tiltott akció NEM
 * tűnik el, hanem aria-disabled + tooltip-indoklás; az engedélyezett akció
 * végrehajt; a konvertálás lehetőség-csonkot hoz létre.
 */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createCrmWrapper()

describe('LeadDetailSlideOver — FSM átmenet-gombok', () => {
  it('új leadnél a Kapcsolatfelvétel engedélyezett, a Minősítés aria-disabled + indoklás', async () => {
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadNew} onClose={vi.fn()} />, { wrapper: wrapper() })

    const contactBtn = await screen.findByRole('button', { name: 'Kapcsolatfelvétel' })
    expect(contactBtn).not.toHaveAttribute('aria-disabled')

    const qualifyBtn = screen.getByRole('button', { name: 'Minősítés' })
    expect(qualifyBtn).toHaveAttribute('aria-disabled', 'true')
    // az indoklás tooltipként, aria-describedby-on keresztül érhető el
    const tooltipId = qualifyBtn.getAttribute('aria-describedby')
    expect(tooltipId).toBeTruthy()
    expect(document.getElementById(tooltipId!)?.textContent).toContain('Kapcsolatfelvétel')
  })

  it('engedélyezett átmenet kattintásra végrehajtódik és a stepper továbblép', async () => {
    const user = userEvent.setup()
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadNew} onClose={vi.fn()} />, { wrapper: wrapper() })

    await user.click(await screen.findByRole('button', { name: 'Kapcsolatfelvétel' }))

    await waitFor(() => {
      expect(getCrmDb().leads.find((l) => l.id === CRM_SEED_IDS.leadNew)?.status).toBe('kapcsolat')
    })
    // a Minősítés mostantól engedélyezett
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Minősítés' })).not.toHaveAttribute('aria-disabled')
    })
  })

  it('aria-disabled gomb kattintása NEM vált állapotot (a kattintás elnyelt)', async () => {
    const user = userEvent.setup()
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadNew} onClose={vi.fn()} />, { wrapper: wrapper() })

    await user.click(await screen.findByRole('button', { name: 'Minősítés' }))
    expect(getCrmDb().leads.find((l) => l.id === CRM_SEED_IDS.leadNew)?.status).toBe('uj')
  })

  it('elvetés: indok kötelező, megerősítés után elvetve', async () => {
    const user = userEvent.setup()
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadContacted} onClose={vi.fn()} />, { wrapper: wrapper() })

    await user.click(await screen.findByRole('button', { name: 'Elvetés' }))
    const confirm = await screen.findByRole('button', { name: 'Elvetés megerősítése' })
    expect(confirm).toHaveAttribute('aria-disabled', 'true') // üres indok

    await user.type(screen.getByLabelText(/Elvetés indoka/), 'Nem a profilunk.')
    await user.click(screen.getByRole('button', { name: 'Elvetés megerősítése' }))

    await waitFor(() => {
      const lead = getCrmDb().leads.find((l) => l.id === CRM_SEED_IDS.leadContacted)
      expect(lead?.status).toBe('elvetve')
      expect(lead?.lostReason).toBe('Nem a profilunk.')
    })
  })

  it('minősített lead konvertálása lehetőség-csonkot hoz létre', async () => {
    const user = userEvent.setup()
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadQualified} onClose={vi.fn()} />, { wrapper: wrapper() })

    const convertBtn = await screen.findByRole('button', { name: 'Konvertálás lehetőséggé' })
    expect(convertBtn).not.toHaveAttribute('aria-disabled')
    const oppCountBefore = getCrmDb().opps.length

    await user.click(convertBtn)

    await waitFor(() => {
      expect(getCrmDb().opps.length).toBe(oppCountBefore + 1)
    })
    const lead = getCrmDb().leads.find((l) => l.id === CRM_SEED_IDS.leadQualified)
    expect(lead?.status).toBe('konvertalva')
    expect(lead?.oppId).toBeTruthy()
    // a UI mutatja a kapcsolatot (info-doboz + napló-bejegyzés)
    expect((await screen.findAllByText(/Konvertálva lehetőséggé:/)).length).toBeGreaterThan(0)
  })

  it('terminális (konvertált) leadnél minden átmenet tiltott', async () => {
    render(<LeadDetailSlideOver leadId={CRM_SEED_IDS.leadConverted} onClose={vi.fn()} />, { wrapper: wrapper() })

    await screen.findByRole('button', { name: 'Kapcsolatfelvétel' })
    for (const name of ['Kapcsolatfelvétel', 'Minősítés', 'Nurturingbe', 'Elvetés', 'Konvertálás lehetőséggé']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
