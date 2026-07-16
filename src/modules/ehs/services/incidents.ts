import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { EHS_API_BASE } from './config'
import { ehsKeys } from './keys'
import { INCIDENT_FSM, type IncidentAction, type IncidentStatus } from './fsm'

/**
 * Balesetek/események — lista, részlet és FSM-átmenetek (openapi Incidents tag).
 * Átmenet: optimista státusz-frissítés a detail cache-en, 409 (guard) esetén
 * rollback + hiba-toast, minden esetben invalidálás (állapot-újraszinkron).
 */

// ── Sémák (openapi IncidentDto) ─────────────────────────────────────────────

export const incidentTypeSchema = z.enum(['Accident', 'NearMiss', 'HazardousCondition'])
export type IncidentType = z.infer<typeof incidentTypeSchema>

export const incidentStatusSchema = z.enum([
  'Reported', 'Investigated', 'CorrectiveActionPlanned', 'Closed', 'Reopened',
])

export const correctiveActionSchema = z.object({
  description: z.string(),
  responsiblePerson: z.string(),
  dueDate: z.string(),
  completedAt: z.string().nullable().optional(),
})
export type CorrectiveAction = z.infer<typeof correctiveActionSchema>

export const incidentSchema = z.object({
  incidentId: z.string(),
  tenantId: z.string(),
  incidentType: incidentTypeSchema,
  incidentDate: z.string(),
  location: z.string(),
  description: z.string(),
  severity: z.number().int().min(1).max(5),
  status: incidentStatusSchema,
  reportedBy: z.string(),
  reportedAt: z.string(),
  investigatedBy: z.string().nullable().optional(),
  investigatedAt: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  investigation: z.object({ findings: z.string(), rootCause: z.string() }).nullable().optional(),
  correctiveActions: z.array(correctiveActionSchema).optional(),
  witnesses: z.array(z.object({ employeeId: z.string(), statement: z.string() })).optional(),
})
export type Incident = z.infer<typeof incidentSchema>

export const pagedIncidentsSchema = z.object({
  items: z.array(incidentSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type PagedIncidents = z.infer<typeof pagedIncidentsSchema>

/** Az egyes FSM-akciók request-payloadjai (openapi *Command sémák). */
export interface IncidentTransitionPayloads {
  investigate: { investigatedBy: string }
  addCorrectiveAction: {
    description: string
    responsiblePerson: string
    dueDate: string
    findings?: string
    rootCause?: string
  }
  close: { closureNotes: string }
  reopen: { reopenReason: string }
}

/** Akció → URL szegmens (openapi path-ok). */
const TRANSITION_ROUTES: Record<IncidentAction, string> = {
  investigate: 'investigate',
  addCorrectiveAction: 'corrective-actions',
  close: 'close',
  reopen: 'reopen',
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type IncidentFilters = {
  status?: IncidentStatus
  type?: IncidentType
  page?: number
  pageSize?: number
}

export function fetchIncidents(filters: IncidentFilters = {}): Promise<PagedIncidents> {
  return apiFetch(`${EHS_API_BASE}/incidents`, { query: filters, schema: pagedIncidentsSchema })
}

export function fetchIncident(id: string): Promise<Incident> {
  return apiFetch(`${EHS_API_BASE}/incidents/${id}`, { schema: incidentSchema })
}

export function transitionIncident<A extends IncidentAction>(
  id: string,
  action: A,
  payload: IncidentTransitionPayloads[A],
): Promise<Incident> {
  return apiFetch(`${EHS_API_BASE}/incidents/${id}/${TRANSITION_ROUTES[action]}`, {
    method: 'PUT',
    body: payload,
    schema: incidentSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useIncidents(filters: IncidentFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.incidents(filters),
    queryFn: () => fetchIncidents(filters),
  })
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: ehsKeys.incident(id ?? ''),
    queryFn: () => fetchIncident(id!),
    enabled: id !== null,
  })
}

export interface IncidentTransitionInput {
  id: string
  action: IncidentAction
  payload: IncidentTransitionPayloads[IncidentAction]
}

/**
 * FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: incident cache-ek invalidálása (szerver az igazságforrás).
 */
export function useIncidentTransition() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: IncidentTransitionInput) =>
      transitionIncident(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: ehsKeys.incident(id) })
      const previous = queryClient.getQueryData<Incident>(ehsKeys.incident(id))
      if (previous) {
        queryClient.setQueryData<Incident>(ehsKeys.incident(id), {
          ...previous,
          status: INCIDENT_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(ehsKeys.incident(id), context.previous)
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (incident) => {
      queryClient.setQueryData(ehsKeys.incident(incident.incidentId), incident)
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'incidents'] })
      // a detail kulcs ('incident', egyes szám) NEM az 'incidents' prefix alatt él —
      // külön invalidálás kell, hogy 409-rollback után is a szerverrel szinkronizáljon
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'incident'] })
      // unified-CAPA keresztkötés: addCorrectiveAction új CAPA-t szül az egységes táblában
      void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'capas'] })
    },
  })
}
