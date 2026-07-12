// KONTROLLING világ — mock adatok

export type CtrlCatKey = 'anyag' | 'munka' | 'bermunka' | 'szallitas' | 'beszallito' | 'rezsi'
export type ProjectStatus = 'draft' | 'active' | 'install' | 'done' | 'on_hold'

export interface CtrlCatMeta {
  label: string
  icon: string
  pill: string
  accent: string
}

export const CTRL_CAT_META: Record<CtrlCatKey, CtrlCatMeta> = {
  anyag:      { label: 'Anyag',              icon: 'box',      pill: 'bg-teal-50 text-teal-700 border-teal-200',      accent: '#0d9488' },
  munka:      { label: 'Munkaóra',           icon: 'wrench',   pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: '#4f46e5' },
  bermunka:   { label: 'Bérmunka',           icon: 'external', pill: 'bg-amber-50 text-amber-700 border-amber-200',   accent: '#d97706' },
  szallitas:  { label: 'Szállítás',          icon: 'truck',    pill: 'bg-sky-50 text-sky-700 border-sky-200',         accent: '#0284c7' },
  beszallito: { label: 'Beszállítói számla', icon: 'receipt',  pill: 'bg-violet-50 text-violet-700 border-violet-200', accent: '#7c3aed' },
  rezsi:      { label: 'Rezsi / átalány',    icon: 'layers',   pill: 'bg-stone-100 text-stone-600 border-stone-200',  accent: '#78716c' },
}

export const CTRL_CAT_ORDER: CtrlCatKey[] = ['anyag', 'munka', 'bermunka', 'szallitas', 'beszallito', 'rezsi']

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; pill: string }> = {
  draft:    { label: 'Vázlat',       pill: 'bg-stone-100 text-stone-600 border-stone-200' },
  active:   { label: 'Folyamatban',  pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  install:  { label: 'Beépítés',     pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  done:     { label: 'Kész',         pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  on_hold:  { label: 'Áll',          pill: 'bg-stone-100 text-stone-500 border-stone-200' },
}

export interface CtrlCatLine {
  cat: CtrlCatKey
  label: string
  plan: number
  actual: number
  note?: string
}

export interface CtrlProject {
  id: string
  name: string
  customer: string
  status: ProjectStatus
  contractValue: number
  invoiced: number
  lines: CtrlCatLine[]
}

// overhead %
const OVERHEAD_PCT = 0.12

function withOverhead(lines: CtrlCatLine[]): CtrlCatLine[] {
  const directPlan   = lines.reduce((s, l) => s + l.plan, 0)
  const directActual = lines.reduce((s, l) => s + l.actual, 0)
  return [
    ...lines,
    {
      cat: 'rezsi',
      label: 'Rezsi (12%)',
      plan: Math.round(directPlan * OVERHEAD_PCT),
      actual: Math.round(directActual * OVERHEAD_PCT),
    },
  ]
}

interface RawProject extends Omit<CtrlProject, 'lines'> {
  rawLines: CtrlCatLine[]
}

const RAW_PROJECTS: RawProject[] = [
  {
    id: 'PRJ-2026-014',
    name: 'Petőfi u. 12. — Konyha',
    customer: 'Nagy Anna',
    status: 'install',
    contractValue: 2_700_000,
    invoiced: 1_890_000,
    rawLines: [
      { cat: 'anyag',      label: 'Lapanyag + vasalat',               plan: 620_000,  actual: 684_000 },
      { cat: 'munka',      label: 'Szerelés + összeállítás',          plan: 0,        actual: 285_000 },
      { cat: 'szallitas',  label: 'Kiszállítás (Vác → Budapest)',      plan: 48_000,   actual: 54_000 },
      { cat: 'beszallito', label: 'Vasalat-számla (Blum)',             plan: 120_000,  actual: 128_400, note: 'Blum számla projektre osztott része.' },
      { cat: 'anyag',      label: 'Pótrendelés — sérült fiókfront',   plan: 0,        actual: 42_000, note: 'Szállítási sérülés.' },
    ],
  },
  {
    id: 'PRJ-2026-013',
    name: 'Belváros Café — pultsor',
    customer: 'Belváros Vendéglő Kft.',
    status: 'active',
    contractValue: 3_100_000,
    invoiced: 930_000,
    rawLines: [
      { cat: 'anyag',     label: 'Tölgy lapanyag',                   plan: 480_000,  actual: 544_000 },
      { cat: 'munka',     label: 'Szerelés (műhely-napló)',           plan: 0,        actual: 210_000 },
      { cat: 'bermunka',  label: 'Élzárás bérmunka (Élzáró Mester)', plan: 95_000,   actual: 104_000 },
      { cat: 'szallitas', label: 'Kiszállítás',                      plan: 48_000,   actual: 48_000 },
    ],
  },
  {
    id: 'PRJ-2026-012',
    name: 'Gardrób-sor — Hegyi Lakberendezés',
    customer: 'Hegyi Lakberendezés',
    status: 'done',
    contractValue: 1_685_000,
    invoiced: 1_685_000,
    rawLines: [
      { cat: 'anyag',     label: 'MDF + furnér',          plan: 280_000,  actual: 278_000 },
      { cat: 'munka',     label: 'Gyártás + szerelés',    plan: 180_000,  actual: 185_000 },
      { cat: 'szallitas', label: 'Kiszállítás (Sopron)',  plan: 62_000,   actual: 58_000 },
    ],
  },
  {
    id: 'PRJ-2026-011',
    name: 'Doorstar ajtók — 1. ütem',
    customer: 'Doorstar Hungary Zrt.',
    status: 'done',
    contractValue: 12_400_000,
    invoiced: 12_400_000,
    rawLines: [
      { cat: 'anyag',     label: 'Tölgy 40mm tömör',     plan: 2_200_000, actual: 2_180_000 },
      { cat: 'munka',     label: 'Gyártás / CNC',         plan: 1_800_000, actual: 1_920_000 },
      { cat: 'szallitas', label: 'Kiszállítás (több fuvar)', plan: 240_000, actual: 255_000 },
      { cat: 'bermunka',  label: 'Fényes festés (kihelyezett)', plan: 420_000, actual: 390_000 },
    ],
  },
]

export const CTRL_PROJECTS: CtrlProject[] = RAW_PROJECTS.map(({ rawLines, ...p }) => ({
  ...p,
  lines: withOverhead(rawLines),
}))

// ── Margin helpers ──────────────────────────────────────────────────────────

export function ctrlMarginTone(pct: number | null): { label: string; pill: string; dot: string; bar: string; fg: string } {
  if (pct == null) return { label: '—',           pill: 'bg-stone-100 text-stone-500 border-stone-200',      dot: 'bg-stone-400',   bar: 'bg-stone-400',   fg: 'text-stone-600' }
  if (pct < 0)     return { label: 'Veszteséges', pill: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',    bar: 'bg-rose-500',    fg: 'text-rose-700' }
  if (pct < 0.15)  return { label: 'Gyenge',      pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   bar: 'bg-amber-500',   fg: 'text-amber-700' }
  if (pct < 0.30)  return { label: 'Közepes',     pill: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     bar: 'bg-sky-500',     fg: 'text-sky-700' }
  return                   { label: 'Jó',          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500', fg: 'text-emerald-700' }
}

export function ctrlVarianceTone(diff: number): { pill: string; fg: string; sign: string } {
  if (Math.abs(diff) < 1) return { pill: 'bg-stone-100 text-stone-500 border-stone-200', fg: 'text-stone-500', sign: '' }
  if (diff > 0)            return { pill: 'bg-rose-50 text-rose-700 border-rose-200',     fg: 'text-rose-700',  sign: '+' }
  return                          { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', fg: 'text-emerald-700', sign: '−' }
}

export function ctrlHuf(n: number): string {
  return Math.round(n).toLocaleString('hu-HU') + ' Ft'
}

export function ctrlHufM(n: number): string {
  const v = n / 1e6
  return (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' M'
}

export function ctrlPct(x: number | null): string {
  return x == null ? '—' : (x * 100).toFixed(0) + '%'
}

// ── Per-project calculations ─────────────────────────────────────────────────

export interface CtrlProjectCalc {
  project: CtrlProject
  planTotal: number
  actualTotal: number
  planMargin: number
  actualMargin: number
  planMarginPct: number | null
  actualMarginPct: number | null
  variance: number
}

export function calcProject(p: CtrlProject): CtrlProjectCalc {
  const planTotal   = p.lines.reduce((s, l) => s + l.plan, 0)
  const actualTotal = p.lines.reduce((s, l) => s + l.actual, 0)
  const planMargin   = p.contractValue - planTotal
  const actualMargin = p.contractValue - actualTotal
  return {
    project: p,
    planTotal,
    actualTotal,
    planMargin,
    actualMargin,
    planMarginPct:   p.contractValue > 0 ? planMargin / p.contractValue   : null,
    actualMarginPct: p.contractValue > 0 ? actualMargin / p.contractValue : null,
    variance: actualTotal - planTotal,
  }
}

export interface CtrlPortfolio {
  rows: CtrlProjectCalc[]
  totals: {
    contract: number
    invoiced: number
    planTotal: number
    actualTotal: number
    planMarginPct: number | null
    actualMarginPct: number | null
  }
  top: CtrlProjectCalc | null
  flop: CtrlProjectCalc | null
}

export function calcPortfolio(): CtrlPortfolio {
  const rows = CTRL_PROJECTS.map(calcProject)
  const contract   = CTRL_PROJECTS.reduce((s, p) => s + p.contractValue, 0)
  const invoiced   = CTRL_PROJECTS.reduce((s, p) => s + p.invoiced, 0)
  const planTotal  = rows.reduce((s, r) => s + r.planTotal, 0)
  const actualTotal = rows.reduce((s, r) => s + r.actualTotal, 0)
  const sorted = [...rows].sort((a, b) => (b.actualMarginPct ?? -1) - (a.actualMarginPct ?? -1))
  return {
    rows,
    totals: {
      contract, invoiced, planTotal, actualTotal,
      planMarginPct:   contract > 0 ? (contract - planTotal) / contract   : null,
      actualMarginPct: contract > 0 ? (contract - actualTotal) / contract : null,
    },
    top:  sorted[0] ?? null,
    flop: sorted[sorted.length - 1] ?? null,
  }
}
