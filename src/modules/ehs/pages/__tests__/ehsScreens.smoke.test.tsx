import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb } from '../../mocks'
import { SdsScreen } from '../SdsScreen'
import { PpeScreen } from '../PpeScreen'
import { WalksScreen } from '../WalksScreen'
import { EhsDashboard } from '../EhsDashboard'
import { IncidentsScreen } from '../IncidentsScreen'
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
  })

  it('Események képernyő: API-lista + státusz-pillek', async () => {
    render(<IncidentsScreen />, { wrapper: wrapper() })
    expect(await screen.findByText(/Anyagleesés a polcrendszerről/)).toBeInTheDocument()
    expect((await screen.findAllByText('Bejelentve')).length).toBeGreaterThan(0)
  })
})
