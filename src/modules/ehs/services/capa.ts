import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { EHS_API_BASE } from './config'
import { ehsKeys } from './keys'

/**
 * Egységes CAPA-tábla (openapi CorrectiveActions tag) — az esemény-kivizsgálásból,
 * bejárás-megállapításból és kockázatértékelésből származó intézkedések EGY listában.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const capaSourceSchema = z.enum(['Incident', 'SafetyWalk', 'RiskAssessment'])
export type CapaSource = z.infer<typeof capaSourceSchema>

export const capaSchema = z.object({
  correctiveActionId: z.string(),
  tenantId: z.string(),
  source: capaSourceSchema,
  sourceId: z.string(),
  incidentId: z.string().nullable().optional(),
  findingId: z.string().nullable().optional(),
  description: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  completedAt: z.string().nullable().optional(),
  isCompleted: z.boolean(),
})
export type Capa = z.infer<typeof capaSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type CapaFilters = {
  completed?: boolean
  source?: CapaSource
  sourceId?: string
  assignedTo?: string
}

export function fetchCapas(filters: CapaFilters = {}): Promise<Capa[]> {
  return apiFetch(`${EHS_API_BASE}/corrective-actions`, {
    query: filters,
    schema: z.array(capaSchema),
  })
}

export function completeCapa(id: string): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/corrective-actions/${id}/complete`, { method: 'POST' })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useCapas(filters: CapaFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.capas(filters),
    queryFn: () => fetchCapas(filters),
  })
}

export function useCompleteCapa() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (id: string) => completeCapa(id),
    onSuccess: () => {
      addToast('Intézkedés teljesítve', 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A teljesítés nem sikerült', 'error')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'capas'] })
      // a bejárás close-guardja CAPA-állapotfüggő
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'walk'] })
      // unified-CAPA keresztkötés: esemény-CAPA teljesítése az incidens
      // correctiveActions listáját is érinti (lista + nyitott detail SlideOver)
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'incidents'] })
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'incident'] })
    },
  })
}
