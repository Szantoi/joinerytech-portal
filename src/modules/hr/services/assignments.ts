import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { HR_API_BASE } from './config'
import { hrKeys } from './keys'

/**
 * Beosztások — napi terhelést adó hozzárendelések (projekt/feladat/
 * karbantartás forrásból). Read-only a HR-oldalon: a beosztás a forrás-
 * modulban (Projektek stb.) keletkezik, itt a kapacitás-számítás bemenete.
 */

export const assignmentSchema = z.object({
  id: z.string(),
  empId: z.string(),
  projectId: z.string().nullable(),
  projectName: z.string(),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  hoursPerDay: z.number(),
  source: z.enum(['project', 'task', 'maintenance', 'other']),
})
export type Assignment = z.infer<typeof assignmentSchema>

export type AssignmentFilters = {
  empId?: string
}

export function fetchAssignments(filters: AssignmentFilters = {}): Promise<Assignment[]> {
  return apiFetch(`${HR_API_BASE}/assignments`, { query: filters, schema: z.array(assignmentSchema) })
}

export function useAssignments(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: hrKeys.assignments(filters),
    queryFn: () => fetchAssignments(filters),
  })
}
