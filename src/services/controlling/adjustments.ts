import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { CONTROLLING_API_BASE } from './config'
import { controllingKeys } from './keys'
import { costCategorySchema } from './projects'

/**
 * Költség-korrekciók (utókalkuláció) — a backend CostAdjustment entitás tükre:
 * előjeles összeg, kötelező indok (audit trail), projekt- vagy portfólió-hatály,
 * soft-delete. A korrekció a kategória TÉNY-költségét módosítja, ezért minden
 * számított olvasatot érint → a mutációk a teljes modul-cache-t invalidálják
 * (README 6. szabály, ld. keys.ts).
 */

export const adjustmentScopeSchema = z.enum(['project', 'portfolio'])
export type AdjustmentScope = z.infer<typeof adjustmentScopeSchema>

export const costAdjustmentSchema = z.object({
  id: z.string(),
  /** Projekt-hatálynál kötelező, portfóliónál null (backend-invariáns). */
  projectId: z.string().nullable(),
  category: costCategorySchema,
  /** Előjeles összeg (negatív = jóváírás); nulla nem lehet. */
  amount: z.number(),
  scope: adjustmentScopeSchema,
  reason: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
})
export type CostAdjustment = z.infer<typeof costAdjustmentSchema>

export interface CreateAdjustmentPayload {
  projectId: string | null
  category: z.infer<typeof costCategorySchema>
  amount: number
  scope: AdjustmentScope
  reason: string
  createdBy: string
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type AdjustmentFilters = {
  projectId?: string
}

export function fetchAdjustments(filters: AdjustmentFilters = {}): Promise<CostAdjustment[]> {
  return apiFetch(`${CONTROLLING_API_BASE}/cost-adjustments`, {
    query: filters,
    schema: z.array(costAdjustmentSchema),
  })
}

export function createAdjustment(payload: CreateAdjustmentPayload): Promise<CostAdjustment> {
  return apiFetch(`${CONTROLLING_API_BASE}/cost-adjustments`, {
    method: 'POST',
    body: payload,
    schema: costAdjustmentSchema,
  })
}

export function deleteAdjustment(id: string): Promise<void> {
  return apiFetch(`${CONTROLLING_API_BASE}/cost-adjustments/${id}`, { method: 'DELETE' })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useAdjustments(filters: AdjustmentFilters = {}) {
  return useQuery({
    queryKey: controllingKeys.adjustments(filters),
    queryFn: () => fetchAdjustments(filters),
  })
}

/** A korrekció minden számított olvasatot érint → teljes modul-invalidálás. */
function useInvalidateControlling() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: controllingKeys.all })
}

export function useCreateAdjustment() {
  const invalidate = useInvalidateControlling()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: createAdjustment,
    onSuccess: (adjustment) => {
      addToast(`Korrekció rögzítve: ${adjustment.id}`, 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A korrekció rögzítése nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}

export function useDeleteAdjustment() {
  const invalidate = useInvalidateControlling()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: deleteAdjustment,
    onSuccess: () => {
      addToast('Korrekció törölve', 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A törlés nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}
