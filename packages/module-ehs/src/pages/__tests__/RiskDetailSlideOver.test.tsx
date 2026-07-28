import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, getEhsDb, resetEhsDb, SEED_IDS } from '../../mocks'
import { RiskDetailSlideOver } from '../RiskDetailSlideOver'
import { createEhsWrapper } from './ehsTestUtils'

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('RiskDetailSlideOver', () => {
  it('mind a négy FSM-akciót mutatja indokolt tiltással, és visszaküld piszkozatba', async () => {
    render(
      <RiskDetailSlideOver riskId={SEED_IDS.riskReviewMedium} onClose={() => {}} />,
      { wrapper: createEhsWrapper() },
    )

    expect(await screen.findByText(/Faipari por tartós belégzése/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ellenőrzésre küldés' }))
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Jóváhagyás' }))
      .not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Visszaküldés piszkozatba' }))
      .not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Archiválás' }))
      .toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Visszaküldés piszkozatba' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Piszkozat szerkesztése' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Ellenőrzésre küldés' }))
      .not.toHaveAttribute('aria-disabled', 'true')
  })

  it('draft update flow assessedBy nélkül frissíti a részletet', async () => {
    render(
      <RiskDetailSlideOver riskId={SEED_IDS.riskDraftLow} onClose={() => {}} />,
      { wrapper: createEhsWrapper() },
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Piszkozat szerkesztése' }))
    const hazard = screen.getByLabelText(/Veszély leírása/)
    fireEvent.change(hazard, { target: { value: 'Frissített kézi anyagmozgatási kockázat' } })
    fireEvent.click(screen.getByRole('button', { name: 'Módosítások mentése' }))

    await waitFor(() => expect(getEhsDb().risks.find(
      (risk) => risk.riskAssessmentId === SEED_IDS.riskDraftLow,
    )?.hazardDescription).toBe('Frissített kézi anyagmozgatási kockázat'))
    await waitFor(
      () => expect(screen.getByText('Frissített kézi anyagmozgatási kockázat')).toBeInTheDocument(),
      { timeout: 5000 },
    )
  })

  it('control + CAPA flow közös linkkel megjelenik a részleten', async () => {
    render(
      <RiskDetailSlideOver riskId={SEED_IDS.riskApprovedCritical} onClose={() => {}} />,
      { wrapper: createEhsWrapper() },
    )

    await screen.findByText(/Robbanásveszélyes oldószergőz/)
    fireEvent.change(screen.getByLabelText(/Intézkedés/), {
      target: { value: 'Robbanásbiztos elszívás telepítése' },
    })
    fireEvent.change(screen.getByLabelText(/Felelős/), {
      target: { value: 'Karbantartási vezető' },
    })
    fireEvent.click(screen.getByLabelText('Követő CAPA létrehozása'))
    fireEvent.click(screen.getByRole('button', { name: 'Intézkedés rögzítése' }))

    await waitFor(() => expect(screen.getByText('Robbanásbiztos elszívás telepítése')).toBeInTheDocument())
    expect(screen.getAllByText(/CAPA létrehozva/).length).toBeGreaterThan(0)
  })
})
