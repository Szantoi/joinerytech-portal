import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { HR_API_BASE } from './config'
import { hrKeys } from './keys'
import { ABSENCE_FSM, type AbsenceAction, type AbsenceStatus } from './fsm'

/**
 * Távollétek — lista, részlet, FSM-átmenetek (approve/reject/start/complete/
 * reopen — a backend Absence aggregátum akció-tükre). Átmenet: optimista
 * státusz-frissítés a detail cache-en, 409 (guard) esetén rollback +
 * hiba-toast, minden esetben invalidálás (a szerver az igazságforrás).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const absenceStatusSchema = z.enum([
  'kert', 'jovahagyva', 'folyamatban', 'lezarva', 'elutasitva',
]) satisfies z.ZodType<AbsenceStatus>

export const absenceTypeSchema = z.enum(['szabadsag', 'betegseg', 'fizetes_nelkuli', 'egyeb'])
export type AbsenceType = z.infer<typeof absenceTypeSchema>

export const absenceLogEntrySchema = z.object({
  at: z.string(),
  text: z.string(),
})

export const absenceSchema = z.object({
  id: z.string(),
  empId: z.string(),
  /** Denormalizált dolgozó-név (a backend listázó DTO-ja is joinolva adná). */
  empName: z.string(),
  type: absenceTypeSchema,
  start: z.string(),
  end: z.string(),
  status: absenceStatusSchema,
  requestedAt: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  reason: z.string(),
  /** Érintett munkanapok száma. */
  days: z.number(),
  rejectReason: z.string().optional(),
  log: z.array(absenceLogEntrySchema),
})
export type Absence = z.infer<typeof absenceSchema>

/** Az egyes FSM-akciók request-payloadjai (reject: kötelező indok). */
export interface AbsenceTransitionPayloads {
  approve: Record<string, never>
  reject: { reason: string }
  start: Record<string, never>
  complete: Record<string, never>
  reopen: Record<string, never>
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type AbsenceFilters = {
  status?: AbsenceStatus
  empId?: string
}

export function fetchAbsences(filters: AbsenceFilters = {}): Promise<Absence[]> {
  return apiFetch(`${HR_API_BASE}/absences`, { query: filters, schema: z.array(absenceSchema) })
}

export function fetchAbsence(id: string): Promise<Absence> {
  return apiFetch(`${HR_API_BASE}/absences/${id}`, { schema: absenceSchema })
}

/** FSM-akció = dedikált végpont (EHS README 2. szabály) — nincs generikus PATCH. */
export function transitionAbsence<A extends AbsenceAction>(
  id: string,
  action: A,
  payload: AbsenceTransitionPayloads[A],
): Promise<Absence> {
  return apiFetch(`${HR_API_BASE}/absences/${id}/${action}`, {
    method: 'PUT',
    body: payload,
    schema: absenceSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useAbsences(filters: AbsenceFilters = {}) {
  return useQuery({
    queryKey: hrKeys.absences(filters),
    queryFn: () => fetchAbsences(filters),
  })
}

export function useAbsence(id: string | null) {
  return useQuery({
    queryKey: hrKeys.absence(id ?? ''),
    queryFn: () => fetchAbsence(id!),
    enabled: id !== null,
  })
}

/**
 * Távollét-mutáció utáni invalidálás — a keresztkötéseket is (EHS README 6.):
 *  - 'absences' lista-prefix + 'absence' DETAIL-prefix (külön él!),
 *  - 'capacity': a blokkoló státuszba lépő távollét kiveszi a napokat a
 *    kapacitás-rácsból — a számított rács is újratöltendő.
 */
function useInvalidateAbsences() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...hrKeys.all, 'absences'] })
    void queryClient.invalidateQueries({ queryKey: [...hrKeys.all, 'absence'] })
    void queryClient.invalidateQueries({ queryKey: [...hrKeys.all, 'capacity'] })
  }
}

export interface AbsenceTransitionInput {
  id: string
  action: AbsenceAction
  payload: AbsenceTransitionPayloads[AbsenceAction]
}

/**
 * Távollét FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: távollét- + kapacitás-cache-ek invalidálása.
 */
export function useAbsenceTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateAbsences()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: AbsenceTransitionInput) =>
      transitionAbsence(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: hrKeys.absence(id) })
      const previous = queryClient.getQueryData<Absence>(hrKeys.absence(id))
      if (previous) {
        queryClient.setQueryData<Absence>(hrKeys.absence(id), {
          ...previous,
          status: ABSENCE_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(hrKeys.absence(id), context.previous)
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (absence) => {
      queryClient.setQueryData(hrKeys.absence(absence.id), absence)
    },

    onSettled: () => invalidate(),
  })
}
