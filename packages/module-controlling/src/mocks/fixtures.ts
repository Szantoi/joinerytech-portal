import type { ControllingProject, CostLine } from '../services/projects'

/** Mock-only overhead rate mirrored from the historical portfolio seed. */
const SEED_OVERHEAD_RATE = 0.12

function withSeedOverhead(lines: CostLine[]): CostLine[] {
  const directPlan = lines.reduce((sum, line) => sum + line.plan, 0)
  const directActual = lines.reduce((sum, line) => sum + line.actual, 0)

  return [
    ...lines,
    {
      category: 'rezsi',
      label: `Rezsi (${Math.round(SEED_OVERHEAD_RATE * 100)}%)`,
      plan: Math.round(directPlan * SEED_OVERHEAD_RATE),
      actual: Math.round(directActual * SEED_OVERHEAD_RATE),
    },
  ]
}

/**
 * Module-owned project fixtures in the canonical API contract shape.
 * Consumers must clone before mutation; the in-memory DB owns runtime state.
 */
export const CONTROLLING_PROJECT_FIXTURES: ControllingProject[] = [
  {
    id: 'PRJ-2026-014',
    name: 'Petőfi u. 12. — Konyha',
    customer: 'Nagy Anna',
    status: 'install',
    contractValue: 2_700_000,
    invoiced: 1_890_000,
    lines: withSeedOverhead([
      { category: 'anyag', label: 'Lapanyag + vasalat', plan: 620_000, actual: 684_000 },
      { category: 'munka', label: 'Szerelés + összeállítás', plan: 0, actual: 285_000 },
      { category: 'szallitas', label: 'Kiszállítás (Vác → Budapest)', plan: 48_000, actual: 54_000 },
      {
        category: 'beszallito',
        label: 'Vasalat-számla (Blum)',
        plan: 120_000,
        actual: 128_400,
        note: 'Blum számla projektre osztott része.',
      },
      {
        category: 'anyag',
        label: 'Pótrendelés — sérült fiókfront',
        plan: 0,
        actual: 42_000,
        note: 'Szállítási sérülés.',
      },
    ]),
  },
  {
    id: 'PRJ-2026-013',
    name: 'Belváros Café — pultsor',
    customer: 'Belváros Vendéglő Kft.',
    status: 'active',
    contractValue: 3_100_000,
    invoiced: 930_000,
    lines: withSeedOverhead([
      { category: 'anyag', label: 'Tölgy lapanyag', plan: 480_000, actual: 544_000 },
      { category: 'munka', label: 'Szerelés (műhely-napló)', plan: 0, actual: 210_000 },
      { category: 'bermunka', label: 'Élzárás bérmunka (Élzáró Mester)', plan: 95_000, actual: 104_000 },
      { category: 'szallitas', label: 'Kiszállítás', plan: 48_000, actual: 48_000 },
    ]),
  },
  {
    id: 'PRJ-2026-012',
    name: 'Gardrób-sor — Hegyi Lakberendezés',
    customer: 'Hegyi Lakberendezés',
    status: 'done',
    contractValue: 1_685_000,
    invoiced: 1_685_000,
    lines: withSeedOverhead([
      { category: 'anyag', label: 'MDF + furnér', plan: 280_000, actual: 278_000 },
      { category: 'munka', label: 'Gyártás + szerelés', plan: 180_000, actual: 185_000 },
      { category: 'szallitas', label: 'Kiszállítás (Sopron)', plan: 62_000, actual: 58_000 },
    ]),
  },
  {
    id: 'PRJ-2026-011',
    name: 'Doorstar ajtók — 1. ütem',
    customer: 'Doorstar Hungary Zrt.',
    status: 'done',
    contractValue: 12_400_000,
    invoiced: 12_400_000,
    lines: withSeedOverhead([
      { category: 'anyag', label: 'Tölgy 40mm tömör', plan: 2_200_000, actual: 2_180_000 },
      { category: 'munka', label: 'Gyártás / CNC', plan: 1_800_000, actual: 1_920_000 },
      { category: 'szallitas', label: 'Kiszállítás (több fuvar)', plan: 240_000, actual: 255_000 },
      { category: 'bermunka', label: 'Fényes festés (kihelyezett)', plan: 420_000, actual: 390_000 },
    ]),
  },
]
