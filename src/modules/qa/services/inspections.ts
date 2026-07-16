import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { QA_API_BASE } from './config'
import { qaKeys } from './keys'
import type { CriticalLevel } from './calc'
import { INSPECTION_FSM, type InspectionAction, type InspectionStatus } from './fsm'

/**
 * Átvizsgálások (Inspection) — lista, részlet és FSM-átmenetek
 * (start / complete-pass / complete-fail — a backend Inspection aggregátum
 * akció-tükre, `POST /api/qa/inspections/:id/...` a meglévő endpoint-útvonalakon).
 * Átmenet: optimista státusz-frissítés a detail cache-en, 409 (guard) esetén
 * rollback + hiba-toast, minden esetben invalidálás (a szerver az igazságforrás).
 *
 * Backend-gap: a végpontok 204-et adnak — a kontraktus itt a frissített
 * InspectionDto visszaadását rögzíti (Maintenance-precedens, follow-up).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const inspectionStatusSchema = z.enum([
  'nyitott', 'folyamatban', 'megfelelt', 'selejt',
]) satisfies z.ZodType<InspectionStatus>

/** Ellenőrzési pont típusa — a backend CheckpointType (Incoming/InProcess/Final) tükre. */
export const checkpointTypeSchema = z.enum(['beerkezo', 'gyartaskozi', 'vegso'])
export type CheckpointType = z.infer<typeof checkpointTypeSchema>

/** Kritikussági szint — a backend CriticalLevel (Critical/Major/Minor) tükre. */
export const criticalLevelSchema = z.enum([
  'kritikus', 'jelentos', 'enyhe',
]) satisfies z.ZodType<CriticalLevel>

/** Szempont-típus — a backend CriteriaType (Visual/Dimensional/Functional) tükre. */
export const criteriaTypeSchema = z.enum(['vizualis', 'meretes', 'funkcionalis'])
export type CriteriaType = z.infer<typeof criteriaTypeSchema>

/** Hibatípus — a backend FailureType enum (10 érték) kanonikus magyar kulcsai. */
export const failureTypeSchema = z.enum([
  'karc', 'hezag', 'illeszkedes', 'szin', 'meret',
  'felulet', 'funkcionalis', 'hianyzo', 'serules', 'egyeb',
])
export type FailureType = z.infer<typeof failureTypeSchema>

/** Ellenőrzési szempont — a backend InspectionCriteriaDto tükre. */
export const inspectionCriterionSchema = z.object({
  id: z.string(),
  type: criteriaTypeSchema,
  description: z.string(),
})
export type InspectionCriterion = z.infer<typeof inspectionCriterionSchema>

/** Hibajegyzet — a backend FailureNoteDto tükre. */
export const failureNoteSchema = z.object({
  failureType: failureTypeSchema,
  description: z.string(),
  photoUrl: z.string().nullable(),
})
export type FailureNote = z.infer<typeof failureNoteSchema>

export const inspectionSchema = z.object({
  id: z.string(),
  checkpointId: z.string(),
  /** Denormalizált ellenőrzésipont-adatok (a backend lista-DTO-ja is adja a nevet). */
  checkpointName: z.string(),
  checkpointType: checkpointTypeSchema,
  criticalLevel: criticalLevelSchema,
  /**
   * A pont ellenőrzési szempontjai (checklist) — MSW-FIRST denormalizáció:
   * a backend InspectionDto-ból hiányzik (a QACheckpointDto hordozza), a
   * detail-képernyő checklistje miatt a kontraktus ide is beemeli (gap).
   */
  criteria: z.array(inspectionCriterionSchema),
  orderRef: z.string().nullable(),
  productName: z.string().nullable(),
  status: inspectionStatusSchema,
  inspectorName: z.string(),
  notes: z.string().nullable(),
  failureNotes: z.array(failureNoteSchema),
  plannedAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  /** SZÁMÍTOTT (calc.isInspectionBlocking) — a szerver adja, a kliens nem számolja. */
  blocking: z.boolean(),
  /** SZÁMÍTOTT: kapcsolt nyitott hibajegyek száma (TICKET_OPEN_STATUSES guard). */
  openTickets: z.number(),
})
export type Inspection = z.infer<typeof inspectionSchema>

/** Hibajegyzet-bemenet a selejtezéshez (CompleteWithFail FailureNote-tükör). */
export interface FailureNoteInput {
  failureType: FailureType
  description: string
  photoUrl?: string | null
}

/** Az egyes FSM-akciók request-payloadjai (a backend request-DTO-k tükrei). */
export interface InspectionTransitionPayloads {
  start: Record<string, never>
  /** CompleteInspectionPassRequest: opcionális megjegyzés. */
  pass: { notes?: string }
  /** CompleteInspectionFailRequest: legalább 1 hibajegyzet kötelező. */
  fail: { failureNotes: FailureNoteInput[]; notes?: string }
}

/** Akció → backend endpoint-útvonal (InspectionEndpoints tükör). */
const INSPECTION_ACTION_PATHS: Record<InspectionAction, string> = {
  start: 'start',
  pass: 'complete/pass',
  fail: 'complete/fail',
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type InspectionFilters = {
  status?: InspectionStatus
  /** true → csak a nyitott (nyitott/folyamatban) átvizsgálások. */
  open?: boolean
  /** Szabad-szavas keresés (pont neve / rendelés / termék). */
  q?: string
}

export function fetchInspections(filters: InspectionFilters = {}): Promise<Inspection[]> {
  return apiFetch(`${QA_API_BASE}/inspections`, {
    query: filters,
    schema: z.array(inspectionSchema),
  })
}

export function fetchInspection(id: string): Promise<Inspection> {
  return apiFetch(`${QA_API_BASE}/inspections/${id}`, { schema: inspectionSchema })
}

/** FSM-akció = dedikált végpont (EHS README 2. szabály) — nincs generikus PATCH. */
export function transitionInspection<A extends InspectionAction>(
  id: string,
  action: A,
  payload: InspectionTransitionPayloads[A],
): Promise<Inspection> {
  return apiFetch(`${QA_API_BASE}/inspections/${id}/${INSPECTION_ACTION_PATHS[action]}`, {
    method: 'POST',
    body: payload,
    schema: inspectionSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useInspections(filters: InspectionFilters = {}) {
  return useQuery({
    queryKey: qaKeys.inspections(filters),
    queryFn: () => fetchInspections(filters),
  })
}

export function useInspection(id: string | null) {
  return useQuery({
    queryKey: qaKeys.inspection(id ?? ''),
    queryFn: () => fetchInspection(id!),
    enabled: id !== null,
  })
}

/**
 * Átvizsgálás-mutáció utáni invalidálás (EHS README 6. szabály):
 * 'inspections' lista-prefix + 'inspection' DETAIL-prefix (külön él!).
 * A hibajegy-cache-eket NEM érinti — az átvizsgálás-átmenet nem módosít
 * hibajegyet (a fordított irány, ld. tickets.ts, igen).
 */
function useInvalidateInspections() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'inspections'] })
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'inspection'] })
  }
}

export interface InspectionTransitionInput {
  id: string
  action: InspectionAction
  payload: InspectionTransitionPayloads[InspectionAction]
}

/**
 * Átvizsgálás FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: átvizsgálás-cache-ek invalidálása (a szerver az igazságforrás).
 */
export function useInspectionTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateInspections()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: InspectionTransitionInput) =>
      transitionInspection(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: qaKeys.inspection(id) })
      const previous = queryClient.getQueryData<Inspection>(qaKeys.inspection(id))
      if (previous) {
        queryClient.setQueryData<Inspection>(qaKeys.inspection(id), {
          ...previous,
          status: INSPECTION_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qaKeys.inspection(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (inspection) => {
      queryClient.setQueryData(qaKeys.inspection(inspection.id), inspection)
    },

    onSettled: () => invalidate(),
  })
}
