import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb, SEED_IDS } from '../../../mocks/ehsApi'
import { IncidentDetailSlideOver } from '../IncidentDetailSlideOver'
import { createEhsWrapper } from './ehsTestUtils'

/**
 * Átmenet-gomb logika (plan 3. vezérelv): a tiltott átmenet gombja LÁTHATÓ,
 * aria-disabled + tooltip-indoklás; az engedélyezett akció űrlapot nyit és
 * végrehajtva továbblépteti az FSM-et.
 */

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderDetail(incidentId: string) {
  return render(
    <IncidentDetailSlideOver incidentId={incidentId} onClose={vi.fn()} />,
    { wrapper: createEhsWrapper() },
  )
}

describe('IncidentDetailSlideOver — FSM akciók', () => {
  it('Reported eseményen a kivizsgálás engedélyezett, a többi tiltott (aria-disabled + tooltip)', async () => {
    renderDetail(SEED_IDS.incReported)

    const investigate = await screen.findByRole('button', { name: 'Kivizsgálás indítása' })
    expect(investigate).not.toHaveAttribute('aria-disabled')

    const close = screen.getByRole('button', { name: 'Lezárás' })
    expect(close).toHaveAttribute('aria-disabled', 'true')
    // tooltip az aria-describedby-on keresztül (mindig a DOM-ban, hoverre látszik)
    const tooltipId = close.getAttribute('aria-describedby')!
    expect(document.getElementById(tooltipId)?.textContent).toContain('Bejelentve')

    expect(screen.getByRole('button', { name: 'Intézkedés rögzítése' }))
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Újranyitás' }))
      .toHaveAttribute('aria-disabled', 'true')
  })

  it('a tiltott gomb kattintása nem vált állapotot (lenyelt aktiválás)', async () => {
    renderDetail(SEED_IDS.incReported)
    const close = await screen.findByRole('button', { name: 'Lezárás' })
    fireEvent.click(close)
    // nem nyílik űrlap, a státusz marad Bejelentve
    expect(screen.queryByLabelText(/Lezárási megjegyzés/)).not.toBeInTheDocument()
  })

  it('kivizsgálás indítása: űrlap → submit → Investigated (az intézkedés-gomb felszabadul)', async () => {
    renderDetail(SEED_IDS.incReported)

    fireEvent.click(await screen.findByRole('button', { name: 'Kivizsgálás indítása' }))
    expect(await screen.findByLabelText(/Kivizsgáló/)).toBeInTheDocument()

    // az űrlapon belüli submit gomb ugyanazzal a felirattal fut
    const submits = screen.getAllByRole('button', { name: 'Kivizsgálás indítása' })
    fireEvent.click(submits[submits.length - 1])

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intézkedés rögzítése' }))
        .not.toHaveAttribute('aria-disabled')
    })
    expect(screen.getByRole('button', { name: 'Kivizsgálás indítása' }))
      .toHaveAttribute('aria-disabled', 'true')
  })

  it('Closed eseményen csak az újranyitás engedélyezett + CAPA lista látszik', async () => {
    renderDetail(SEED_IDS.incClosed)

    const reopen = await screen.findByRole('button', { name: 'Újranyitás' })
    expect(reopen).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: 'Kivizsgálás indítása' }))
      .toHaveAttribute('aria-disabled', 'true')

    // a lezárt incidens CAPA-ja az egységes táblából jön (teljesítve)
    expect(await screen.findByText(/Sérült tárolóedények cseréje/)).toBeInTheDocument()
  })
})
