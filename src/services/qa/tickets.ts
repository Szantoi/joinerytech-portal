import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { QA_API_BASE } from './config'
import { qaKeys } from './keys'
import {
  TICKET_FSM,
  type TicketAction, type TicketPriority, type TicketStatus,
} from './fsm'

/**
 * Hibajegyek (Ticket) — lista, részlet, létrehozás, FSM-átmenetek
 * (assign/start/resolve/reject/reopen — a backend Ticket aggregátum
 * akció-tükre) és prioritás-eszkaláció (guardolt, de NEM FSM-átmenet).
 *
 * Backend-gap: a Ticketnek NINCS REST végpontja (a Command/Query réteg kész) —
 * a teljes `/api/qa/tickets` útvonal-készlet MSW-FIRST kontraktus-előkép
 * (src/mocks/qaApi/handlers.tickets.ts), a Command-nevek tükrében.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const ticketStatusSchema = z.enum([
  'bejelentve', 'kiosztva', 'folyamatban', 'megoldva', 'elutasitva',
]) satisfies z.ZodType<TicketStatus>

/** Hibajegy-típus — a backend TicketType (Warranty/Repair/Missing) tükre. */
export const ticketTypeSchema = z.enum(['garancia', 'javitas', 'hiany'])
export type TicketType = z.infer<typeof ticketTypeSchema>

/** Prioritás (súlyosság) — a backend CrmTaskPriority tükre. */
export const ticketPrioritySchema = z.enum([
  'alacsony', 'kozepes', 'magas', 'kritikus',
]) satisfies z.ZodType<TicketPriority>

/** Intézkedés-típus — a backend ActionType (Repair/Replace/Refund/NoAction) tükre. */
export const actionTypeSchema = z.enum(['javitas', 'csere', 'visszaterites', 'nincs_intezkedes'])
export type ResolutionActionType = z.infer<typeof actionTypeSchema>

/** Intézkedés — a backend ResolutionActionDto tükre. */
export const resolutionActionSchema = z.object({
  actionType: actionTypeSchema,
  description: z.string(),
  /** Az intézkedés költsége (Ft) — a backend CostAmount tükre. */
  costAmount: z.number(),
})
export type ResolutionAction = z.infer<typeof resolutionActionSchema>

export const ticketSchema = z.object({
  id: z.string(),
  ticketType: ticketTypeSchema,
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  orderRef: z.string().nullable(),
  productName: z.string().nullable(),
  /** Kapcsolt átvizsgálás (TicketDto.InspectionId tükör) — a rule-6 keresztkötés alapja. */
  inspectionId: z.string().nullable(),
  /** Denormalizált ellenőrzésipont-név a kapcsolt átvizsgálásról. */
  inspectionRef: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  reportedBy: z.string(),
  assigneeName: z.string().nullable(),
  /**
   * Megoldási megjegyzés VAGY elutasítási indok — a backend a Reject(reason)
   * indokát is a ResolutionNotes mezőbe írja (Ticket aggregátum-tükör).
   */
  resolutionNotes: z.string().nullable(),
  resolutionActions: z.array(resolutionActionSchema),
  reportedAt: z.string(),
  assignedAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
})
export type Ticket = z.infer<typeof ticketSchema>

/** Intézkedés-bemenet a megoldáshoz (Resolve ResolutionAction-tükör). */
export interface ResolutionActionInput {
  actionType: ResolutionActionType
  description: string
  costAmount: number
}

/** Az egyes FSM-akciók request-payloadjai (a backend Command-ok tükrei). */
export interface TicketTransitionPayloads {
  /** AssignTicketCommand: felelős kötelező. */
  assign: { assigneeName: string }
  start: Record<string, never>
  /** ResolveTicketCommand: legalább 1 intézkedés kötelező. */
  resolve: { resolutionActions: ResolutionActionInput[]; resolutionNotes?: string }
  /** RejectTicketCommand: kötelező indok (a resolutionNotes-ba kerül). */
  reject: { reason: string }
  reopen: Record<string, never>
}

/** CreateTicketCommand tükör (a státusz mindig bejelentve-ként indul). */
export interface TicketCreateInput {
  ticketType: TicketType
  priority: TicketPriority
  title: string
  description: string
  /** Kapcsolt átvizsgálás — selejt-átvizsgálásból nyitott hibajegynél. */
  inspectionId?: string
  orderRef?: string | null
  productName?: string | null
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type TicketFilters = {
  status?: TicketStatus
  priority?: TicketPriority
  inspectionId?: string
  /** true → csak a nyitott (bejelentve/kiosztva/folyamatban) hibajegyek. */
  open?: boolean
  q?: string
}

export function fetchTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  return apiFetch(`${QA_API_BASE}/tickets`, {
    query: filters,
    schema: z.array(ticketSchema),
  })
}

export function fetchTicket(id: string): Promise<Ticket> {
  return apiFetch(`${QA_API_BASE}/tickets/${id}`, { schema: ticketSchema })
}

export function createTicket(input: TicketCreateInput): Promise<Ticket> {
  return apiFetch(`${QA_API_BASE}/tickets`, {
    method: 'POST',
    body: input,
    schema: ticketSchema,
  })
}

/** FSM-akció = dedikált végpont (EHS README 2. szabály) — nincs generikus PATCH. */
export function transitionTicket<A extends TicketAction>(
  id: string,
  action: A,
  payload: TicketTransitionPayloads[A],
): Promise<Ticket> {
  return apiFetch(`${QA_API_BASE}/tickets/${id}/${action}`, {
    method: 'PUT',
    body: payload,
    schema: ticketSchema,
  })
}

/** Prioritás-eszkaláció — státusz- és rang-guardolt akció, de NEM FSM-átmenet. */
export function escalateTicket(id: string, priority: TicketPriority): Promise<Ticket> {
  return apiFetch(`${QA_API_BASE}/tickets/${id}/escalate`, {
    method: 'PUT',
    body: { priority },
    schema: ticketSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: qaKeys.tickets(filters),
    queryFn: () => fetchTickets(filters),
  })
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: qaKeys.ticket(id ?? ''),
    queryFn: () => fetchTicket(id!),
    enabled: id !== null,
  })
}

/**
 * Hibajegy-mutáció utáni invalidálás — a keresztkötéseket is (EHS README 6.):
 *  - 'tickets' lista-prefix + 'ticket' DETAIL-prefix (külön él!),
 *  - 'inspections' + 'inspection': az átvizsgálás `openTickets` mezője a
 *    kapcsolt hibajegyekből SZÁMÍTOTT (létrehozás/megoldás/újranyitás
 *    átbillenti) — az átvizsgálás-cache-ek is újratöltendők.
 */
function useInvalidateTickets() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'tickets'] })
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'ticket'] })
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'inspections'] })
    void queryClient.invalidateQueries({ queryKey: [...qaKeys.all, 'inspection'] })
  }
}

export interface TicketTransitionInput {
  id: string
  action: TicketAction
  payload: TicketTransitionPayloads[TicketAction]
}

/**
 * Hibajegy FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: hibajegy- + átvizsgálás-cache-ek invalidálása (kereszt-invalidálás).
 */
export function useTicketTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTickets()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: TicketTransitionInput) =>
      transitionTicket(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: qaKeys.ticket(id) })
      const previous = queryClient.getQueryData<Ticket>(qaKeys.ticket(id))
      if (previous) {
        queryClient.setQueryData<Ticket>(qaKeys.ticket(id), {
          ...previous,
          status: TICKET_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qaKeys.ticket(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (ticket) => {
      queryClient.setQueryData(qaKeys.ticket(ticket.id), ticket)
    },

    onSettled: () => invalidate(),
  })
}

/** Prioritás-eszkaláció mutáció (nem FSM-átmenet — nincs optimista státusz-váltás). */
export function useTicketEscalate() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTickets()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: TicketPriority }) =>
      escalateTicket(id, priority),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Az eszkaláció nem sikerült', 'error')
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(qaKeys.ticket(ticket.id), ticket)
    },
    onSettled: () => invalidate(),
  })
}

/** Új hibajegy (CreateTicketCommand-tükör) mutáció — rule-6 kereszt-invalidálással. */
export function useCreateTicket() {
  const invalidate = useInvalidateTickets()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (input: TicketCreateInput) => createTicket(input),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A hibajegy létrehozása nem sikerült', 'error')
    },
    onSuccess: () => {
      addToast('Hibajegy létrehozva', 'success')
    },
    onSettled: () => invalidate(),
  })
}
