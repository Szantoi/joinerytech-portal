import type { MaintenancePlan } from '../../services/maintenance/assets'
import type { WorkOrder } from '../../services/maintenance/workOrders'
import { addDays, todayIso } from '../../services/maintenance/calc'

/**
 * Maintenance mock seed — az eszköz-törzs a régi statikus mock (mocks/
 * maintenance.ts) faipari gépneveit hasznosítja újra; a DÁTUMOS adatok
 * (ütemezett/megkezdett munkalapok, terv-esedékesség) a „mához" képest
 * relatív nap-eltolással generáltak, így a dashboard KPI-k, az esedékesség-
 * badge-ek és az ütemterv-rács minden futásnál determinisztikus szerkezetűek.
 *
 * Az eszköz-seed NEM tartalmaz `status` mezőt: az MSW a kiszolgáláskor
 * számítja (services/maintenance/calc calcAssetStatus) — backend-tükör.
 */

/** A seed horgony-napja: ma (a rács és az esedékesség ehhez igazodik). */
export function seedDay(n: number): string {
  return addDays(todayIso(), n)
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const MNT_SEED_IDS = {
  // eszközök
  assetOperational: 'ast-holzma',   // üzemel; idokoz-terv HAMAROSAN esedékes
  assetHoursDue: 'ast-rover',       // üzemel; uzemora-terv MOST esedékes
  assetBreakdown: 'ast-selco',      // folyamatban lévő leállásos javítás → geptores
  assetMaintenance: 'ast-homag',    // folyamatban lévő leállásos megelőző → karbantartas
  assetVehicle: 'ast-transporter',  // jármű, nem esedékes tervvel
  assetRetired: 'ast-kompresszor',  // selejtezve

  // munkalapok — státuszonként legalább egy
  woReported: 'MWO-101',    // bejelentve (javítás, magas)
  woScheduled: 'MWO-102',   // utemezve + felelős (megelőző) — indítható
  woBreakdown: 'MWO-103',   // folyamatban, javítás + leállás → geptores
  woMaintenance: 'MWO-104', // folyamatban, megelőző + leállás → karbantartas
  woCompleted: 'MWO-105',   // kesz (terminális)
  woPostponed: 'MWO-106',   // halasztva
  woRejected: 'MWO-107',    // elutasitva
  woScheduledNoAssignee: 'MWO-108', // utemezve felelős NÉLKÜL — a start-guard esete
} as const

/** Aki a mockban dolgozik/ütemez — auth-bekötésig konstans. */
export const MOCK_TECHNICIAN = 'Horváth Péter'

interface AssetSeed {
  id: string
  code: string
  name: string
  kind: 'gep' | 'jarmu' | 'szerszam' | 'infrastruktura' | 'it' | 'helyiseg'
  location: string
  vendor: string | null
  model: string | null
  operatingHours: number
  retired: boolean
  plans: MaintenancePlan[]
}

/** Eszköz-törzs — 6 eszköz, a számított státusz mind a 4 ágát lefedve. */
export function seedAssets(): AssetSeed[] {
  return [
    {
      id: MNT_SEED_IDS.assetOperational, code: 'MA-001', name: 'Holzma HPP380',
      kind: 'gep', location: 'Vác — főüzem / A csarnok',
      vendor: 'Holzma', model: 'HPP380', operatingHours: 12_400, retired: false,
      plans: [
        {
          // 90 napos időköz, 85 napja végezve → 5 nap múlva esedékes (dueSoon)
          id: 'plan-holzma-neg', label: 'Negyedéves megelőző karbantartás',
          trigger: 'idokoz', intervalDays: 90, intervalHours: null,
          estimatedHours: 4, lastDone: seedDay(-85), lastDoneHours: null,
          assigneeName: MOCK_TECHNICIAN,
        },
      ],
    },
    {
      id: MNT_SEED_IDS.assetHoursDue, code: 'MA-002', name: 'Biesse Rover CNC',
      kind: 'gep', location: 'Vác — főüzem / B csarnok',
      vendor: 'Biesse', model: 'Rover A 1632', operatingHours: 8_320, retired: false,
      plans: [
        {
          // 500 üzemóránként, utoljára 7800-nál → 8300-tól esedékes (MOST due)
          id: 'plan-rover-ken', label: 'Kenés + szűrőcsere (500 üó)',
          trigger: 'uzemora', intervalDays: null, intervalHours: 500,
          estimatedHours: 2, lastDone: null, lastDoneHours: 7_800,
          assigneeName: MOCK_TECHNICIAN,
        },
      ],
    },
    {
      id: MNT_SEED_IDS.assetBreakdown, code: 'MA-003', name: 'Biesse Selco WN6',
      kind: 'gep', location: 'Vác — főüzem / A csarnok',
      vendor: 'Biesse', model: 'Selco WN6', operatingHours: 15_100, retired: false,
      plans: [],
    },
    {
      id: MNT_SEED_IDS.assetMaintenance, code: 'MA-004', name: 'Homag KAL 310 élzáró',
      kind: 'gep', location: 'Vác — főüzem / A csarnok',
      vendor: 'Homag', model: 'KAL 310', operatingHours: 9_650, retired: false,
      plans: [],
    },
    {
      id: MNT_SEED_IDS.assetVehicle, code: 'MA-005', name: 'VW Transporter (szállító)',
      kind: 'jarmu', location: 'Vác — telephely / udvar',
      vendor: 'Volkswagen', model: 'T6.1', operatingHours: 4_200, retired: false,
      plans: [
        {
          // 180 napos szerviz-időköz, 30 napja végezve → nem esedékes
          id: 'plan-vw-szerviz', label: 'Féléves szerviz',
          trigger: 'idokoz', intervalDays: 180, intervalHours: null,
          estimatedHours: 3, lastDone: seedDay(-30), lastDoneHours: null,
          assigneeName: 'Porsche Hungária (külső)',
        },
      ],
    },
    {
      id: MNT_SEED_IDS.assetRetired, code: 'MA-006', name: 'Atlas Copco kompresszor (régi)',
      kind: 'infrastruktura', location: 'Vác — főüzem / gépészet',
      vendor: 'Atlas Copco', model: 'GA11', operatingHours: 38_000, retired: true,
      plans: [],
    },
  ]
}

function assetRef(assets: AssetSeed[], id: string): { assetCode: string; assetName: string } {
  const a = assets.find((x) => x.id === id)
  return { assetCode: a?.code ?? id, assetName: a?.name ?? id }
}

/** 8 munkalap — státuszonként legalább egy + a start-guard felelős-nélküli esete. */
export function seedWorkOrders(): WorkOrder[] {
  const assets = seedAssets()
  const d = seedDay
  const mk = (
    wo: Omit<WorkOrder, 'assetCode' | 'assetName'>,
  ): WorkOrder => ({ ...wo, ...assetRef(assets, wo.assetId) })

  return [
    mk({
      id: MNT_SEED_IDS.woReported, assetId: MNT_SEED_IDS.assetHoursDue,
      type: 'javitas', priority: 'magas', status: 'bejelentve',
      title: 'X-tengely vibráció — helyszíni vizsgálat',
      description: 'Megmunkálás közben szabálytalan rezgés észlelhető az X-tengelyen.',
      requiresDowntime: false,
      scheduledAt: null, estimatedHours: null, actualHours: null,
      assignmentType: null, assigneeName: null,
      reportedAt: d(-2), startedAt: null, completedAt: null,
      log: [{ at: `${d(-2)} 09:14`, text: 'Bejelentve — Kiss András (gépkezelő)' }],
    }),
    mk({
      id: MNT_SEED_IDS.woScheduled, assetId: MNT_SEED_IDS.assetOperational,
      type: 'megelozo', priority: 'kozepes', status: 'utemezve',
      title: 'Negyedéves megelőző karbantartás',
      description: 'Kenési pontok, szűrők, fogasszíj és vákuum-rendszer ellenőrzése.',
      requiresDowntime: true,
      scheduledAt: d(2), estimatedHours: 4, actualHours: null,
      assignmentType: 'belso', assigneeName: MOCK_TECHNICIAN,
      reportedAt: d(-5), startedAt: null, completedAt: null,
      log: [
        { at: `${d(-5)} 08:00`, text: 'Bejelentve — megelőző terv alapján' },
        { at: `${d(-4)} 10:20`, text: `Ütemezve ${d(2)}-ra, felelős: ${MOCK_TECHNICIAN}` },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woBreakdown, assetId: MNT_SEED_IDS.assetBreakdown,
      type: 'javitas', priority: 'kritikus', status: 'folyamatban',
      title: 'Fűrészlap-törés — azonnali csere',
      description: 'Leállt a gép, a fűrészlap eltört. Csere-lap készleten.',
      requiresDowntime: true,
      scheduledAt: d(0), estimatedHours: 3, actualHours: null,
      assignmentType: 'belso', assigneeName: MOCK_TECHNICIAN,
      reportedAt: d(-1), startedAt: d(0), completedAt: null,
      log: [
        { at: `${d(-1)} 07:40`, text: 'Bejelentve — Nagy János (műszakvezető)' },
        { at: `${d(-1)} 08:05`, text: `Ütemezve ${d(0)}-ra, felelős: ${MOCK_TECHNICIAN}` },
        { at: `${d(0)} 06:30`, text: 'Munka megkezdve — a gép leállítva (géptörés)' },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woMaintenance, assetId: MNT_SEED_IDS.assetMaintenance,
      type: 'megelozo', priority: 'kozepes', status: 'folyamatban',
      title: 'Élzáró átfogó karbantartás',
      description: 'Ragasztóegység tisztítás, görgők cseréje — a gyártó szervize végzi.',
      requiresDowntime: true,
      scheduledAt: d(0), estimatedHours: 6, actualHours: null,
      assignmentType: 'kulso', assigneeName: 'Homag Service Kft.',
      reportedAt: d(-7), startedAt: d(0), completedAt: null,
      log: [
        { at: `${d(-7)} 11:00`, text: 'Bejelentve — éves szerviz-terv' },
        { at: `${d(-6)} 09:15`, text: 'Ütemezve, külső partner: Homag Service Kft.' },
        { at: `${d(0)} 08:00`, text: 'Munka megkezdve — tervezett leállás' },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woCompleted, assetId: MNT_SEED_IDS.assetOperational,
      type: 'takaritas', priority: 'alacsony', status: 'kesz',
      title: 'Elszívó-rendszer tisztítás',
      description: 'Forgácselszívó zsákcsere és csővezeték-tisztítás.',
      requiresDowntime: false,
      scheduledAt: d(-3), estimatedHours: 2, actualHours: 1.5,
      assignmentType: 'belso', assigneeName: MOCK_TECHNICIAN,
      reportedAt: d(-6), startedAt: d(-3), completedAt: d(-3),
      log: [
        { at: `${d(-6)} 13:00`, text: 'Bejelentve' },
        { at: `${d(-3)} 14:30`, text: 'Lezárva — tényleges idő: 1,5 ó' },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woPostponed, assetId: MNT_SEED_IDS.assetVehicle,
      type: 'megelozo', priority: 'alacsony', status: 'halasztva',
      title: 'Téli gumi átszerelés',
      description: 'Szezonális kerékcsere és futómű-átvizsgálás.',
      requiresDowntime: false,
      scheduledAt: d(-1), estimatedHours: 1, actualHours: null,
      assignmentType: 'kulso', assigneeName: 'Gumiszerviz Vác',
      reportedAt: d(-10), startedAt: null, completedAt: null,
      postponementReason: 'A jármű kiszállításon van a hét végéig.',
      log: [
        { at: `${d(-10)} 10:00`, text: 'Bejelentve' },
        { at: `${d(-8)} 09:00`, text: `Ütemezve ${d(-1)}-ra` },
        { at: `${d(-2)} 16:20`, text: 'Halasztva — a jármű kiszállításon' },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woRejected, assetId: MNT_SEED_IDS.assetHoursDue,
      type: 'takaritas', priority: 'alacsony', status: 'elutasitva',
      title: 'Vezérlőszekrény festés',
      description: 'Kozmetikai festés-igény a vezérlőszekrényen.',
      requiresDowntime: false,
      scheduledAt: null, estimatedHours: null, actualHours: null,
      assignmentType: null, assigneeName: null,
      reportedAt: d(-4), startedAt: null, completedAt: null,
      rejectionReason: 'Nem karbantartási feladat — üzemeltetési kozmetika, nincs kapacitás.',
      log: [
        { at: `${d(-4)} 12:00`, text: 'Bejelentve' },
        { at: `${d(-3)} 08:45`, text: 'Elutasítva — nem karbantartási feladat' },
      ],
    }),
    mk({
      id: MNT_SEED_IDS.woScheduledNoAssignee, assetId: MNT_SEED_IDS.assetHoursDue,
      type: 'javitas', priority: 'magas', status: 'utemezve',
      title: 'Vákuumszivattyú-csere',
      description: 'A vákuumasztal szivattyúja gyengül — csere ütemezve.',
      requiresDowntime: true,
      scheduledAt: d(4), estimatedHours: 5, actualHours: null,
      assignmentType: null, assigneeName: null,
      reportedAt: d(-3), startedAt: null, completedAt: null,
      log: [
        { at: `${d(-3)} 15:00`, text: 'Bejelentve' },
        { at: `${d(-2)} 09:30`, text: `Ütemezve ${d(4)}-ra — felelős még nincs` },
      ],
    }),
  ]
}

export type { AssetSeed }
