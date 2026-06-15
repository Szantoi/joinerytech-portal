export type NcrStatus = 'open' | 'under_review' | 'closed' | 'rejected'
export type NcrSeverity = 'critical' | 'major' | 'minor'
export type AuditResult = 'pass' | 'fail' | 'conditional'

export interface QualityNcr {
  id: string
  title: string
  product: string
  severity: NcrSeverity
  status: NcrStatus
  reportedBy: string
  reportedAt: string
  closedAt?: string
  description: string
  fixPlan?: string
}

export interface QualityTemplate {
  id: string
  name: string
  productType: string
  items: string[]
  usedCount: number
}

export interface QualityAudit {
  id: string
  templateId: string
  product: string
  inspector: string
  date: string
  result: AuditResult
  passRate: number
  findings: number
}

export const NCR_STATUS_META: Record<NcrStatus, { label: string; bg: string; fg: string; dot: string }> = {
  open:         { label: 'Nyitott',       bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  under_review: { label: 'Vizsgálat',     bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  closed:       { label: 'Lezárva',       bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:     { label: 'Visszautasítva',bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
}

export const NCR_SEVERITY_META: Record<NcrSeverity, { label: string; bg: string; fg: string }> = {
  critical: { label: 'Kritikus', bg: 'bg-rose-100',    fg: 'text-rose-800' },
  major:    { label: 'Súlyos',   bg: 'bg-amber-100',   fg: 'text-amber-800' },
  minor:    { label: 'Enyhe',    bg: 'bg-sky-50',      fg: 'text-sky-700' },
}

export const AUDIT_RESULT_META: Record<AuditResult, { label: string; bg: string; fg: string; dot: string }> = {
  pass:        { label: 'Megfelelt',   bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  fail:        { label: 'Nem felelt',  bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  conditional: { label: 'Feltételes',  bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
}

export const NCRS: QualityNcr[] = [
  { id: 'NCR-001', title: 'Felületi karcolás — konyha frontokon',
    product: 'Konyhabútor front EG-3327', severity: 'major', status: 'open',
    reportedBy: 'Szabó A.', reportedAt: '2026-04-25',
    description: 'A szállított front lapokon mm-es mélységű karcolások találhatók. Érintett mennyiség: 8 db.',
    fixPlan: 'Felülvizsgálat, sérült lapok cseréje szükséges.' },
  { id: 'NCR-002', title: 'Mérethiba — ajtólap magasság +3mm',
    product: 'Belső ajtó TL-040', severity: 'critical', status: 'under_review',
    reportedBy: 'Nagy J.', reportedAt: '2026-04-22',
    description: 'A gyártott ajtólapok magassága 2053mm, míg a specifikáció 2050mm. Érintett: 12 db.',
    fixPlan: 'CNC program ellenőrzése és korrekció.' },
  { id: 'NCR-003', title: 'Élzárás peeling — nedves helyiség bútor',
    product: 'Fürdőszoba szekrény', severity: 'minor', status: 'closed',
    reportedBy: 'Tóth K.', reportedAt: '2026-04-10', closedAt: '2026-04-18',
    description: 'Élzárás 2 db szekrényen levált. Nedvességnek való kitettség.',
    fixPlan: 'ABS élzárás vízálló változattal pótolva.' },
  { id: 'NCR-004', title: 'Illesztési hiba — fiók tengely eltérés',
    product: 'Konyhai alsó szekrény fiókos', severity: 'major', status: 'open',
    reportedBy: 'Kiss A.', reportedAt: '2026-04-26',
    description: 'Fiók csúszó tengelye 1,5mm-el el van csúszva, a fiók nehezen nyílik.',
    fixPlan: 'Szerelési utasítás felülvizsgálata.' },
  { id: 'NCR-005', title: 'Furat eltolódás — pánt fúrás',
    product: 'Gardrób ajtó', severity: 'minor', status: 'rejected',
    reportedBy: 'Horváth É.', reportedAt: '2026-04-15',
    description: 'Pánt fúrás 0,5mm-el eltolódott. Ügyfél elfogadta a terméket.',
  },
]

export const TEMPLATES: QualityTemplate[] = [
  { id: 'QT-001', name: 'Konyhabútor végső ellenőrzés', productType: 'Konyhabútor',
    items: [
      'Méretek megfelelnek a tervnek',
      'Felület karcolásmentes',
      'Élzárás tapad, nem peeling',
      'Fiókok simán nyílnak-csukódnak',
      'Pántok beállítva, ajtó egyenes',
      'Anyag azonosítás helyes',
    ],
    usedCount: 42 },
  { id: 'QT-002', name: 'Ajtólap minőségi ellenőrzés', productType: 'Ajtó',
    items: [
      'Magasság és szélesség ellenőrzve',
      'Felület sérülésmentes',
      'Pánt furatok pontosak',
      'Festés/furnér egyenletes',
      'Tok illeszkedés megfelelő',
    ],
    usedCount: 28 },
  { id: 'QT-003', name: 'Szekrény korpusz ellenőrzés', productType: 'Szekrény',
    items: [
      'Korpusz derékszögű',
      'Hátlap rögzített',
      'Polcfuratok egyenletesek',
      'Kötőelemek teljesek',
      'Anyagminőség megfelelő',
    ],
    usedCount: 65 },
]

export const AUDITS: QualityAudit[] = [
  { id: 'AUD-001', templateId: 'QT-001', product: 'Bognár Bútor — Konyhabútor sor',
    inspector: 'Tóth K.', date: '2026-04-27', result: 'pass', passRate: 100, findings: 0 },
  { id: 'AUD-002', templateId: 'QT-002', product: 'Doorstar ajtó csomag (12 db)',
    inspector: 'Kiss A.', date: '2026-04-26', result: 'conditional', passRate: 83, findings: 1 },
  { id: 'AUD-003', templateId: 'QT-003', product: 'Hegyi Lakberendezés — Gardrób',
    inspector: 'Tóth K.', date: '2026-04-24', result: 'pass', passRate: 100, findings: 0 },
  { id: 'AUD-004', templateId: 'QT-001', product: 'Várdai Konyhastúdió — Demo konyha',
    inspector: 'Nagy J.', date: '2026-04-22', result: 'fail', passRate: 67, findings: 2 },
  { id: 'AUD-005', templateId: 'QT-002', product: 'Belső ajtók — 2. ütem minta',
    inspector: 'Horváth É.', date: '2026-04-20', result: 'pass', passRate: 100, findings: 0 },
  { id: 'AUD-006', templateId: 'QT-003', product: 'Irodai polcrendszer — Pesti',
    inspector: 'Kiss A.', date: '2026-04-18', result: 'conditional', passRate: 80, findings: 1 },
]
