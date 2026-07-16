import { PLAN_DUE_SOON_DAYS, PLAN_DUE_SOON_HOURS, SCHEDULE_WINDOW_DAYS } from './config'
import { type WorkOrderStatus } from './fsm'
import { addDays, diffDays } from '../dateUtils'

/**
 * calc — a Maintenance backend két domain-service-ének tükre, tiszta
 * (tesztelhető) függvényekként (a HR/Kontrolling calc.ts mintája):
 *
 *  1. `calcAssetStatus` = `AssetStatusCalculationService` — az eszköz-státusz
 *     SZÁMÍTOTT, SOSEM tárolt: selejtezett → selejtezve; folyamatban lévő,
 *     leállással járó javítás → geptores; egyéb leállásos munka → karbantartas;
 *     különben uzemel.
 *  2. `isPlanDue` / `planDueInfo` = `PreventiveMaintenanceSchedulerService` —
 *     idokoz-trigger: lastDone + intervalDays <= ma; uzemora-trigger:
 *     lastDoneHours + intervalHours <= aktuális üzemóra; soha-nem-végzett terv
 *     azonnal esedékes.
 *
 * Ugyanezt a modult futtatja a UI (megjelenítés) és az MSW mock (az
 * asset-válaszok `status`/`duePlans` mezőinek kiszámítása) — egy igazságforrás:
 * a kliens SOSEM számol saját eszköz-státuszt, a válaszban kapott jelenik meg.
 */

// ── Dátum-helperek — a közös services/dateUtils-ból (helyi idő, YYYY-MM-DD) ──
// Re-export, hogy a modul-API (services/maintenance) változatlan maradjon.

export { parseDay, formatDay, addDays, diffDays, todayIso } from '../dateUtils'

/** Az ütemterv-rács napjai: a kezdőnaptól SCHEDULE_WINDOW_DAYS naptári nap. */
export function scheduleWindow(startIso: string, days: number = SCHEDULE_WINDOW_DAYS): string[] {
  return Array.from({ length: days }, (_, i) => addDays(startIso, i))
}

// ── Eszköz-státusz (SZÁMÍTOTT, backend AssetStatusCalculationService tükör) ──

export type AssetStatus = 'uzemel' | 'karbantartas' | 'geptores' | 'selejtezve'

/** Strukturális bemenetek — a service- és a mock-típusok is megfelelnek nekik. */
export interface AssetStatusAssetInput {
  id: string
  retired: boolean
}

export interface AssetStatusWorkOrderInput {
  assetId: string
  status: WorkOrderStatus
  /** Munkalap-típus kulcs — a 'javitas' (Corrective) jelenti a géptörést. */
  type: string
  requiresDowntime: boolean
}

export function calcAssetStatus(
  asset: AssetStatusAssetInput,
  workOrders: AssetStatusWorkOrderInput[],
): AssetStatus {
  // Selejtezett eszköz mindig selejtezve (a backend Retired-ága)
  if (asset.retired) return 'selejtezve'

  const inProgressWithDowntime = workOrders.filter(
    (wo) => wo.assetId === asset.id && wo.status === 'folyamatban' && wo.requiresDowntime,
  )
  if (inProgressWithDowntime.length === 0) return 'uzemel'

  // Folyamatban lévő korrektív (javítás) munka leállással → géptörés
  return inProgressWithDowntime.some((wo) => wo.type === 'javitas') ? 'geptores' : 'karbantartas'
}

// ── Megelőző terv esedékesség (PreventiveMaintenanceSchedulerService tükör) ──

export interface PlanDueInput {
  trigger: 'idokoz' | 'uzemora'
  intervalDays: number | null
  intervalHours: number | null
  lastDone: string | null
  lastDoneHours: number | null
}

/** Esedékes-e a terv MOST (szoros backend-tükör: soha-nem-végzett → azonnal). */
export function isPlanDue(plan: PlanDueInput, today: string, operatingHours: number): boolean {
  if (plan.trigger === 'idokoz') {
    if (plan.intervalDays === null) return false
    if (plan.lastDone === null) return true
    return diffDays(addDays(plan.lastDone, plan.intervalDays), today) >= 0
  }
  if (plan.intervalHours === null) return false
  if (plan.lastDoneHours === null) return true
  return operatingHours >= plan.lastDoneHours + plan.intervalHours
}

/** Esedékesség-kép a badge-ekhez: mennyi van hátra + a konfigurált „hamarosan" küszöb. */
export interface PlanDueInfo {
  /** 'nap' (idokoz) vagy 'uzemora' trigger szerinti mértékegység. */
  unit: 'nap' | 'uzemora'
  /** Esedékes ma vagy túllépve (backend isDue). */
  due: boolean
  /** Nem esedékes még, de a konfigurált küszöbön belül van. */
  dueSoon: boolean
  /** Hátralévő napok (idokoz) — negatív, ha lejárt. */
  daysLeft?: number
  /** Hátralévő üzemórák (uzemora) — negatív, ha túllépett. */
  hoursLeft?: number
}

export function planDueInfo(plan: PlanDueInput, today: string, operatingHours: number): PlanDueInfo {
  const due = isPlanDue(plan, today, operatingHours)
  if (plan.trigger === 'idokoz') {
    const daysLeft =
      plan.lastDone !== null && plan.intervalDays !== null
        ? diffDays(today, addDays(plan.lastDone, plan.intervalDays))
        : 0
    return { unit: 'nap', due, dueSoon: !due && daysLeft <= PLAN_DUE_SOON_DAYS, daysLeft }
  }
  const hoursLeft =
    plan.lastDoneHours !== null && plan.intervalHours !== null
      ? plan.lastDoneHours + plan.intervalHours - operatingHours
      : 0
  return { unit: 'uzemora', due, dueSoon: !due && hoursLeft <= PLAN_DUE_SOON_HOURS, hoursLeft }
}
