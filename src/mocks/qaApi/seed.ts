import type { InspectionCriterion } from '../../services/qa/inspections'
import type { Ticket } from '../../services/qa/tickets'
import type { CheckpointType } from '../../services/qa/inspections'
import type { CriticalLevel } from '../../services/qa/calc'
import { addDays, todayIso } from '../../services/qa/calc'
import type { InspectionSeed } from './db'

/**
 * QA mock seed — a tartalmi törzs a régi statikus mock (mocks/quality.ts)
 * faipari NCR/sablon-anyagát hasznosítja újra, a KANONIKUS magyar
 * státusz-kulcsokkal (a régi mock angol enumja hibás volt — F0-felmérés).
 * A DÁTUMOS adatok a „mához" képest relatív nap-eltolással generáltak, így a
 * dashboard KPI-k és a heti trend minden futásnál determinisztikus szerkezetűek.
 *
 * Az átvizsgálás-seed NEM tartalmaz `blocking`/`openTickets` mezőt: az MSW a
 * kiszolgáláskor számítja (services/qa/calc + nyitott-guard) — backend-tükör.
 */

/** A seed horgony-napja: ma (a trend és a KPI-k ehhez igazodnak). */
export function seedDay(n: number): string {
  return addDays(todayIso(), n)
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const QA_SEED_IDS = {
  // átvizsgálások
  inspPlanned: 'INSP-201',        // nyitott (kritikus ponton) — indítható
  inspInProgress: 'INSP-202',     // folyamatban — megfeleltethető/selejtezhető
  inspPassed: 'INSP-203',         // megfelelt (terminális)
  inspFailedCritical: 'INSP-204', // selejt KRITIKUS ponton → blocking + nyitott hibajegy
  inspFailedMinor: 'INSP-205',    // selejt enyhe ponton → NEM blocking
  inspPassedW1: 'INSP-206',       // megfelelt, előző hét (trend)
  inspPassedW2: 'INSP-207',       // megfelelt, két hete (trend)
  inspPassedW2b: 'INSP-208',      // megfelelt, két hete (trend)

  // hibajegyek — státuszonként legalább egy
  ticketCritical: 'QAT-301',   // bejelentve, kritikus — az INSP-204-hez kapcsolt
  ticketAssigned: 'QAT-302',   // kiosztva — indítható
  ticketInProgress: 'QAT-303', // folyamatban — az INSP-205-höz kapcsolt
  ticketResolved: 'QAT-304',   // megoldva (terminális), intézkedésekkel
  ticketRejected: 'QAT-305',   // elutasitva — újranyitható
  ticketReported: 'QAT-306',   // bejelentve, kapcsolat nélkül — kiosztható
} as const

/** Aki a mockban átvizsgál / bejelent — auth-bekötésig konstans. */
export const MOCK_INSPECTOR = 'Tóth Kinga'
export const MOCK_REPORTER = 'Szabó Anna'

// ── Ellenőrzési pontok (QACheckpoint-törzs, az átvizsgálásokba denormalizálva) ─

interface CheckpointSeed {
  id: string
  name: string
  type: CheckpointType
  criticalLevel: CriticalLevel
  criteria: InspectionCriterion[]
}

const CHECKPOINTS: Record<string, CheckpointSeed> = {
  final: {
    id: 'QCP-01', name: 'Konyhabútor végső ellenőrzés',
    type: 'vegso', criticalLevel: 'kritikus',
    criteria: [
      { id: 'c1', type: 'meretes', description: 'Méretek megfelelnek a tervnek' },
      { id: 'c2', type: 'vizualis', description: 'Felület karcolásmentes' },
      { id: 'c3', type: 'vizualis', description: 'Élzárás tapad, nem peeling' },
      { id: 'c4', type: 'funkcionalis', description: 'Fiókok simán nyílnak-csukódnak' },
      { id: 'c5', type: 'funkcionalis', description: 'Pántok beállítva, ajtó egyenes' },
      { id: 'c6', type: 'vizualis', description: 'Anyag-azonosítás helyes' },
    ],
  },
  door: {
    id: 'QCP-02', name: 'Ajtólap minőségi ellenőrzés',
    type: 'gyartaskozi', criticalLevel: 'jelentos',
    criteria: [
      { id: 'c1', type: 'meretes', description: 'Magasság és szélesség ellenőrizve' },
      { id: 'c2', type: 'vizualis', description: 'Felület sérülésmentes' },
      { id: 'c3', type: 'meretes', description: 'Pánt-furatok pontosak' },
      { id: 'c4', type: 'vizualis', description: 'Festés/furnér egyenletes' },
      { id: 'c5', type: 'funkcionalis', description: 'Tok-illeszkedés megfelelő' },
    ],
  },
  incoming: {
    id: 'QCP-03', name: 'Szekrény korpusz beérkező ellenőrzés',
    type: 'beerkezo', criticalLevel: 'enyhe',
    criteria: [
      { id: 'c1', type: 'meretes', description: 'Korpusz derékszögű' },
      { id: 'c2', type: 'funkcionalis', description: 'Hátlap rögzített' },
      { id: 'c3', type: 'meretes', description: 'Polcfuratok egyenletesek' },
      { id: 'c4', type: 'vizualis', description: 'Kötőelemek teljesek' },
      { id: 'c5', type: 'vizualis', description: 'Anyagminőség megfelelő' },
    ],
  },
}

function cp(key: keyof typeof CHECKPOINTS) {
  const c = CHECKPOINTS[key]
  return {
    checkpointId: c.id, checkpointName: c.name,
    checkpointType: c.type, criticalLevel: c.criticalLevel, criteria: c.criteria,
  }
}

// ── Átvizsgálások — 8 sor: 2 nyitott + 6 lezárt (4 megfelelt, 2 selejt) ──────

export function seedInspections(): InspectionSeed[] {
  const d = seedDay
  return [
    {
      id: QA_SEED_IDS.inspPlanned, ...cp('final'),
      orderRef: 'JT-2426-0184', productName: 'Bognár konyhabútor sor',
      status: 'nyitott', inspectorName: MOCK_INSPECTOR,
      notes: null, failureNotes: [],
      plannedAt: `${d(1)}T09:00`, startedAt: null, completedAt: null,
    },
    {
      id: QA_SEED_IDS.inspInProgress, ...cp('door'),
      orderRef: 'JT-2426-0182', productName: 'Doorstar ajtó csomag (12 db)',
      status: 'folyamatban', inspectorName: 'Kiss András',
      notes: null, failureNotes: [],
      plannedAt: `${d(0)}T08:00`, startedAt: `${d(0)}T08:10`, completedAt: null,
    },
    {
      id: QA_SEED_IDS.inspPassed, ...cp('final'),
      orderRef: 'JT-2426-0180', productName: 'Hegyi gardrób szekrény-sor',
      status: 'megfelelt', inspectorName: MOCK_INSPECTOR,
      notes: 'Minden szempont rendben.', failureNotes: [],
      plannedAt: `${d(-2)}T10:00`, startedAt: `${d(-2)}T10:05`, completedAt: `${d(-2)}T14:30`,
    },
    {
      // KRITIKUS ponton selejt → kiszolgáláskor blocking=true (calc-tükör)
      id: QA_SEED_IDS.inspFailedCritical, ...cp('final'),
      orderRef: 'JT-2426-0184', productName: 'Bognár konyhabútor front-sor',
      status: 'selejt', inspectorName: MOCK_INSPECTOR,
      notes: 'Selejt — a front-sor újragyártása szükséges.',
      failureNotes: [
        { failureType: 'karc', description: 'Felületi karcolás a front lapokon — 8 db érintett', photoUrl: null },
        { failureType: 'meret', description: 'Fiókfront magasság −1,5 mm a tervhez képest', photoUrl: null },
      ],
      plannedAt: `${d(-1)}T09:00`, startedAt: `${d(-1)}T09:05`, completedAt: `${d(-1)}T10:15`,
    },
    {
      // enyhe ponton selejt → NEM blokkol
      id: QA_SEED_IDS.inspFailedMinor, ...cp('incoming'),
      orderRef: null, productName: 'Korpusz alapanyag — Falco szállítmány',
      status: 'selejt', inspectorName: 'Horváth Éva',
      notes: null,
      failureNotes: [
        { failureType: 'hezag', description: 'Hátlap illesztési hézag 2 mm', photoUrl: null },
      ],
      plannedAt: `${d(-9)}T10:30`, startedAt: `${d(-9)}T10:35`, completedAt: `${d(-9)}T11:00`,
    },
    {
      id: QA_SEED_IDS.inspPassedW1, ...cp('door'),
      orderRef: 'JT-2426-0182', productName: 'Belső ajtók — 2. ütem minta',
      status: 'megfelelt', inspectorName: 'Horváth Éva',
      notes: null, failureNotes: [],
      plannedAt: `${d(-8)}T14:00`, startedAt: `${d(-8)}T14:05`, completedAt: `${d(-8)}T16:00`,
    },
    {
      id: QA_SEED_IDS.inspPassedW2, ...cp('incoming'),
      orderRef: null, productName: 'MDF-tábla beszállítás — Kronospan',
      status: 'megfelelt', inspectorName: 'Kiss András',
      notes: null, failureNotes: [],
      plannedAt: `${d(-15)}T09:00`, startedAt: `${d(-15)}T09:05`, completedAt: `${d(-15)}T09:30`,
    },
    {
      id: QA_SEED_IDS.inspPassedW2b, ...cp('final'),
      orderRef: 'JT-2426-0176', productName: 'Tóth konyha — alsó elemek',
      status: 'megfelelt', inspectorName: MOCK_INSPECTOR,
      notes: null, failureNotes: [],
      plannedAt: `${d(-16)}T11:00`, startedAt: `${d(-16)}T11:10`, completedAt: `${d(-16)}T13:00`,
    },
  ]
}

// ── Hibajegyek — 6 sor: státuszonként legalább egy + kapcsolt esetek ─────────

export function seedTickets(): Ticket[] {
  const d = seedDay
  return [
    {
      id: QA_SEED_IDS.ticketCritical,
      ticketType: 'javitas', status: 'bejelentve', priority: 'kritikus',
      orderRef: 'JT-2426-0184', productName: 'Bognár konyhabútor front-sor',
      inspectionId: QA_SEED_IDS.inspFailedCritical,
      inspectionRef: CHECKPOINTS.final.name,
      title: 'Felületi karcolás — konyha frontokon',
      description: 'A selejtezett front lapokon mm-es mélységű karcolások — 8 db érintett, újragyártás szükséges.',
      reportedBy: MOCK_REPORTER, assigneeName: null,
      resolutionNotes: null, resolutionActions: [],
      reportedAt: `${d(-1)}T11:00`, assignedAt: null, startedAt: null, resolvedAt: null,
    },
    {
      id: QA_SEED_IDS.ticketAssigned,
      ticketType: 'garancia', status: 'kiosztva', priority: 'magas',
      orderRef: 'JT-2426-0176', productName: 'Fürdőszoba szekrény',
      inspectionId: null, inspectionRef: null,
      title: 'Élzárás peeling — nedves helyiség bútor',
      description: 'Élzárás 2 db szekrényen levált — garanciális bejelentés, vízálló ABS-csere szükséges.',
      reportedBy: MOCK_REPORTER, assigneeName: 'Kiss András',
      resolutionNotes: null, resolutionActions: [],
      reportedAt: `${d(-4)}T09:20`, assignedAt: `${d(-3)}T08:00`, startedAt: null, resolvedAt: null,
    },
    {
      id: QA_SEED_IDS.ticketInProgress,
      ticketType: 'javitas', status: 'folyamatban', priority: 'magas',
      orderRef: null, productName: 'Korpusz alapanyag — Falco szállítmány',
      inspectionId: QA_SEED_IDS.inspFailedMinor,
      inspectionRef: CHECKPOINTS.incoming.name,
      title: 'Hátlap illesztési hézag — beérkező korpusz',
      description: 'A beérkező ellenőrzésen kiszűrt 2 mm-es illesztési hézag javítása, beszállítói egyeztetéssel.',
      reportedBy: 'Horváth Éva', assigneeName: 'Horváth Éva',
      resolutionNotes: null, resolutionActions: [],
      reportedAt: `${d(-9)}T11:30`, assignedAt: `${d(-8)}T08:30`, startedAt: `${d(-7)}T09:00`, resolvedAt: null,
    },
    {
      id: QA_SEED_IDS.ticketResolved,
      ticketType: 'javitas', status: 'megoldva', priority: 'kozepes',
      orderRef: 'JT-2426-0182', productName: 'Belső ajtó TL-040',
      inspectionId: null, inspectionRef: null,
      title: 'Mérethiba — ajtólap magasság +3 mm',
      description: 'A gyártott ajtólapok magassága 2053 mm a 2050 mm-es specifikáció helyett — 12 db érintett.',
      reportedBy: 'Nagy János', assigneeName: MOCK_INSPECTOR,
      resolutionNotes: 'CNC program javítva, az érintett lapok újragyártva.',
      resolutionActions: [
        { actionType: 'javitas', description: 'CNC program korrekció + újravágás', costAmount: 48_000 },
        { actionType: 'csere', description: '2 db menthetetlen ajtólap cseréje', costAmount: 36_000 },
      ],
      reportedAt: `${d(-12)}T09:00`, assignedAt: `${d(-11)}T10:00`,
      startedAt: `${d(-11)}T13:00`, resolvedAt: `${d(-5)}T15:00`,
    },
    {
      id: QA_SEED_IDS.ticketRejected,
      ticketType: 'hiany', status: 'elutasitva', priority: 'alacsony',
      orderRef: null, productName: 'Gardrób ajtó',
      inspectionId: null, inspectionRef: null,
      title: 'Furat-eltolódás — pánt fúrás',
      description: 'Pánt-fúrás 0,5 mm-rel eltolódott — az ügyfél a terméket elfogadta.',
      reportedBy: MOCK_REPORTER, assigneeName: 'Kiss András',
      // a backend a Reject(reason) indokát a resolutionNotes-ba írja (tükör)
      resolutionNotes: 'Ügyfél elfogadta a terméket — nem minőségi hiba.',
      resolutionActions: [],
      reportedAt: `${d(-6)}T14:00`, assignedAt: `${d(-6)}T15:00`, startedAt: `${d(-5)}T08:00`, resolvedAt: null,
    },
    {
      id: QA_SEED_IDS.ticketReported,
      ticketType: 'hiany', status: 'bejelentve', priority: 'kozepes',
      orderRef: 'JT-2426-0175', productName: 'Irodai polcrendszer',
      inspectionId: null, inspectionRef: null,
      title: 'Hiányzó kötőelem-csomag — polcrendszer',
      description: 'A kiszállított polcrendszerből hiányzik a kötőelem-csomag — pótlás szükséges.',
      reportedBy: MOCK_REPORTER, assigneeName: null,
      resolutionNotes: null, resolutionActions: [],
      reportedAt: `${d(0)}T07:45`, assignedAt: null, startedAt: null, resolvedAt: null,
    },
  ]
}
