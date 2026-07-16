import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { controllingApiHandlers, resetControllingDb } from '../../mocks'
import { AT_RISK_MARGIN_THRESHOLD } from '../../services'
import { formatPct } from '../labels'
import { DashboardScreen } from '../DashboardScreen'
import { PortfolioScreen } from '../PortfolioScreen'
import { MarginScreen } from '../MarginScreen'
import { VarianceScreen } from '../VarianceScreen'
import { AdjustmentsScreen } from '../AdjustmentsScreen'
import { createControllingWrapper } from './controllingTestUtils'

/** Smoke render tesztek a Kontrolling képernyőkre (MSW seed-adatokkal). */

const server = setupServer(...controllingApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetControllingDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = () => createControllingWrapper()

// A teljes szvit párhuzamos terhelése alatt a render+refetch lassabb lehet,
// mint az 5 mp-es alap-timeout — a smoke tesztek bő keretet kapnak.
const SMOKE_TIMEOUT = 20_000

describe('Kontrolling képernyők — smoke render', () => {
  it('Vezetői áttekintés: KPI-k + trend-kártya + kockázatos projekt', async () => {
    render(<DashboardScreen onScreen={vi.fn()} />, { wrapper: wrapper() })
    expect(await screen.findByText('Portfólió érték')).toBeInTheDocument()
    expect(screen.getByText('EAC-fedezet')).toBeInTheDocument()
    expect(screen.getByText('Kockázatos projekt')).toBeInTheDocument()
    expect(screen.getByText('EAC-túllépés')).toBeInTheDocument()
    expect(screen.getByText('Fedezet-trend (terv vs. tény)')).toBeInTheDocument()
    // M2: a kockázati küszöb-felirat a configból számított, nem fix szöveg
    expect(
      screen.getByText(`EAC-fedezet a ${formatPct(AT_RISK_MARGIN_THRESHOLD)}-os küszöb alatt`),
    ).toBeInTheDocument()
    // seed: a Vella-projekt fedezete a küszöb alatt → a kockázati listában
    expect(await screen.findByText('Vella penthouse — nappali bútor')).toBeInTheDocument()
    // M3: a lazy trend-diagram teljes adat-alternatívája (sr-only táblázat) —
    // a recharts-chunk dinamikus importja lassú jsdom alatt, ezért bő timeout
    expect(
      await screen.findByText(
        'Fedezet-trend havi bontásban: terv- és tény-fedezet százalék',
        undefined,
        { timeout: 15_000 },
      ),
    ).toBeInTheDocument()
  }, SMOKE_TIMEOUT)

  it('Portfólió: DataTable kettős render + életciklus-pillek + szűrő', async () => {
    render(<PortfolioScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText('Novitech iroda — 40 munkaállomás')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Vázlat')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fedezet (EAC)').length).toBeGreaterThan(0)

    // státusz-szűrő: done → a vázlat-projekt eltűnik
    fireEvent.click(screen.getByRole('button', { name: 'Kész' }))
    await waitFor(() =>
      expect(screen.queryByText('Novitech iroda — 40 munkaállomás')).not.toBeInTheDocument(),
    )
    expect((await screen.findAllByText(/Doorstar ajtók/)).length).toBeGreaterThan(0)

    // S2: az aktív chip nem csak színnel jelöl (check-ikon + font-semibold),
    // és aria-pressed viszi az állapotot (spec 3.3; CRM LeadsScreen minta)
    const activeChip = screen.getByRole('button', { name: 'Kész', pressed: true })
    expect(activeChip.querySelector('svg')).toBeTruthy()
    expect(activeChip.className).toContain('font-semibold')
    const inactiveChip = screen.getByRole('button', { name: 'Vázlat', pressed: false })
    expect(inactiveChip.querySelector('svg')).toBeNull()
  }, SMOKE_TIMEOUT)

  it('Projekt-fedezet: kártyák terv/tény/EAC fedezettel + kategória-bontással', async () => {
    render(<MarginScreen />, { wrapper: wrapper() })
    expect((await screen.findAllByText(/Petőfi u\. 12/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terv-fedezet').length).toBeGreaterThan(0)
    expect(screen.getAllByText('EAC-fedezet').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Munkaóra').length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Eltérés-elemzés: kategória-sorok + drill-down lenyitás', async () => {
    render(<VarianceScreen />, { wrapper: wrapper() })
    const anyagButton = await screen.findByRole('button', { name: /Anyag/, expanded: false })
    expect(screen.getByRole('button', { name: /Bérmunka/ })).toBeInTheDocument()

    fireEvent.click(anyagButton)
    expect((await screen.findAllByText(/Belváros Café/)).length).toBeGreaterThan(0)
  }, SMOKE_TIMEOUT)

  it('Utókalkuláció: korrekció-lista + új-gomb', async () => {
    render(<AdjustmentsScreen />, { wrapper: wrapper() })
    expect(
      (await screen.findAllByText('Beszállítói jóváírás — élzárás reklamáció')).length,
    ).toBeGreaterThan(0)
    expect((await screen.findAllByText('Energia-átalány Q2 korrekció (üzemcsarnok)')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Új korrekció' })).toBeInTheDocument()
  }, SMOKE_TIMEOUT)
})
