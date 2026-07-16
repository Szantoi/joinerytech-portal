import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { CRM_API_BASE } from './config'
import { crmKeys } from './keys'
import { OPP_FSM, type OppAction } from './fsm'
import { crmActivitySchema, type AddActivityPayload } from './activities'
import { crmSourceSchema } from './leads'

/**
 * Lehetőségek (Opportunity) — lista, részlet, FSM-átmenetek + ajánlat-csonk
 * létrehozás (oppCreateQuote handoff a Sales/ajánlat modul felé).
 */

// ── Sémák (MSW-first kontraktus — ld. src/mocks/crmApi) ─────────────────────

export const oppStatusSchema = z.enum([
  'nyitott', 'igenyfelmeres', 'osszeallitas', 'ajanlat', 'targyalas', 'megnyert', 'elveszett',
])

export const opportunitySchema = z.object({
  id: z.string(),
  status: oppStatusSchema,
  owner: z.string(),
  customer: z.string(),
  contact: z.string(),
  phone: z.string(),
  city: z.string(),
  title: z.string(),
  value: z.number(),
  source: crmSourceSchema,
  fromLead: z.string().nullable(),
  expectedClose: z.string(),
  isNewCustomer: z.boolean(),
  createdAt: z.string(),
  activities: z.array(crmActivitySchema),
  /** A kapcsolt ajánlat-csonk azonosítója (oppCreateQuote handoff). */
  quoteId: z.string().optional(),
  wonAt: z.string().optional(),
  lostReason: z.string().optional(),
  lostAt: z.string().optional(),
})
export type Opportunity = z.infer<typeof opportunitySchema>

/** Az egyes FSM-akciók request-payloadjai. */
export interface OppTransitionPayloads {
  startDiscovery: { note?: string }
  startProposal: { note?: string }
  sendQuote: { note?: string }
  negotiate: { note?: string }
  win: { note?: string }
  lose: { reason: string }
}

/** Akció → URL szegmens. */
const OPP_TRANSITION_ROUTES: Record<OppAction, string> = {
  startDiscovery: 'start-discovery',
  startProposal: 'start-proposal',
  sendQuote: 'send-quote',
  negotiate: 'negotiate',
  win: 'win',
  lose: 'lose',
}

/** Ajánlat-csonk létrehozás eredménye (a Sales modul draft ajánlata). */
export const createQuoteResultSchema = z.object({
  opportunity: opportunitySchema,
  quoteId: z.string(),
})
export type CreateQuoteResult = z.infer<typeof createQuoteResultSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type OppFilters = {
  status?: z.infer<typeof oppStatusSchema>
  /** true → csak a nyitott (nem terminális) fázisok. */
  open?: boolean
}

export function fetchOpps(filters: OppFilters = {}): Promise<Opportunity[]> {
  return apiFetch(`${CRM_API_BASE}/opportunities`, {
    query: filters,
    schema: z.array(opportunitySchema),
  })
}

export function fetchOpp(id: string): Promise<Opportunity> {
  return apiFetch(`${CRM_API_BASE}/opportunities/${id}`, { schema: opportunitySchema })
}

export function transitionOpp<A extends OppAction>(
  id: string,
  action: A,
  payload: OppTransitionPayloads[A],
): Promise<Opportunity> {
  return apiFetch(`${CRM_API_BASE}/opportunities/${id}/${OPP_TRANSITION_ROUTES[action]}`, {
    method: 'PUT',
    body: payload,
    schema: opportunitySchema,
  })
}

/** oppCreateQuote handoff: draft ajánlat-csonk a lehetőségből. */
export function createQuoteFromOpp(id: string): Promise<CreateQuoteResult> {
  return apiFetch(`${CRM_API_BASE}/opportunities/${id}/quote`, {
    method: 'POST',
    schema: createQuoteResultSchema,
  })
}

export function addOppActivity(id: string, payload: AddActivityPayload): Promise<Opportunity> {
  return apiFetch(`${CRM_API_BASE}/opportunities/${id}/activities`, {
    method: 'POST',
    body: payload,
    schema: opportunitySchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useOpps(filters: OppFilters = {}) {
  return useQuery({
    queryKey: crmKeys.opps(filters),
    queryFn: () => fetchOpps(filters),
  })
}

export function useOpp(id: string | null) {
  return useQuery({
    queryKey: crmKeys.opp(id ?? ''),
    queryFn: () => fetchOpp(id!),
    enabled: id !== null,
  })
}

function useInvalidateOpps() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opps'] })
    // a detail kulcs ('opp', egyes szám) NEM az 'opps' lista-prefix alatt él —
    // külön invalidálandó, hogy 409-rollback után is a szerverrel szinkronizáljon
    // (EHS README 6. szabály, minta: services/ehs/incidents.ts onSettled)
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'opp'] })
    void queryClient.invalidateQueries({ queryKey: [...crmKeys.all, 'activities-recent'] })
  }
}

export interface OppTransitionInput {
  id: string
  action: OppAction
  payload: OppTransitionPayloads[OppAction]
}

/**
 * Lehetőség FSM-átmenet mutáció, optimista frissítéssel (a lead-mintával
 * azonosan): onMutate cache-átírás → onError rollback + toast → onSettled
 * invalidálás. A kanban fázis-léptetés is ezt hívja.
 */
export function useOppTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOpps()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: OppTransitionInput) =>
      transitionOpp(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: crmKeys.opp(id) })
      const previous = queryClient.getQueryData<Opportunity>(crmKeys.opp(id))
      if (previous) {
        queryClient.setQueryData<Opportunity>(crmKeys.opp(id), {
          ...previous,
          status: OPP_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(crmKeys.opp(id), context.previous)
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (opp) => {
      queryClient.setQueryData(crmKeys.opp(opp.id), opp)
    },

    onSettled: () => invalidate(),
  })
}

/** Ajánlat-csonk létrehozás — siker: toast az új quoteId-val. */
export function useCreateQuoteFromOpp() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOpps()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => createQuoteFromOpp(id),
    onSuccess: (result) => {
      queryClient.setQueryData(crmKeys.opp(result.opportunity.id), result.opportunity)
      addToast(`Ajánlat-piszkozat létrehozva: ${result.quoteId}`, 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az ajánlat létrehozása nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}

export function useAddOppActivity() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOpps()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddActivityPayload }) =>
      addOppActivity(id, payload),
    onSuccess: (opp) => {
      queryClient.setQueryData(crmKeys.opp(opp.id), opp)
      addToast('Bejegyzés rögzítve', 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A rögzítés nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}
