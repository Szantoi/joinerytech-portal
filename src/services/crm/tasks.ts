import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { CRM_API_BASE } from './config'
import { crmKeys } from './keys'

/**
 * CRM feladatok — SLA-figyelt teendők leadhez/lehetőséghez kötve.
 * Az SLA (ok/soon/overdue) SZÁMÍTOTT mező (./sla.ts), nem tárolt.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const taskPrioritySchema = z.enum(['magas', 'kozepes', 'alacsony'])
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const crmTaskSchema = z.object({
  id: z.string(),
  refType: z.enum(['lead', 'opp']),
  refId: z.string(),
  title: z.string(),
  priority: taskPrioritySchema,
  /** Határidő (YYYY-MM-DD) — ebből számítódik az SLA. */
  due: z.string(),
  done: z.boolean(),
  owner: z.string(),
})
export type CrmTask = z.infer<typeof crmTaskSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type TaskFilters = {
  done?: boolean
}

export function fetchTasks(filters: TaskFilters = {}): Promise<CrmTask[]> {
  return apiFetch(`${CRM_API_BASE}/tasks`, { query: filters, schema: z.array(crmTaskSchema) })
}

export function completeTask(id: string): Promise<CrmTask> {
  return apiFetch(`${CRM_API_BASE}/tasks/${id}/complete`, {
    method: 'POST',
    schema: crmTaskSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: crmKeys.tasks(filters),
    queryFn: () => fetchTasks(filters),
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      addToast('Feladat teljesítve', 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A teljesítés nem sikerült', 'error')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'tasks'] })
    },
  })
}
