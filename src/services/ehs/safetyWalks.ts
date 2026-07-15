import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { EHS_API_BASE } from './config'
import { ehsKeys } from './keys'
import type { SafetyWalkAction, SafetyWalkStatus } from './fsm'

/**
 * Munkavédelmi bejárások (openapi SafetyWalks tag).
 * FSM: Scheduled → InProgress → ActionRequired → Closed (+Cancelled).
 * Megállapítás csak InProgress alatt rögzíthető; requiresAction + felelős +
 * határidő megadásával a szerver egységes CAPA-t is létrehoz (unified CAPA).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const safetyWalkStatusSchema = z.enum([
  'Scheduled', 'InProgress', 'ActionRequired', 'Closed', 'Cancelled',
])

export const findingSeveritySchema = z.enum([
  'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic',
])
export type FindingSeverity = z.infer<typeof findingSeveritySchema>

export const walkFindingSchema = z.object({
  findingId: z.string(),
  description: z.string(),
  severity: findingSeveritySchema,
  photoS3Key: z.string().nullable().optional(),
  requiresAction: z.boolean(),
  correctiveActionId: z.string().nullable().optional(),
  linkedRiskAssessmentId: z.string().nullable().optional(),
  recordedAt: z.string(),
})
export type WalkFinding = z.infer<typeof walkFindingSchema>

export const safetyWalkListItemSchema = z.object({
  safetyWalkId: z.string(),
  locationId: z.string(),
  scheduledDate: z.string(),
  conductedBy: z.string(),
  status: safetyWalkStatusSchema,
  findingCount: z.number().int(),
})
export type SafetyWalkListItem = z.infer<typeof safetyWalkListItemSchema>

export const safetyWalkSchema = z.object({
  safetyWalkId: z.string(),
  tenantId: z.string(),
  locationId: z.string(),
  scheduledDate: z.string(),
  conductedBy: z.string(),
  participants: z.array(z.string()).optional(),
  status: safetyWalkStatusSchema,
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  findings: z.array(walkFindingSchema),
})
export type SafetyWalk = z.infer<typeof safetyWalkSchema>

export const addFindingResultSchema = z.object({
  findingId: z.string(),
  correctiveActionId: z.string().nullable().optional(),
})

export interface ScheduleWalkPayload {
  locationId: string
  scheduledDate: string
  conductedBy: string
  participants?: string[]
}

export interface AddFindingPayload {
  description: string
  severity: FindingSeverity
  requiresAction: boolean
  capaDescription?: string | null
  capaAssignedTo?: string | null
  capaDueDate?: string | null
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type WalkFilters = {
  status?: SafetyWalkStatus
  locationId?: string
}

export function fetchSafetyWalks(filters: WalkFilters = {}): Promise<SafetyWalkListItem[]> {
  return apiFetch(`${EHS_API_BASE}/safety-walks`, {
    query: filters,
    schema: z.array(safetyWalkListItemSchema),
  })
}

export function fetchSafetyWalk(id: string): Promise<SafetyWalk> {
  return apiFetch(`${EHS_API_BASE}/safety-walks/${id}`, { schema: safetyWalkSchema })
}

export function scheduleSafetyWalk(payload: ScheduleWalkPayload): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/safety-walks`, { method: 'POST', body: payload })
}

export function transitionSafetyWalk(id: string, action: SafetyWalkAction): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/safety-walks/${id}/${action}`, { method: 'POST' })
}

export function addWalkFinding(id: string, payload: AddFindingPayload) {
  return apiFetch(`${EHS_API_BASE}/safety-walks/${id}/findings`, {
    method: 'POST',
    body: payload,
    schema: addFindingResultSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useSafetyWalks(filters: WalkFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.walks(filters),
    queryFn: () => fetchSafetyWalks(filters),
  })
}

export function useSafetyWalk(id: string | null) {
  return useQuery({
    queryKey: ehsKeys.walk(id ?? ''),
    queryFn: () => fetchSafetyWalk(id!),
    enabled: id !== null,
  })
}

function useInvalidateWalks() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'walks'] })
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'walk'] })
    // a megállapításból CAPA is születhet, ill. close-guard függ tőle
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'capas'] })
  }
}

export function useScheduleWalk() {
  const invalidate = useInvalidateWalks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (payload: ScheduleWalkPayload) => scheduleSafetyWalk(payload),
    onSuccess: () => {
      addToast('Bejárás ütemezve', 'success')
      invalidate()
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az ütemezés nem sikerült', 'error')
    },
  })
}

export function useWalkTransition() {
  const invalidate = useInvalidateWalks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: SafetyWalkAction }) =>
      transitionSafetyWalk(id, action),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },
    onSettled: () => invalidate(),
  })
}

export function useAddWalkFinding() {
  const invalidate = useInvalidateWalks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddFindingPayload }) =>
      addWalkFinding(id, payload),
    onSuccess: (result) => {
      addToast(
        result.correctiveActionId
          ? 'Megállapítás rögzítve, CAPA létrehozva'
          : 'Megállapítás rögzítve',
        'success',
      )
      invalidate()
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A megállapítás rögzítése nem sikerült', 'error')
    },
  })
}
