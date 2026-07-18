/**
 * Production szolgáltatás-konfiguráció — minden „állítható" érték itt él
 * (QUALITY.md 3.: nincs hardcodolt adat a képernyőkben/számításokban).
 *
 * API-gyökerek — a WORLDS_API_CONTRACTS_2026-07-18.md (1. cutting + 2. joinery)
 * VALÓS útvonalai, az nginx-proxy portál-prefixeivel (hooks/useApi API_BASE
 * konvenció: cutting → `/cutting`, joinery → `/joinery`).
 *
 * ⚠ P7 prefix-inkonzisztencia (kontraktus-doksi 1.1): a cutting szinte minden
 * végpontja a service-oldali `/api/cutting/...` prefixen él (stripelő proxy-
 * feltételezés → böngészőből `/cutting/api/cutting/...`), az assign-batch
 * viszont a `/cutting/api/plans/...` prefixen (NEM-stripelő feltételezés).
 * A kettő egyszerre nem lehet igaz a proxy mögött — a portál a MAI legacy
 * hívás-alakot tükrözi (böngésző-útvonal = a doksi assign-batch route-ja
 * szó szerint), az élesítés előtti tisztázás backend/infra follow-up.
 * Semmilyen út nem „szépíthető" (task-elv 2.).
 */

/** nginx-proxy prefix a cutting service-hez (5005). */
export const CUTTING_PROXY_BASE = '/cutting'
/** nginx-proxy prefix a joinery service-hez (5002). */
export const JOINERY_PROXY_BASE = '/joinery'

/** Cutting mag + planning + executions + quotes gyökér (doksi 1.1). */
export const CUTTING_API = `${CUTTING_PROXY_BASE}/api/cutting`
/**
 * Az assign-batch KEVERT prefixű route-gyökere (doksi 1.1 ⚠ jelölés):
 * `POST /cutting/api/plans/{date}/assign-batch` — szándékosan NEM a
 * CUTTING_API alatt él (P7 gap, ld. fejléc-komment).
 */
export const CUTTING_ASSIGN_BATCH_API = `${CUTTING_PROXY_BASE}/api/plans`

/** Joinery ajtórendelés-gyökér (doksi 2.1). */
export const JOINERY_ORDERS_API = `${JOINERY_PROXY_BASE}/api/orders`

// ── Kontraktus-adta korlátok (doksi 1.3: CreateCuttingPlanRequest) ──────────

/** Vágóterv-ablak alapértéke (planDays default). */
export const PLAN_DAYS_DEFAULT = 14
/** Vágóterv-ablak megengedett tartománya (7..90 — backend-validáció tükre). */
export const PLAN_DAYS_MIN = 7
export const PLAN_DAYS_MAX = 90
/** Tervezési stratégia alapértéke (CreateCuttingPlanRequest.strategyId default). */
export const PLAN_STRATEGY_DEFAULT = 'maxcut-v1'

/** Joinery rendelés-lista lapméret (GET /api/orders ?pageSize, 1..100). */
export const ORDERS_PAGE_SIZE = 20

/** Waste-riport ablaka napokban (GET /api/cutting/waste default: utolsó hónap). */
export const WASTE_WINDOW_DAYS = 30

/**
 * Kihasználtság (utilization) figyelmeztetési küszöbe (%) — a terv-részletek
 * napi sávjain: alatta warn-jelzés. UI-döntés, nem backend-érték.
 */
export const UTILIZATION_WARN_THRESHOLD = 60

/** Dashboard-listák sor-limitje (áttekintő csempék). */
export const DASH_LIST_LIMIT = 6

// ── Adat-mód (mock | api) ────────────────────────────────────────────────────
//
// WORLDS-PRODUCTION-API-GATE (follow-up task) fogja a production világat élő
// cutting+joinery hoston futtatni, MSW nélkül. Ez a flag ANNAK a kapuja:
// dev-default `mock` (MSW-tükör szolgálja ki); `api` módban a globális MSW
// worker el sem indul (src/main.tsx) — a production modul fetcherei a VALÓS
// hosztokat hívják. `WORLDS-CUTTING-AUTHFIX` (a cutting pricing-rules
// auth-hiánya + analytics tenantId-query gapje, kontraktus-doksi 5. szekció)
// ELŐFELTÉTELE az `api` módnak — amíg ez a task nincs elindítva/review-ready,
// a portál marad `mock`-ban (2026-07-18 állapot: a task még nem létezik,
// ld. a task-doksi gap-listája — follow-up: WORLDS-CUTTING-AUTHFIX létrehozása).
export type ProductionDataMode = 'mock' | 'api'

function readProductionDataMode(): ProductionDataMode {
  const raw = import.meta.env.VITE_DATA_MODE
  return raw === 'api' ? 'api' : 'mock'
}

export const PRODUCTION_DATA_MODE: ProductionDataMode = readProductionDataMode()
export const IS_PRODUCTION_API_MODE = PRODUCTION_DATA_MODE === 'api'
