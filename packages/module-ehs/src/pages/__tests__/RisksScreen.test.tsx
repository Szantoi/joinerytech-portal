import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, getEhsDb, resetEhsDb } from '../../mocks'
import { buildRiskMatrixSummary } from '../../mocks/riskMatrix'
import { RisksScreen } from '../RisksScreen'
import { createEhsWrapper } from './ehsTestUtils'

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('RisksScreen', () => {
  it('betöltési állapotot mutat, amíg a három szükséges query nem kész', () => {
    render(<RisksScreen />, { wrapper: createEhsWrapper() })

    expect(screen.getByLabelText('kockázati mátrix betöltése')).toHaveAttribute('aria-busy', 'true')
  })

  it('5×5 mátrixot renderel, és az üres szűrőt kihagyva visszaállítja a teljes listát', async () => {
    render(<RisksScreen />, { wrapper: createEhsWrapper() })

    const table = await screen.findByRole('table', { name: /5×5 kockázati mátrix/ })
    expect(table.querySelectorAll('td')).toHaveLength(25)
    expect(screen.getByText('5 aktív értékelés a mátrixban')).toBeInTheDocument()
    expect(screen.getByText('6 listaelem az aktuális szűrésben')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Állapot'), { target: { value: 'archivalt' } })
    expect(await screen.findByText(/Korábbi, kivezetett kézi felületkezelési technológia/))
      .toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('1 listaelem az aktuális szűrésben')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Állapot'), { target: { value: '' } })
    await waitFor(() => expect(screen.getByText('6 listaelem az aktuális szűrésben')).toBeInTheDocument())
  })

  it('create flow után az új rekord részleteit nyitja meg', async () => {
    render(<RisksScreen />, { wrapper: createEhsWrapper() })
    await screen.findByRole('table', { name: /5×5 kockázati mátrix/ })

    fireEvent.click(screen.getByRole('button', { name: 'Új kockázatértékelés' }))
    fireEvent.change(screen.getByLabelText(/Veszély leírása/), {
      target: { value: 'Új teszt kockázat a szerelősoron' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /^Súlyosság/ }), { target: { value: 'sulyos' } })
    fireEvent.change(screen.getByRole('combobox', { name: /^Bekövetkezési valószínűség/ }), {
      target: { value: 'lehetseges' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kockázatértékelés létrehozása' }))

    expect((await screen.findAllByText('Új teszt kockázat a szerelősoron')).length)
      .toBeGreaterThan(0)
    expect((await screen.findAllByText('Piszkozat')).length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByText('6 aktív értékelés a mátrixban')).toBeInTheDocument())
  })

  it('hiba után mindhárom queryt újrapróbálja, és siker esetén kirajzolja a mátrixot', async () => {
    let attempts = 0
    let releaseLocations = () => {}
    const heldLocations = new Promise<void>((resolve) => {
      releaseLocations = resolve
    })
    const safetyRelease = setTimeout(releaseLocations, 2_000)
    server.use(http.get('/api/ehs/risk-assessments/risk-matrix', () => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ message: 'Átmeneti hiba' }, { status: 503 })
        : HttpResponse.json(buildRiskMatrixSummary(getEhsDb().risks))
    }), http.get('/api/ehs/locations', async () => {
      await heldLocations
      return HttpResponse.json(getEhsDb().locations)
    }))

    render(<RisksScreen />, { wrapper: createEhsWrapper() })

    const errorMessage = await screen.findByText(
      'A(z) kockázati mátrix betöltése nem sikerült.',
    )
    expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument()
    expect(screen.queryByLabelText('kockázati mátrix betöltése')).not.toBeInTheDocument()
    expect(screen.queryByRole('table', { name: /5×5 kockázati mátrix/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Újra' }))
    releaseLocations()
    clearTimeout(safetyRelease)

    expect(await screen.findByRole('table', { name: /5×5 kockázati mátrix/ })).toBeInTheDocument()
    expect(attempts).toBe(2)
  })

  it('üres szűrési eredménynél egyértelmű üres állapotot mutat', async () => {
    server.use(http.get('/api/ehs/risk-assessments', () => HttpResponse.json([])))

    render(<RisksScreen />, { wrapper: createEhsWrapper() })

    expect(await screen.findByText('Az aktuális szűrésben nincs kockázatértékelés.'))
      .toBeInTheDocument()
    expect(screen.getByText('0 listaelem az aktuális szűrésben')).toBeInTheDocument()
  })

  it('null vagy a törzsből hiányzó helyszínt gondolatjellel jelenít meg', async () => {
    const missingLocationRisk = getEhsDb().risks.find((risk) =>
      risk.hazardDescription.startsWith('Kézi anyagmozgatás'))!
    missingLocationRisk.locationId = '00000000-0000-4000-8000-00000000ffff'

    render(<RisksScreen />, { wrapper: createEhsWrapper() })
    await screen.findByRole('table', { name: /5×5 kockázati mátrix/ })

    const list = screen.getByRole('heading', { name: 'Értékelések' }).closest('section')!
    const unknownRow = within(list).getByText(/Kézi anyagmozgatás/).closest('button')!
    const nullRow = within(list).getByText(/Korábbi, kivezetett/).closest('button')!
    expect(unknownRow).toHaveTextContent('—')
    expect(nullRow).toHaveTextContent('—')
    expect(unknownRow).not.toHaveTextContent('Ismeretlen helyszín')
    expect(nullRow).not.toHaveTextContent('Nincs helyszín')
  })
})
