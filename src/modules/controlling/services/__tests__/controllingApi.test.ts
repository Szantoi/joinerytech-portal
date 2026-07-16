import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { controllingApiHandlers, resetControllingDb, CONTROLLING_SEED_IDS } from '../../mocks'
import { fetchProject, fetchProjectCalc, fetchProjects } from '../projects'
import { fetchPortfolioSummary } from '../portfolio'
import { fetchVariance } from '../variance'
import { createAdjustment, deleteAdjustment, fetchAdjustments } from '../adjustments'
import { ApiError } from '../../../../services/apiClient'

/** Kontrolling MSW kontraktus-tükör: számított EAC/variance + korrekció-CRUD. */

const server = setupServer(...controllingApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetControllingDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const IDS = CONTROLLING_SEED_IDS

describe('projektek', () => {
  it('a lista mind a 6 projektet adja, számított összegzéssel', async () => {
    const rows = await fetchProjects()
    expect(rows).toHaveLength(6)
    // legnagyobb azonosító elöl
    expect(rows[0].id).toBe(IDS.projectDraft)

    // Gardrób-sor (korrekció nélkül): a calc a mock-adat tükrét adja
    const gardrob = rows.find((p) => p.id === IDS.projectDone)!
    expect(gardrob.planTotal).toBe(584_640)
    expect(gardrob.actualTotal).toBe(583_520)
    expect(gardrob.eacTotal).toBe(589_640) // kategóriánkénti MAX-ok összege
    expect(gardrob.variance).toBe(-1_120)
  })

  it('státusz-szűrő: draft → csak a kalkulációs projekt', async () => {
    const rows = await fetchProjects({ status: 'draft' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(IDS.projectDraft)
    // vázlatnál nincs tény → EAC = terv
    expect(rows[0].eacTotal).toBe(rows[0].planTotal)
  })

  it('ismeretlen projekt → 404', async () => {
    const error = await fetchProject('PRJ-0000-000').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('a költség-kalkuláció tartalmazza a projekt-hatályú korrekciót', async () => {
    const calc = await fetchProjectCalc(IDS.projectDoorstar)
    const munka = calc.byCategory.find((c) => c.category === 'munka')!
    // seed: 1 920 000 tény + 60 000 garanciális korrekció (CADJ-002)
    expect(munka.actual).toBe(1_980_000)
    expect(calc.actualTotal).toBe(5_374_400)
    expect(calc.eacTotal).toBe(5_424_400)
  })
})

describe('korrekciók (utókalkuláció)', () => {
  it('lista: élő korrekciók, projekt-szűrővel', async () => {
    expect(await fetchAdjustments()).toHaveLength(3)
    const doorstar = await fetchAdjustments({ projectId: IDS.projectDoorstar })
    expect(doorstar).toHaveLength(1)
    expect(doorstar[0].id).toBe(IDS.adjWarrantyLabor)
  })

  it('létrehozás után a projekt-kalkuláció azonnal tükrözi a korrekciót', async () => {
    const created = await createAdjustment({
      projectId: IDS.projectDone,
      category: 'munka',
      amount: -20_000,
      scope: 'project',
      reason: 'Óraszám-korrekció — duplán könyvelt műszak',
      createdBy: 'Teszt Elek',
    })
    expect(created.id).toBe('CADJ-004')

    const calc = await fetchProjectCalc(IDS.projectDone)
    expect(calc.actualTotal).toBe(583_520 - 20_000)
  })

  it('validáció: indok nélkül / nulla összeggel / hatály-invariáns sértéssel → 400', async () => {
    const base = {
      projectId: IDS.projectDone, category: 'anyag', amount: 10_000,
      scope: 'project', reason: 'ok', createdBy: 'T',
    } as const

    const noReason = await createAdjustment({ ...base, reason: '  ' }).catch((e: unknown) => e)
    expect((noReason as ApiError).status).toBe(400)

    const zero = await createAdjustment({ ...base, amount: 0 }).catch((e: unknown) => e)
    expect((zero as ApiError).status).toBe(400)

    const scopeMismatch = await createAdjustment({ ...base, scope: 'portfolio' }).catch((e: unknown) => e)
    expect((scopeMismatch as ApiError).status).toBe(400)
  })

  it('projekt-hatály ismeretlen projektre → 404', async () => {
    const error = await createAdjustment({
      projectId: 'PRJ-0000-000', category: 'anyag', amount: 10_000,
      scope: 'project', reason: 'ok', createdBy: 'T',
    }).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('soft-delete: a kalkuláció visszaáll, dupla törlés → 409', async () => {
    await deleteAdjustment(IDS.adjWarrantyLabor)
    const calc = await fetchProjectCalc(IDS.projectDoorstar)
    expect(calc.actualTotal).toBe(5_314_400) // a +60 000 már nincs a tényben

    const again = await deleteAdjustment(IDS.adjWarrantyLabor).catch((e: unknown) => e)
    expect((again as ApiError).status).toBe(409)
  })
})

describe('portfólió-összegzés + eltérés-elemzés', () => {
  it('KPI-k: a portfólió-hatályú korrekció EGYSZER számít az összesenbe', async () => {
    const [summary, projects] = await Promise.all([fetchPortfolioSummary(), fetchProjects()])
    expect(summary.projectCount).toBe(6)

    const actualSum = projects.reduce((s, p) => s + p.actualTotal, 0)
    expect(summary.actualCostTotal).toBe(actualSum + 120_000) // CADJ-003 (portfólió)
    expect(summary.eacTotal).toBe(projects.reduce((s, p) => s + p.eacTotal, 0) + 120_000)
  })

  it('kockázatos projekt és EAC-túllépés számítás', async () => {
    const summary = await fetchPortfolioSummary()
    expect(summary.projectsAtRisk).toBe(1)
    expect(summary.atRiskProjects[0].id).toBe(IDS.projectOnHold)
    // minden nem-vázlat projekt vetítése terv feletti a seedben
    expect(summary.eacOverrunCount).toBe(5)
    expect(summary.eacOverrunTotal).toBeGreaterThan(0)
  })

  it('a fedezet-trend utolsó pontja az aktuális (számított) hónap', async () => {
    const summary = await fetchPortfolioSummary()
    expect(summary.marginTrend).toHaveLength(6)
    const last = summary.marginTrend[summary.marginTrend.length - 1]
    expect(last.month).toBe('2026-07')
    expect(last.actualMarginPct).toBeCloseTo(summary.actualMarginPct ?? 0, 10)
  })

  it('eltérés-elemzés: kategória-összesenek + projekt drill-down (portfólió-korrekció nélkül)', async () => {
    const [rows, projects] = await Promise.all([fetchVariance(), fetchProjects()])

    const anyag = rows.find((r) => r.category === 'anyag')!
    const expectedPlan = projects.reduce(
      (s, p) => s + (p.byCategory.find((c) => c.category === 'anyag')?.plan ?? 0), 0)
    expect(anyag.plan).toBe(expectedPlan)
    expect(anyag.projects).toHaveLength(6)

    // bérmunka csak 2 projektben él
    const bermunka = rows.find((r) => r.category === 'bermunka')!
    expect(bermunka.projects).toHaveLength(2)

    // a portfólió-hatályú rezsi-korrekció (CADJ-003) NEM projekt-költség
    const rezsi = rows.find((r) => r.category === 'rezsi')!
    const rezsiActual = projects.reduce(
      (s, p) => s + (p.byCategory.find((c) => c.category === 'rezsi')?.actual ?? 0), 0)
    expect(rezsi.actual).toBe(rezsiActual)
  })
})
