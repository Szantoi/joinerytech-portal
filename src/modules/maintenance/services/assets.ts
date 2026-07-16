import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { MAINTENANCE_API_BASE } from './config'
import { maintenanceKeys } from './keys'
import type { AssetStatus } from './calc'

/**
 * Eszközök (Asset) — lista + részlet. A backend `AssetEndpoints` tükre
 * (`GET /api/maintenance/assets`, `GET /api/maintenance/assets/:id`).
 *
 * Az eszköz-státusz SZÁMÍTOTT, sosem tárolt (backend
 * `AssetStatusCalculationService`): a szerver (MSW: services/maintenance/calc)
 * adja a válaszban — a kliens SOSEM számolja újra. Ezért a munkalap-mutációk
 * az asset-kulcsokat is invalidálják (ld. workOrders.ts kereszt-invalidálás).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

/** SZÁMÍTOTT eszköz-státusz — a calc.ts AssetStatus zod-tükre. */
export const assetStatusSchema = z.enum([
  'uzemel', 'karbantartas', 'geptores', 'selejtezve',
]) satisfies z.ZodType<AssetStatus>

/** Eszköz-kategória — a backend AssetKind enum kanonikus magyar kulcsai. */
export const assetKindSchema = z.enum([
  'gep', 'jarmu', 'szerszam', 'infrastruktura', 'it', 'helyiseg',
])
export type AssetKind = z.infer<typeof assetKindSchema>

/** Megelőző terv — a backend MaintenancePlan value object tükre. */
export const maintenancePlanSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** idokoz = Interval (nap-alapú), uzemora = OperatingHours trigger. */
  trigger: z.enum(['idokoz', 'uzemora']),
  intervalDays: z.number().nullable(),
  intervalHours: z.number().nullable(),
  estimatedHours: z.number(),
  lastDone: z.string().nullable(),
  lastDoneHours: z.number().nullable(),
  /** Denormalizált felelős-név (belső szerelő vagy külső partner). */
  assigneeName: z.string().nullable(),
})
export type MaintenancePlan = z.infer<typeof maintenancePlanSchema>

export const assetSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  kind: assetKindSchema,
  location: z.string(),
  vendor: z.string().nullable(),
  model: z.string().nullable(),
  /** Üzemóra-számláló (gép/jármű) — az uzemora-trigger tervek alapja. */
  operatingHours: z.number(),
  retired: z.boolean(),
  /** SZÁMÍTOTT státusz — a szerver adja (calc.ts), a kliens nem számolja újra. */
  status: assetStatusSchema,
  /** SZÁMÍTOTT: nyitott munkalapok száma (WORK_ORDER_OPEN_STATUSES guard). */
  openWorkOrders: z.number(),
  /** SZÁMÍTOTT: esedékes vagy hamarosan esedékes megelőző tervek száma. */
  duePlans: z.number(),
  plans: z.array(maintenancePlanSchema),
})
export type Asset = z.infer<typeof assetSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type AssetFilters = {
  kind?: AssetKind
  q?: string
}

export function fetchAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  return apiFetch(`${MAINTENANCE_API_BASE}/assets`, {
    query: filters,
    schema: z.array(assetSchema),
  })
}

export function fetchAsset(id: string): Promise<Asset> {
  return apiFetch(`${MAINTENANCE_API_BASE}/assets/${id}`, { schema: assetSchema })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: maintenanceKeys.assets(filters),
    queryFn: () => fetchAssets(filters),
  })
}

export function useAsset(id: string | null) {
  return useQuery({
    queryKey: maintenanceKeys.asset(id ?? ''),
    queryFn: () => fetchAsset(id!),
    enabled: id !== null,
  })
}
