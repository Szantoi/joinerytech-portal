import { addDays, todayIso } from '../../../services/dateUtils'
import type { CuttingPlan, DailyPlan, PriorityProfile } from '../services/plans'
import type { CuttingList, DoorOrder } from '../services/orders'
import type { QuoteListItem } from '../services/quotes'
import type { ExecutionSeed } from './db'

/**
 * Production mock seed — determinisztikus szerkezet, a „mához" képest relatív
 * dátumokkal (QA seed-minta). Az azonosítók stabilak és beszédesek: a
 * kontraktus-tesztek ezekre hivatkoznak. A státusz-értékek a MAI wire-alakot
 * hordozzák (angol tagnév-string — services/production/wire.ts).
 */

/** A seed horgony-napja: ma (n nap eltolás). */
export function seedDay(n: number): string {
  return addDays(todayIso(), n)
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const PRODUCTION_SEED_IDS = {
  // vágótervek (planning-aggregátum)
  planDraft: 'CPL-401',      // Draft — publikálható
  planPublished: 'CPL-402',  // Published — fagyasztható
  planFrozen: 'CPL-403',     // Frozen — zárható (→ offcut-batch regisztráció)
  planClosed: 'CPL-404',     // Closed (terminális)

  profileDefault: 'PROF-01', // alapértelmezett prioritás-profil (publish-forrás)

  // végrehajtások — a 6 állapot mindegyikére egy
  execScheduled: 'EXE-501',
  execStarted: 'EXE-502',
  execInProgress: 'EXE-503',
  execCompleted: 'EXE-504',
  execCancelled: 'EXE-505',
  execFailed: 'EXE-506',

  // ajtórendelések (joinery)
  ordDraft: 'ORD-601',        // Draft, 3 tétel — beadható
  ordDraftEmpty: 'ORD-602',   // Draft, 0 tétel — submit → 400 (közös guard)
  ordSubmitted: 'ORD-603',    // Submitted (Orchestrator viszi tovább)
  ordCalculating: 'ORD-604',  // Calculating
  ordCalculated: 'ORD-605',   // Calculated — visszavonható, van szabásjegyzéke
  ordFailed: 'ORD-606',       // CalculationFailed — visszavonható
  ordConfirmed: 'ORD-607',    // ConfirmedFromSales (internal konverzióból)

  // árajánlatok
  quotePending: 'QUO-701',
  quotePending2: 'QUO-702',
  quoteQuoted: 'QUO-703',
  quoteConverted: 'QUO-704',
  quoteRejected: 'QUO-705',
} as const

const MOCK_TENANT = 'TEN-DEMO-01'

// ── Vágótervek ──────────────────────────────────────────────────────────────

function dailySlots(planId: string, startOffset: number, jobs: number[]): DailyPlan[] {
  return jobs.map((jobCount, i) => {
    const available = 480
    const allocated = jobCount * 96
    return {
      id: `${planId}-D${i + 1}`,
      date: seedDay(startOffset + i),
      availableCapacity: available,
      allocatedCapacity: allocated,
      utilizationPercent: Math.round((allocated / available) * 1000) / 10,
      jobs: Array.from({ length: jobCount }, (_, j) => ({
        id: `${planId}-D${i + 1}-J${j + 1}`,
        orderId: `ORD-60${(j % 5) + 1}`,
        scheduledDate: seedDay(startOffset + i),
        priority: j === 0 ? 'High' : 'Normal',
        estimatedTimeHours: 1.5 + j * 0.5,
        status: 'Scheduled',
      })),
    }
  })
}

export function seedPlans(): CuttingPlan[] {
  const ids = PRODUCTION_SEED_IDS
  return [
    {
      id: ids.planDraft, planDate: seedDay(1), planDays: 14,
      status: 'Draft', strategyId: 'maxcut-v1',
      dailyPlans: dailySlots(ids.planDraft, 1, [3, 2, 4]),
    },
    {
      id: ids.planPublished, planDate: seedDay(0), planDays: 14,
      status: 'Published', strategyId: 'maxcut-v1',
      dailyPlans: dailySlots(ids.planPublished, 0, [4, 4, 2]),
    },
    {
      id: ids.planFrozen, planDate: seedDay(-3), planDays: 7,
      status: 'Frozen', strategyId: 'maxcut-v1',
      dailyPlans: dailySlots(ids.planFrozen, -3, [5, 3]),
    },
    {
      id: ids.planClosed, planDate: seedDay(-14), planDays: 7,
      status: 'Closed', strategyId: 'maxcut-v1',
      dailyPlans: dailySlots(ids.planClosed, -14, [4, 4]),
    },
  ]
}

export function seedPriorityProfiles(): PriorityProfile[] {
  return [
    {
      id: PRODUCTION_SEED_IDS.profileDefault, tenantId: MOCK_TENANT,
      name: 'Alap prioritás-profil', isDefault: true,
      capacityModelId: 'capacity-default', reworkPolicyId: 'rework-none',
      planningStrategyId: 'maxcut-v1',
    },
    {
      id: 'PROF-02', tenantId: MOCK_TENANT,
      name: 'Sürgős rendelések előre', isDefault: false,
      capacityModelId: 'capacity-default', reworkPolicyId: 'rework-priority',
      planningStrategyId: 'maxcut-v1',
    },
  ]
}

// ── Végrehajtások ───────────────────────────────────────────────────────────

export function seedExecutions(): ExecutionSeed[] {
  const ids = PRODUCTION_SEED_IDS
  const base = { tenantId: MOCK_TENANT, progressEvents: [], milestones: [] }
  return [
    {
      ...base,
      id: ids.execScheduled, sheetId: 'SHT-101', status: 'Scheduled',
      panelsCompleted: 0, totalPanels: 24,
      scheduledAt: `${seedDay(1)}T06:00`, startedAt: null, completedAt: null,
      milestones: [
        { milestoneId: 'MS-501-1', kind: 'PanelCompletion', status: 'Pending', reachedAt: null },
      ],
    },
    {
      ...base,
      id: ids.execStarted, sheetId: 'SHT-102', status: 'Started',
      panelsCompleted: 0, totalPanels: 18,
      scheduledAt: `${seedDay(0)}T07:00`, startedAt: `${seedDay(0)}T07:05`, completedAt: null,
      progressEvents: [
        { eventId: 'EV-502-1', kind: 'MaterialLoaded', panelNumber: null, occurredAt: `${seedDay(0)}T07:05` },
      ],
    },
    {
      ...base,
      id: ids.execInProgress, sheetId: 'SHT-103', status: 'InProgress',
      panelsCompleted: 11, totalPanels: 32,
      scheduledAt: `${seedDay(0)}T05:30`, startedAt: `${seedDay(0)}T05:40`, completedAt: null,
      progressEvents: [
        { eventId: 'EV-503-1', kind: 'MaterialLoaded', panelNumber: null, occurredAt: `${seedDay(0)}T05:40` },
        { eventId: 'EV-503-2', kind: 'PanelStarted', panelNumber: 1, occurredAt: `${seedDay(0)}T05:45` },
        { eventId: 'EV-503-3', kind: 'PanelCompleted', panelNumber: 11, occurredAt: `${seedDay(0)}T08:10` },
      ],
      milestones: [
        { milestoneId: 'MS-503-1', kind: 'PanelCompletion', status: 'Pending', reachedAt: null },
        { milestoneId: 'MS-503-2', kind: 'QualityCheck', status: 'Met', reachedAt: `${seedDay(0)}T07:30` },
      ],
    },
    {
      ...base,
      id: ids.execCompleted, sheetId: 'SHT-104', status: 'Completed',
      panelsCompleted: 40, totalPanels: 40,
      scheduledAt: `${seedDay(-1)}T06:00`, startedAt: `${seedDay(-1)}T06:02`,
      completedAt: `${seedDay(-1)}T13:45`,
      milestones: [
        { milestoneId: 'MS-504-1', kind: 'PanelCompletion', status: 'Met', reachedAt: `${seedDay(-1)}T13:45` },
      ],
    },
    {
      ...base,
      id: ids.execCancelled, sheetId: 'SHT-105', status: 'Cancelled',
      panelsCompleted: 5, totalPanels: 20,
      scheduledAt: `${seedDay(-2)}T09:00`, startedAt: `${seedDay(-2)}T09:10`, completedAt: null,
    },
    {
      ...base,
      id: ids.execFailed, sheetId: 'SHT-106', status: 'Failed',
      panelsCompleted: 2, totalPanels: 16,
      scheduledAt: `${seedDay(-4)}T10:00`, startedAt: `${seedDay(-4)}T10:05`, completedAt: null,
    },
  ]
}

// ── Ajtórendelések (joinery) ────────────────────────────────────────────────

export function seedOrders(): DoorOrder[] {
  const ids = PRODUCTION_SEED_IDS
  const base = { tenantId: MOCK_TENANT, deliveryDate: null }
  return [
    {
      ...base, id: ids.ordDraft, flowEpicId: 'FE-9001', projectId: 'PRJ-2026-041',
      projectName: 'Bognár családi ház — beltéri ajtók', status: 'Draft',
      itemCount: 3, createdAt: `${seedDay(-1)}T09:12`,
    },
    {
      ...base, id: ids.ordDraftEmpty, flowEpicId: 'FE-9002', projectId: 'PRJ-2026-042',
      projectName: 'Irodaház 2. emelet — tokba szerelt ajtók', status: 'Draft',
      itemCount: 0, createdAt: `${seedDay(0)}T08:00`,
    },
    {
      ...base, id: ids.ordSubmitted, flowEpicId: 'FE-9003', projectId: 'PRJ-2026-038',
      projectName: 'Panzió földszint — falcos ajtók', status: 'Submitted',
      itemCount: 8, createdAt: `${seedDay(-2)}T14:30`,
    },
    {
      ...base, id: ids.ordCalculating, flowEpicId: 'FE-9004', projectId: 'PRJ-2026-036',
      projectName: 'Társasház A lépcsőház', status: 'Calculating',
      itemCount: 12, createdAt: `${seedDay(-3)}T10:05`,
    },
    {
      ...base, id: ids.ordCalculated, flowEpicId: 'FE-9005', projectId: 'PRJ-2026-031',
      projectName: 'Óvoda-felújítás — kétszárnyú ajtók', status: 'Calculated',
      itemCount: 6, createdAt: `${seedDay(-5)}T11:40`,
    },
    {
      ...base, id: ids.ordFailed, flowEpicId: 'FE-9006', projectId: 'PRJ-2026-029',
      projectName: 'Pivot bemutatóterem', status: 'CalculationFailed',
      itemCount: 2, createdAt: `${seedDay(-6)}T16:20`,
    },
    {
      ...base, id: ids.ordConfirmed, flowEpicId: 'FE-9007', projectId: 'PRJ-2026-044',
      projectName: 'Sales-konverzió — hotel szárny', status: 'ConfirmedFromSales',
      itemCount: 24, createdAt: `${seedDay(0)}T07:55`,
    },
  ]
}

/** Szabásjegyzékek — a Calculated rendeléshez teljes, a Drafthoz rövid lista. */
export function seedCuttingLists(): Record<string, CuttingList> {
  const ids = PRODUCTION_SEED_IDS
  return {
    [ids.ordCalculated]: {
      orderId: ids.ordCalculated,
      items: [
        { itemSorszam: '1', componentName: 'Ajtólap külső kéreg', material: 'MDF 6mm', componentType: 'Lap', thickness: 6, width: 860, length: 2080, quantity: 12 },
        { itemSorszam: '1', componentName: 'Keretléc függőleges', material: 'Fenyő 32mm', componentType: 'Léc', thickness: 32, width: 60, length: 2080, quantity: 24 },
        { itemSorszam: '2', componentName: 'Keretléc vízszintes', material: 'Fenyő 32mm', componentType: 'Léc', thickness: 32, width: 60, length: 740, quantity: 36 },
        { itemSorszam: '3', componentName: 'Tok-szár', material: 'Tölgy 40mm', componentType: 'Tok', thickness: 40, width: 90, length: 2100, quantity: 12 },
      ],
      totalItemCount: 4,
    },
    [ids.ordDraft]: {
      orderId: ids.ordDraft,
      items: [
        { itemSorszam: '1', componentName: 'Ajtólap külső kéreg', material: 'MDF 6mm', componentType: 'Lap', thickness: 6, width: 760, length: 1980, quantity: 6 },
      ],
      totalItemCount: 1,
    },
  }
}

// ── Árajánlatok ─────────────────────────────────────────────────────────────

export function seedQuotes(): QuoteListItem[] {
  const ids = PRODUCTION_SEED_IDS
  return [
    {
      id: ids.quotePending, quoteNumber: 'Q-2026-118', status: 'PendingReview',
      customerName: 'Kiss Ágnes', customerEmail: 'kiss.agnes@example.hu',
      itemCount: 4, createdAt: `${seedDay(0)}T08:41`, quotedPrice: null,
    },
    {
      id: ids.quotePending2, quoteNumber: 'Q-2026-117', status: 'PendingReview',
      customerName: 'Fodor Bt.', customerEmail: 'iroda@fodorbt.hu',
      itemCount: 9, createdAt: `${seedDay(-1)}T15:22`, quotedPrice: null,
    },
    {
      id: ids.quoteQuoted, quoteNumber: 'Q-2026-114', status: 'Quoted',
      customerName: 'Nagy Múzeum Kft.', customerEmail: 'beszerzes@nagymuzeum.hu',
      itemCount: 15, createdAt: `${seedDay(-4)}T10:02`,
      quotedPrice: { amount: 1240000, currency: 'HUF' },
    },
    {
      id: ids.quoteConverted, quoteNumber: 'Q-2026-109', status: 'ConvertedToOrder',
      customerName: 'Balog és Fia', customerEmail: 'balog@balogesfia.hu',
      itemCount: 7, createdAt: `${seedDay(-9)}T12:15`,
      quotedPrice: { amount: 486000, currency: 'HUF' },
    },
    {
      id: ids.quoteRejected, quoteNumber: 'Q-2026-107', status: 'Rejected',
      customerName: 'Teszt Elek', customerEmail: 'teszt.elek@example.hu',
      itemCount: 1, createdAt: `${seedDay(-11)}T09:30`, quotedPrice: null,
    },
  ]
}

/** Waste-riport seed-összetevője: átlagos hulladék végrehajtásonként (cm²). */
export const SEED_WASTE_PER_EXECUTION_CM2 = 1180.5
