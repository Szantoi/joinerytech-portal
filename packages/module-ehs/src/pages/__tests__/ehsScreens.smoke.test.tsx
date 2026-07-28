import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, getEhsDb, resetEhsDb } from '../../mocks'
import { buildRiskMatrixSummary } from '../../mocks/riskMatrix'
import { SdsScreen } from '../SdsScreen'
import { PpeScreen } from '../PpeScreen'
import { WalksScreen } from '../WalksScreen'
import { EhsDashboard } from '../EhsDashboard'
import { IncidentsScreen } from '../IncidentsScreen'
import { RisksScreen } from '../RisksScreen'
import { createEhsWrapper } from './ehsTestUtils'

/** Smoke render tesztek az új EHS képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createEhsWrapper()

describe('EHS képernyők — smoke render', () => {
  it('SDS képernyő: anyaglista validity-pillekkel', async () => {
    render(<SdsScreen />, { wrapper: wrapper() })
    expect(await screen.findAllByText('Nitro hígító')).not.toHaveLength(0)
    expect((await screen.findAllByText('Lejárt')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Lejáróban')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Érvényes')).length).toBeGreaterThan(0)
  })

  it('SDS detail: megnyílik és mutatja az SDS megújítása akciót', async () => {
    render(<SdsScreen />, { wrapper: wrapper() })
    const nameButtons = await screen.findAllByRole('button', { name: 'Ragasztó D3' })
    fireEvent.click(nameButtons[0])
    expect(await screen.findByRole('button', { name: 'SDS megújítása' })).toBeInTheDocument()
  })

  it('EVE képernyő: kiadások FSM-akciógombokkal + katalógus fül', async () => {
    render(<PpeScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Vágásbiztos kesztyű')).length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: 'Átvétel' })).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('tab', { name: 'Katalógus' }))
    expect((await screen.findAllByText('EN 388')).length).toBeGreaterThan(0)
  })

  it('Bejárások képernyő: lista + CAPA tábla fül (incidents+walks együtt)', async () => {
    render(<WalksScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Ütemezett')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('tab', { name: 'CAPA tábla' }))
    // nyitott CAPA-k: esemény- ÉS bejárás-forrású is (DataTable: tábla + kártya kettős render)
    expect((await screen.findAllByText(/Szellőző-szűrő csere/)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/Biztonsági burkolat javítása/)).length).toBeGreaterThan(0)
  })

  it('Áttekintés: új KPI-k a query hookokból', async () => {
    render(<EhsDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(screen.getByText('Lejáró SDS')).toBeInTheDocument()
    expect(screen.getByText('Nyitott CAPA')).toBeInTheDocument()
    expect(screen.getByText('Lejáró EVE')).toBeInTheDocument()
    expect(screen.getByText('Esedékes bejárás')).toBeInTheDocument()
    // a legutóbbi események az API-ból töltődnek
    expect(await screen.findByText(/Targonca majdnem elütött/)).toBeInTheDocument()
    expect(await screen.findByText(/Robbanásveszélyes oldószergőz/)).toBeInTheDocument()
    expect(screen.getByText('Magas kockázat').closest('button')).toHaveTextContent('2')
  })

  it('Áttekintés: mátrixhiba alatt nem mutat részleges kockázati listát, az újrapróbálás helyreállítja', async () => {
    let matrixAttempts = 0
    let releaseLocations = () => {}
    const heldLocations = new Promise<void>((resolve) => {
      releaseLocations = resolve
    })
    const safetyRelease = setTimeout(releaseLocations, 2_000)
    server.use(http.get('/api/ehs/risk-assessments/risk-matrix', () => {
      matrixAttempts += 1
      return matrixAttempts === 1
        ? HttpResponse.json({ message: 'Átmeneti hiba' }, { status: 503 })
        : HttpResponse.json(buildRiskMatrixSummary(getEhsDb().risks))
    }), http.get('/api/ehs/locations', async () => {
      await heldLocations
      return HttpResponse.json(getEhsDb().locations)
    }))

    render(<EhsDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })

    const riskHeading = screen.getByText('Kockázati mátrix (kivonat)')
    const riskCard = riskHeading.parentElement!.parentElement!
    expect(await within(riskCard).findByText('A kockázati kivonat nem tölthető be.'))
      .toBeInTheDocument()
    expect(within(riskCard).queryByText('Betöltés…')).not.toBeInTheDocument()
    expect(within(riskCard).queryByText(/Robbanásveszélyes oldószergőz/)).not.toBeInTheDocument()
    fireEvent.click(within(riskCard).getByRole('button', { name: 'Újra' }))
    releaseLocations()
    clearTimeout(safetyRelease)

    expect(await within(riskCard).findByText(/Robbanásveszélyes oldószergőz/)).toBeInTheDocument()
    expect(matrixAttempts).toBe(2)
  })

  it('Áttekintés: helyszíntörzs-hiba is kapuzott és az újrapróbálás a törzset is frissíti', async () => {
    let locationAttempts = 0
    server.use(http.get('/api/ehs/locations', () => {
      locationAttempts += 1
      return locationAttempts === 1
        ? HttpResponse.json({ message: 'Átmeneti hiba' }, { status: 503 })
        : HttpResponse.json(getEhsDb().locations)
    }))

    render(<EhsDashboard onScreen={vi.fn()} />, { wrapper: wrapper() })

    expect(await screen.findByText('A kockázati kivonat nem tölthető be.')).toBeInTheDocument()
    expect(screen.queryByText(/Forgó gépalkatrész elérése/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Újra' }))

    expect(await screen.findByText(/Forgó gépalkatrész elérése/)).toBeInTheDocument()
    expect(screen.getByText(/A csarnok — szabászat/)).toBeInTheDocument()
    expect(locationAttempts).toBe(2)
  })

  it('Események képernyő: API-lista + státusz-pillek', async () => {
    render(<IncidentsScreen />, { wrapper: wrapper() })
    expect(await screen.findByText(/Anyagleesés a polcrendszerről/)).toBeInTheDocument()
    expect((await screen.findAllByText('Bejelentve')).length).toBeGreaterThan(0)
  })

  it('Kockázatok képernyő: 25 cellás API-mátrix és lista', async () => {
    render(<RisksScreen />, { wrapper: wrapper() })
    const table = await screen.findByRole('table', { name: /5×5 kockázati mátrix/ })
    expect(table.querySelectorAll('td')).toHaveLength(25)
    expect((await screen.findAllByText(/Forgó gépalkatrész elérése/)).length).toBeGreaterThan(0)
    expect(screen.getByText('5 aktív értékelés a mátrixban')).toBeInTheDocument()
  })
})
