import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { HR_API_BASE } from './config'
import { hrKeys } from './keys'

/**
 * Munkaóra-napló — rögzített órák listája + továbbítás a Kontrolling felé.
 *
 * A továbbítás STUB: a valós integráció a Kontrolling munka (Labor)
 * tény-költségét növelné (óra × órabér), ezért éles bekötéskor a mutációnak
 * a `controllingKeys.all` prefixet IS invalidálnia kell (kereszt-modul
 * invalidálás, EHS README 6. szabály) — most csak a HR timelog-cache frissül
 * és toast jelzi az átadást.
 */

export const timeLogSchema = z.object({
  id: z.string(),
  empId: z.string(),
  empName: z.string(),
  projectId: z.string().nullable(),
  projectName: z.string(),
  day: z.string(),
  hours: z.number(),
  note: z.string().optional(),
  /** A Kontrolling felé történt átadás időbélyege; null = még nem átadott. */
  pushedAt: z.string().nullable(),
})
export type TimeLog = z.infer<typeof timeLogSchema>

/** Nevesített guard: átadható-e még a tétel (UI gomb + MSW 409 közös feltétele). */
export function isTimeLogPushable(log: TimeLog): boolean {
  return log.pushedAt === null
}

export type TimeLogFilters = {
  empId?: string
}

export function fetchTimeLogs(filters: TimeLogFilters = {}): Promise<TimeLog[]> {
  return apiFetch(`${HR_API_BASE}/timelogs`, { query: filters, schema: z.array(timeLogSchema) })
}

export const pushTimeLogsResultSchema = z.object({
  /** Az ezzel a hívással átadott tételek száma. */
  pushed: z.number(),
})
export type PushTimeLogsResult = z.infer<typeof pushTimeLogsResultSchema>

/** Az összes (opcionálisan egy dolgozóra szűrt) még nem átadott tétel átadása. */
export function pushTimeLogsToControlling(empId?: string): Promise<PushTimeLogsResult> {
  return apiFetch(`${HR_API_BASE}/timelogs/push`, {
    method: 'POST',
    body: empId !== undefined ? { empId } : {},
    schema: pushTimeLogsResultSchema,
  })
}

export function useTimeLogs(filters: TimeLogFilters = {}) {
  return useQuery({
    queryKey: hrKeys.timeLogs(filters),
    queryFn: () => fetchTimeLogs(filters),
  })
}

/** Kontrolling-átadás (stub) — siker/hiba visszajelzés a hookban (toast). */
export function usePushTimeLogs() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (empId?: string) => pushTimeLogsToControlling(empId),
    onSuccess: (result) => {
      addToast(`${result.pushed} munkaóra-tétel átadva a Kontrolling felé (stub)`, 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az átadás nem sikerült', 'error')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...hrKeys.all, 'timelogs'] })
      // TODO(integráció): éles Kontrolling-bekötéskor ide jön a
      // controllingKeys.all invalidálás is (a munka-kategória tényköltsége nő).
    },
  })
}
