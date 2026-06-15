export type IncidentType = 'accident' | 'near_miss' | 'environmental'
export type IncidentSeverity = 'high' | 'medium' | 'low'
export type IncidentStatus = 'reported' | 'investigating' | 'action' | 'closed'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface EhsIncident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  date: string
  location: string
  reportedBy: string
  persons: string[]
  description: string
  investigationNote?: string
}

export interface EhsRisk {
  id: string
  title: string
  area: string
  probability: 1 | 2 | 3
  impact: 1 | 2 | 3
  level: RiskLevel
  owner: string
  lastReview: string
}

export interface EhsAction {
  id: string
  incidentId?: string
  riskId?: string
  title: string
  assignee: string
  dueDate: string
  done: boolean
  priority: 'high' | 'medium' | 'low'
}

export const INCIDENT_TYPE_META: Record<IncidentType, { label: string; bg: string; fg: string }> = {
  accident:     { label: 'Baleset',    bg: 'bg-rose-100',  fg: 'text-rose-800' },
  near_miss:    { label: 'Közel-miss', bg: 'bg-amber-50',  fg: 'text-amber-700' },
  environmental:{ label: 'Környezeti', bg: 'bg-teal-50',   fg: 'text-teal-700' },
}

export const INCIDENT_SEVERITY_META: Record<IncidentSeverity, { label: string; bg: string; fg: string; dot: string }> = {
  high:   { label: 'Magas',  bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  medium: { label: 'Közepes',bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  low:    { label: 'Alacsony',bg: 'bg-sky-50',    fg: 'text-sky-700',     dot: 'bg-sky-500' },
}

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; bg: string; fg: string; dot: string }> = {
  reported:     { label: 'Bejelentve',   bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
  investigating:{ label: 'Vizsgálat',    bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  action:       { label: 'Intézkedés',   bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  closed:       { label: 'Lezárva',      bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
}

export const RISK_LEVEL_META: Record<RiskLevel, { label: string; bg: string; fg: string }> = {
  critical: { label: 'Kritikus', bg: 'bg-rose-100',    fg: 'text-rose-800' },
  high:     { label: 'Magas',    bg: 'bg-rose-50',     fg: 'text-rose-700' },
  medium:   { label: 'Közepes',  bg: 'bg-amber-50',    fg: 'text-amber-700' },
  low:      { label: 'Alacsony', bg: 'bg-emerald-50',  fg: 'text-emerald-700' },
}

export const INCIDENTS: EhsIncident[] = [
  { id: 'INC-001', type: 'accident', severity: 'medium', status: 'action',
    title: 'Kézsérülés — szabászati gépnél',
    date: '2026-04-15', location: 'Vác — főüzem / A csarnok',
    reportedBy: 'Nagy János', persons: ['Nagy János'],
    description: 'A Holzma HPP380 gépen való munka közben a kezelő kézfeje megérintette a forgó alkatrészt. Kisebb horzsolás keletkezett.',
    investigationNote: 'Biztonsági burkolat nem volt megfelelően rögzítve.' },
  { id: 'INC-002', type: 'near_miss', severity: 'high', status: 'investigating',
    title: 'Anyag leesés — polcrendszerről',
    date: '2026-04-20', location: 'Vác — főüzem / Raktár',
    reportedBy: 'Tóth Kinga', persons: [],
    description: 'Raktárban egy 25 kg-os tábla lecsúszott a polcról. Személyi sérülés nem történt, de közvetlen veszély állt fenn.',
    investigationNote: 'A polc rögzítése nem felel meg az előírásoknak.' },
  { id: 'INC-003', type: 'environmental', severity: 'low', status: 'closed',
    title: 'Oldószer kiömlés — felületkezelő',
    date: '2026-03-28', location: 'Vác — főüzem / C csarnok',
    reportedBy: 'Kiss András', persons: ['Kiss András'],
    description: 'Kis mennyiségű (kb. 0,5 liter) oldószer ömlött ki tárolás közben. Azonnali takarítás megtörtént.',
    investigationNote: 'Tárolóedény sérült volt. Kicserélve.' },
  { id: 'INC-004', type: 'near_miss', severity: 'medium', status: 'reported',
    title: 'Emelőtargonca majdnem elütött valakit',
    date: '2026-04-25', location: 'Vác — főüzem / Udvar',
    reportedBy: 'Horváth Éva', persons: ['Horváth Éva'],
    description: 'A targonca kezelője nem látta az arra sétáló munkavállalót. Fékezéssel sikerült megállni.' },
]

export const RISKS: EhsRisk[] = [
  { id: 'RSK-001', title: 'Forgó alkatrészek — kézsérülés veszély', area: 'Szabászat',
    probability: 2, impact: 3, level: 'high', owner: 'Gábor Márton', lastReview: '2026-04-15' },
  { id: 'RSK-002', title: 'Polcrendszer instabilitás', area: 'Raktár',
    probability: 2, impact: 2, level: 'medium', owner: 'Tóth Kinga', lastReview: '2026-04-20' },
  { id: 'RSK-003', title: 'Vegyszerek kezelése — égési sérülés', area: 'Felületkezelés',
    probability: 1, impact: 3, level: 'high', owner: 'Kiss András', lastReview: '2026-03-30' },
  { id: 'RSK-004', title: 'Targonca — gézolat forgalmi út', area: 'Udvar',
    probability: 3, impact: 2, level: 'high', owner: 'Nagy János', lastReview: '2026-04-25' },
  { id: 'RSK-005', title: 'Por és forgács — légzési kockázat', area: 'CNC megmunkáló',
    probability: 2, impact: 2, level: 'medium', owner: 'Horváth Éva', lastReview: '2026-04-01' },
  { id: 'RSK-006', title: 'Elektromos szerelvények — áramütés', area: 'Villamos rendszer',
    probability: 1, impact: 3, level: 'high', owner: 'Varga László', lastReview: '2026-03-15' },
]

export const ACTIONS: EhsAction[] = [
  { id: 'ACT-001', incidentId: 'INC-001', title: 'Biztonsági burkolat javítása és ellenőrzés',
    assignee: 'Gábor Márton', dueDate: '2026-05-02', done: true, priority: 'high' },
  { id: 'ACT-002', incidentId: 'INC-002', title: 'Polcrendszer megerősítése és terhelési teszt',
    assignee: 'Tóth Kinga', dueDate: '2026-05-05', done: false, priority: 'high' },
  { id: 'ACT-003', riskId: 'RSK-004', title: 'Targonca útvonal jelölések felújítása',
    assignee: 'Nagy János', dueDate: '2026-05-10', done: false, priority: 'medium' },
  { id: 'ACT-004', riskId: 'RSK-001', title: 'Összes gép biztonsági burkolat felülvizsgálata',
    assignee: 'Gábor Márton', dueDate: '2026-06-01', done: false, priority: 'medium' },
  { id: 'ACT-005', riskId: 'RSK-005', title: 'Por szűrő rendszer ellenőrzése és szűrő csere',
    assignee: 'Horváth Éva', dueDate: '2026-05-15', done: false, priority: 'low' },
]
