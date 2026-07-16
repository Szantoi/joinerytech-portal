import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { EHS_API_BASE, EXPIRY_WINDOW_DAYS } from './config'
import { ehsKeys } from './keys'

/**
 * Veszélyes anyag / SDS törzs (openapi HazardousMaterials tag).
 * Az `sdsValidity` SZÁMÍTOTT mező (Valid >30 nap / Expiring ≤30 nap / Expired),
 * a szerver adja — a kliens csak megjeleníti (tone-térkép: pages/ehs/labels.ts).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const materialStatusSchema = z.enum(['Active', 'Archived'])
export type MaterialStatus = z.infer<typeof materialStatusSchema>

export const sdsValiditySchema = z.enum(['Valid', 'Expiring', 'Expired'])

export const hazardousMaterialListItemSchema = z.object({
  materialId: z.string(),
  name: z.string(),
  supplier: z.string(),
  storageLocationId: z.string(),
  quantityOnSite: z.number().optional(),
  unit: z.string().optional(),
  sdsExpiresAt: z.string(),
  status: materialStatusSchema,
  sdsValidity: sdsValiditySchema,
})
export type HazardousMaterialListItem = z.infer<typeof hazardousMaterialListItemSchema>

export const hazardousMaterialSchema = hazardousMaterialListItemSchema.extend({
  tenantId: z.string(),
  casNumber: z.string().nullable().optional(),
  ghsHazardClasses: z.array(z.string()).optional(),
  quantityOnSite: z.number(),
  unit: z.string(),
  sdsDocumentId: z.string().nullable().optional(),
  sdsIssuedAt: z.string(),
  registeredAt: z.string().optional(),
})
export type HazardousMaterial = z.infer<typeof hazardousMaterialSchema>

export interface RenewSdsPayload {
  newIssuedAt: string
  newExpiresAt: string
  newSdsDocumentId?: string | null
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type MaterialFilters = {
  status?: MaterialStatus
  validity?: z.infer<typeof sdsValiditySchema>
  locationId?: string
}

export function fetchHazardousMaterials(
  filters: MaterialFilters = {},
): Promise<HazardousMaterialListItem[]> {
  return apiFetch(`${EHS_API_BASE}/hazardous-materials`, {
    query: filters,
    schema: z.array(hazardousMaterialListItemSchema),
  })
}

export function fetchHazardousMaterial(id: string): Promise<HazardousMaterial> {
  return apiFetch(`${EHS_API_BASE}/hazardous-materials/${id}`, { schema: hazardousMaterialSchema })
}

export function fetchExpiringSds(
  withinDays: number = EXPIRY_WINDOW_DAYS,
): Promise<HazardousMaterialListItem[]> {
  return apiFetch(`${EHS_API_BASE}/hazardous-materials/expiring`, {
    query: { withinDays },
    schema: z.array(hazardousMaterialListItemSchema),
  })
}

export function renewSds(id: string, payload: RenewSdsPayload): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/hazardous-materials/${id}/renew-sds`, {
    method: 'POST',
    body: payload,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useHazardousMaterials(filters: MaterialFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.materials(filters),
    queryFn: () => fetchHazardousMaterials(filters),
  })
}

export function useHazardousMaterial(id: string | null) {
  return useQuery({
    queryKey: ehsKeys.material(id ?? ''),
    queryFn: () => fetchHazardousMaterial(id!),
    enabled: id !== null,
  })
}

export function useExpiringSds(withinDays: number = EXPIRY_WINDOW_DAYS) {
  return useQuery({
    queryKey: ehsKeys.expiringSds(withinDays),
    queryFn: () => fetchExpiringSds(withinDays),
  })
}

/** Új SDS-verzió rögzítése; siker → toast + anyag-cache invalidálás. */
export function useRenewSds() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RenewSdsPayload }) =>
      renewSds(id, payload),
    onSuccess: () => {
      addToast('SDS megújítva', 'success')
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'materials'] })
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'materials-expiring'] })
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'material'] })
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az SDS megújítása nem sikerült', 'error')
    },
  })
}
