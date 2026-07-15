import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { EHS_API_BASE, EXPIRY_WINDOW_DAYS } from './config'
import { ehsKeys } from './keys'
import type { PpeIssuanceAction, PpeIssuanceStatus } from './fsm'

/**
 * EVE/PPE katalógus + kiadás FSM (openapi PpeItems / PpeIssuances tagek).
 * Kiadás-FSM: Issued(kiadva) → Acknowledged(átvett) → Returned(visszavett) | Replaced(cserélve).
 * Tiltott átmenetre a szerver 409-et ad — a hook toast-tal jelzi és újraszinkronizál.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const ppeCategorySchema = z.enum([
  'Head', 'Eye', 'Hearing', 'Respiratory', 'Hand', 'Foot', 'Body', 'Fall',
])
export type PpeCategory = z.infer<typeof ppeCategorySchema>

export const ppeItemSchema = z.object({
  ppeItemId: z.string(),
  tenantId: z.string(),
  name: z.string(),
  category: ppeCategorySchema,
  standardRef: z.string().nullable().optional(),
  defaultLifetimeMonths: z.number().int().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
})
export type PpeItem = z.infer<typeof ppeItemSchema>

export const ppeIssuanceStatusSchema = z.enum(['Issued', 'Acknowledged', 'Returned', 'Replaced'])

export const ppeIssuanceSchema = z.object({
  issuanceId: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  ppeItemId: z.string(),
  issuedAt: z.string(),
  issuedBy: z.string(),
  quantity: z.number().int(),
  expiresAt: z.string().nullable().optional(),
  status: ppeIssuanceStatusSchema,
  acknowledgedAt: z.string().nullable().optional(),
  returnedAt: z.string().nullable().optional(),
  replacedAt: z.string().nullable().optional(),
  replacementIssuanceId: z.string().nullable().optional(),
  isExpired: z.boolean(),
})
export type PpeIssuance = z.infer<typeof ppeIssuanceSchema>

export interface IssuePpePayload {
  employeeId: string
  ppeItemId: string
  issuedBy: string
  quantity: number
  expiresAt?: string | null
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchPpeItems(filters: { activeOnly?: boolean } = {}): Promise<PpeItem[]> {
  return apiFetch(`${EHS_API_BASE}/ppe-items`, { query: filters, schema: z.array(ppeItemSchema) })
}

export type PpeIssuanceFilters = {
  employeeId?: string
  status?: PpeIssuanceStatus
}

export function fetchPpeIssuances(filters: PpeIssuanceFilters = {}): Promise<PpeIssuance[]> {
  return apiFetch(`${EHS_API_BASE}/ppe-issuances`, {
    query: filters,
    schema: z.array(ppeIssuanceSchema),
  })
}

export function fetchExpiringPpe(withinDays: number = EXPIRY_WINDOW_DAYS): Promise<PpeIssuance[]> {
  return apiFetch(`${EHS_API_BASE}/ppe-issuances/expiring`, {
    query: { withinDays },
    schema: z.array(ppeIssuanceSchema),
  })
}

export function issuePpe(payload: IssuePpePayload): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/ppe-issuances`, { method: 'POST', body: payload })
}

/** FSM-átmenet végpontok; a replace új kiadást is létrehoz (201). */
export function transitionPpeIssuance(
  id: string,
  action: PpeIssuanceAction,
  payload?: { replacedBy: string; newExpiresAt?: string | null },
): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/ppe-issuances/${id}/${action}`, {
    method: 'POST',
    body: payload,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function usePpeItems(filters: { activeOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ehsKeys.ppeItems(filters),
    queryFn: () => fetchPpeItems(filters),
    staleTime: 5 * 60 * 1000, // katalógus-törzsadat
  })
}

export function usePpeIssuances(filters: PpeIssuanceFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.ppeIssuances(filters),
    queryFn: () => fetchPpeIssuances(filters),
  })
}

export function useExpiringPpe(withinDays: number = EXPIRY_WINDOW_DAYS) {
  return useQuery({
    queryKey: ehsKeys.expiringPpe(withinDays),
    queryFn: () => fetchExpiringPpe(withinDays),
  })
}

function useInvalidatePpe() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'ppe-issuances'] })
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'ppe-expiring'] })
  }
}

export function useIssuePpe() {
  const invalidate = useInvalidatePpe()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (payload: IssuePpePayload) => issuePpe(payload),
    onSuccess: () => {
      addToast('EVE kiadás rögzítve', 'success')
      invalidate()
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A kiadás rögzítése nem sikerült', 'error')
    },
  })
}

export interface PpeTransitionInput {
  id: string
  action: PpeIssuanceAction
  payload?: { replacedBy: string; newExpiresAt?: string | null }
}

export function usePpeTransition() {
  const invalidate = useInvalidatePpe()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, action, payload }: PpeTransitionInput) =>
      transitionPpeIssuance(id, action, payload),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },
    onSettled: () => invalidate(),
  })
}
