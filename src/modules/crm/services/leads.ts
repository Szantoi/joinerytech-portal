import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { CRM_API_BASE } from './config'
import { crmKeys } from './keys'
import { LEAD_FSM, type LeadAction } from './fsm'
import { crmActivitySchema, type AddActivityPayload } from './activities'

/**
 * Leadek — lista, részlet, FSM-átmenetek + konvertálás lehetőséggé.
 * Átmenet: optimista státusz-frissítés a detail cache-en, 409 (guard) esetén
 * rollback + hiba-toast, minden esetben invalidálás (a szerver az igazságforrás).
 */

// ── Sémák (MSW-first kontraktus — ld. src/mocks/crmApi) ─────────────────────

export const leadStatusSchema = z.enum([
  'uj', 'kapcsolat', 'minosites', 'nurturing', 'konvertalva', 'elvetve',
])

export const crmSourceSchema = z.enum([
  'telefon', 'ajanlas', 'email', 'kiallitas', 'weboldal', 'webshop', 'belsoepitesz',
])
export type CrmSource = z.infer<typeof crmSourceSchema>

export const leadSchema = z.object({
  id: z.string(),
  status: leadStatusSchema,
  source: crmSourceSchema,
  owner: z.string(),
  company: z.string(),
  contact: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string(),
  title: z.string(),
  interest: z.string(),
  estValue: z.number(),
  createdAt: z.string(),
  activities: z.array(crmActivitySchema),
  referredBy: z.string().optional(),
  /** A konvertáláskor létrejött lehetőség azonosítója. */
  oppId: z.string().optional(),
  lostReason: z.string().optional(),
})
export type Lead = z.infer<typeof leadSchema>

/** Az egyes FSM-akciók request-payloadjai. */
export interface LeadTransitionPayloads {
  contact: { note?: string }
  qualify: { note?: string }
  nurture: { note?: string }
  discard: { reason: string }
}

/** Csak az egyszerű (nem konvertáló) átmenetek — a convert dedikált végpont. */
export type SimpleLeadAction = Exclude<LeadAction, 'convert'>

/** Akció → URL szegmens. */
const LEAD_TRANSITION_ROUTES: Record<SimpleLeadAction, string> = {
  contact: 'contact',
  qualify: 'qualify',
  nurture: 'nurture',
  discard: 'discard',
}

/** A konvertálás eredménye: frissült lead + létrejött lehetőség-csonk. */
export const convertLeadResultSchema = z.object({
  lead: leadSchema,
  opportunityId: z.string(),
})
export type ConvertLeadResult = z.infer<typeof convertLeadResultSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type LeadFilters = {
  status?: z.infer<typeof leadStatusSchema>
  /** Szabad szavas keresés (kontakt / cég / cím). */
  q?: string
}

export function fetchLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  return apiFetch(`${CRM_API_BASE}/leads`, { query: filters, schema: z.array(leadSchema) })
}

export function fetchLead(id: string): Promise<Lead> {
  return apiFetch(`${CRM_API_BASE}/leads/${id}`, { schema: leadSchema })
}

export function transitionLead<A extends SimpleLeadAction>(
  id: string,
  action: A,
  payload: LeadTransitionPayloads[A],
): Promise<Lead> {
  return apiFetch(`${CRM_API_BASE}/leads/${id}/${LEAD_TRANSITION_ROUTES[action]}`, {
    method: 'PUT',
    body: payload,
    schema: leadSchema,
  })
}

/** convertLeadToOpp handoff: minősített/nurturing lead → lehetőség-csonk. */
export function convertLeadToOpp(id: string): Promise<ConvertLeadResult> {
  return apiFetch(`${CRM_API_BASE}/leads/${id}/convert`, {
    method: 'POST',
    schema: convertLeadResultSchema,
  })
}

export function addLeadActivity(id: string, payload: AddActivityPayload): Promise<Lead> {
  return apiFetch(`${CRM_API_BASE}/leads/${id}/activities`, {
    method: 'POST',
    body: payload,
    schema: leadSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: crmKeys.leads(filters),
    queryFn: () => fetchLeads(filters),
  })
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: crmKeys.lead(id ?? ''),
    queryFn: () => fetchLead(id!),
    enabled: id !== null,
  })
}

function useInvalidateLeads() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'leads'] })
    // a detail kulcs ('lead', egyes szám) NEM a 'leads' lista-prefix alatt él —
    // külön invalidálandó, hogy 409-rollback után is a szerverrel szinkronizáljon
    // (EHS README 6. szabály, minta: services/ehs/incidents.ts onSettled)
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'lead'] })
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'activities-recent'] })
  }
}

export interface LeadTransitionInput {
  id: string
  action: SimpleLeadAction
  payload: LeadTransitionPayloads[SimpleLeadAction]
}

/**
 * Lead FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: lead cache-ek invalidálása.
 */
export function useLeadTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateLeads()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: LeadTransitionInput) =>
      transitionLead(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: crmKeys.lead(id) })
      const previous = queryClient.getQueryData<Lead>(crmKeys.lead(id))
      if (previous) {
        queryClient.setQueryData<Lead>(crmKeys.lead(id), {
          ...previous,
          status: LEAD_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(crmKeys.lead(id), context.previous)
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (lead) => {
      queryClient.setQueryData(crmKeys.lead(lead.id), lead)
    },

    onSettled: () => invalidate(),
  })
}

/** Konvertálás lehetőséggé — sikerkor a lehetőség-listát is invalidálja. */
export function useConvertLead() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateLeads()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => convertLeadToOpp(id),
    onSuccess: (result) => {
      queryClient.setQueryData(crmKeys.lead(result.lead.id), result.lead)
      addToast(`Lehetőség létrehozva: ${result.opportunityId}`, 'success')
      void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opps'] })
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A konvertálás nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}

export function useAddLeadActivity() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateLeads()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddActivityPayload }) =>
      addLeadActivity(id, payload),
    onSuccess: (lead) => {
      queryClient.setQueryData(crmKeys.lead(lead.id), lead)
      addToast('Bejegyzés rögzítve', 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A rögzítés nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}
