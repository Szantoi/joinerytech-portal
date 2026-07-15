import { CTRL_PROJECTS } from '../controlling'
import type { ControllingProject, CostLine } from '../../services/controlling/projects'
import type { MarginTrendPoint } from '../../services/controlling/portfolio'
import type { StoredAdjustment } from './db'

/**
 * Kontrolling mock seed — a meglévő statikus mock-adatokat (mocks/controlling.ts
 * CTRL_PROJECTS, rezsivel együtt) tölti be az állapottartó store-ba
 * (adat-újrahasznosítás, a crmApi/seed.ts mintája), kiegészítve
 *  - két új projekttel (draft + on_hold), hogy mind az 5 életciklus-címke és a
 *    „kockázatos projekt" KPI is élő adaton látszódjon,
 *  - determinisztikus korrekció- (utókalkuláció-) és fedezet-trend-seeddel.
 */

/** Stabil azonosítók — a tesztek ezekre hivatkoznak. */
export const CONTROLLING_SEED_IDS = {
  projectInstall: 'PRJ-2026-014',  // install (Petőfi u. 12.)
  projectActive: 'PRJ-2026-013',   // active (Belváros Café)
  projectDone: 'PRJ-2026-012',     // done (Gardrób-sor)
  projectDoorstar: 'PRJ-2026-011', // done (Doorstar 1. ütem — CADJ-002 érinti)
  projectDraft: 'PRJ-2026-015',    // draft (csak tervköltség)
  projectOnHold: 'PRJ-2026-010',   // on_hold (terv feletti költés → kockázatos)

  adjSupplierCredit: 'CADJ-001',   // projekt-hatályú jóváírás (Belváros Café)
  adjWarrantyLabor: 'CADJ-002',    // projekt-hatályú többlet (Doorstar)
  adjPortfolioOverhead: 'CADJ-003',// portfólió-hatályú rezsi-korrekció
} as const

/** Új projektek a seedhez (a CTRL_PROJECTS-ben nem szereplő címkékkel). */
const EXTRA_PROJECTS: ControllingProject[] = [
  {
    id: CONTROLLING_SEED_IDS.projectDraft,
    name: 'Novitech iroda — 40 munkaállomás',
    customer: 'Novitech Mérnökiroda Kft.',
    status: 'draft',
    contractValue: 11_500_000,
    invoiced: 0,
    lines: [
      { category: 'anyag', label: 'Lapanyag + vasalat (kalkuláció)', plan: 3_400_000, actual: 0 },
      { category: 'munka', label: 'Gyártás + szerelés (kalkuláció)', plan: 2_600_000, actual: 0 },
      { category: 'szallitas', label: 'Kiszállítás (2 fuvar)', plan: 180_000, actual: 0 },
      { category: 'rezsi', label: 'Rezsi (12%)', plan: 741_600, actual: 0 },
    ],
  },
  {
    id: CONTROLLING_SEED_IDS.projectOnHold,
    name: 'Vella penthouse — nappali bútor',
    customer: 'Vella Interior Design',
    status: 'on_hold',
    contractValue: 3_000_000,
    invoiced: 1_500_000,
    lines: [
      { category: 'anyag', label: 'Dió furnér + lapanyag', plan: 820_000, actual: 1_150_000, note: 'Furnér-áremelés + selejt.' },
      { category: 'munka', label: 'Gyártás (műhely-napló)', plan: 640_000, actual: 1_180_000, note: 'Egyedi frontok — terv feletti óraszám.' },
      { category: 'szallitas', label: 'Kiszállítás', plan: 60_000, actual: 84_000 },
      { category: 'rezsi', label: 'Rezsi (12%)', plan: 182_400, actual: 289_680 },
    ],
  },
]

/**
 * A legacy CTRL_PROJECTS sorai `cat` kulcsot használnak — átképezés a
 * kontraktus `category` mezőjére (a kulcskészlet azonos).
 */
export function seedProjects(): ControllingProject[] {
  const legacy: ControllingProject[] = CTRL_PROJECTS.map((p) => ({
    id: p.id,
    name: p.name,
    customer: p.customer,
    status: p.status,
    contractValue: p.contractValue,
    invoiced: p.invoiced,
    lines: p.lines.map(({ cat, ...line }): CostLine => ({ category: cat, ...line })),
  }))
  return structuredClone([...legacy, ...EXTRA_PROJECTS])
}

export function seedAdjustments(): StoredAdjustment[] {
  return structuredClone([
    {
      id: CONTROLLING_SEED_IDS.adjSupplierCredit,
      projectId: CONTROLLING_SEED_IDS.projectActive,
      category: 'beszallito',
      amount: -35_000,
      scope: 'project',
      reason: 'Beszállítói jóváírás — élzárás reklamáció',
      createdBy: 'Kovács P.',
      createdAt: '2026-07-08',
      isDeleted: false,
    },
    {
      id: CONTROLLING_SEED_IDS.adjWarrantyLabor,
      projectId: CONTROLLING_SEED_IDS.projectDoorstar,
      category: 'munka',
      amount: 60_000,
      scope: 'project',
      reason: 'Garanciális utómunka — zsanér-állítás a 2. ütem előtt',
      createdBy: 'Szabó A.',
      createdAt: '2026-07-10',
      isDeleted: false,
    },
    {
      id: CONTROLLING_SEED_IDS.adjPortfolioOverhead,
      projectId: null,
      category: 'rezsi',
      amount: 120_000,
      scope: 'portfolio',
      reason: 'Energia-átalány Q2 korrekció (üzemcsarnok)',
      createdBy: 'Kovács P.',
      createdAt: '2026-07-01',
      isDeleted: false,
    },
  ] satisfies StoredAdjustment[])
}

/**
 * Fedezet-trend előzmény (determinisztikus) — a portfólió-handler az aktuális
 * hónapot a store-ból SZÁMÍTJA és fűzi a végére (így a trend utolsó pontja
 * mindig konzisztens a KPI-kkal).
 */
export const MARGIN_TREND_HISTORY: MarginTrendPoint[] = [
  { month: '2026-02', planMarginPct: 0.27, actualMarginPct: 0.24 },
  { month: '2026-03', planMarginPct: 0.28, actualMarginPct: 0.25 },
  { month: '2026-04', planMarginPct: 0.26, actualMarginPct: 0.21 },
  { month: '2026-05', planMarginPct: 0.27, actualMarginPct: 0.19 },
  { month: '2026-06', planMarginPct: 0.28, actualMarginPct: 0.2 },
]

/** Az aktuális trend-pont hónapja (determinisztikus mock-idő). */
export const CURRENT_TREND_MONTH = '2026-07'
