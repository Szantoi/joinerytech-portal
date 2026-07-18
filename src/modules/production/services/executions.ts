import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { CUTTING_API } from './config'
import { productionKeys } from './keys'
import { EXECUTION_FSM } from './fsm'
import {
  CANCEL_REASON_WIRE, EXECUTION_STATUSES, MILESTONE_KINDS, MILESTONE_STATUSES,
  PROGRESS_EVENT_KIND_WIRE, PROOF_LEVEL_WIRE,
  type CancelReason, type ProgressEventKind, type ProofLevel,
} from './wire'

/**
 * Vágás-végrehajtás (CuttingExecution) — lista, részlet, esemény-idővonal és
 * FSM-akciók a doksi 1.1 executions-csoportján. Wire-sajátosságok:
 *  - válasz-státusz: angol string (6 állapot, wire.ts),
 *  - request-enumok SZÁMKÉNT mennek (ProgressEventKind/ProofLevel/CancelReason
 *    — a wire.ts szótárak fordítanak),
 *  - hibaszemantika: állapot-sértés → 409, payload-sértés → 422 (Invalid).
 * A start/progress a backend HMAC-mezőit is viszi (badge/esemény-aláírás) —
 * a portál űrlapról, a kontraktus-alak szerint.
 *
 * ⚠ A Schedule (új végrehajtás) NINCS bekötve: a payload sheetId/workerId/
 * enrollmentId Guid-okat vár, amelyekhez a portálnak ma nincs forrás-listája
 * (identity/enrollment végpont — P8 külső függőség). Gap + follow-up.
 */

const EXECUTIONS_API = `${CUTTING_API}/executions`

// ── Sémák ───────────────────────────────────────────────────────────────────

export const executionStatusSchema = z.enum(EXECUTION_STATUSES)

/** ExecutionDto Summary (GET /executions/ lista-alak — doksi 1.3). */
export const executionSummarySchema = z.object({
  id: z.string(),
  status: executionStatusSchema,
  scheduledAt: z.string(),
  panelsCompleted: z.number(),
  totalPanels: z.number(),
})
export type ExecutionSummary = z.infer<typeof executionSummarySchema>

/** ExecutionDto (GET /executions/{id} — doksi 1.3). */
export const executionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  sheetId: z.string(),
  status: executionStatusSchema,
  panelsCompleted: z.number(),
  totalPanels: z.number(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
})
export type Execution = z.infer<typeof executionSchema>

/** ProgressEventDto — a `kind` a válaszban STRING tagnév. */
export const progressEventSchema = z.object({
  eventId: z.string(),
  kind: z.enum(Object.keys(PROGRESS_EVENT_KIND_WIRE) as [ProgressEventKind, ...ProgressEventKind[]]),
  panelNumber: z.number().nullable(),
  occurredAt: z.string(),
})
export type ProgressEvent = z.infer<typeof progressEventSchema>

/** MilestoneDto — kind/status string tagnév. */
export const milestoneSchema = z.object({
  milestoneId: z.string(),
  kind: z.enum(MILESTONE_KINDS),
  status: z.enum(MILESTONE_STATUSES),
  reachedAt: z.string().nullable(),
})
export type Milestone = z.infer<typeof milestoneSchema>

// ── Request-alakok (doksi 1.3) ──────────────────────────────────────────────

/** StartExecutionRequest — badge-HMAC a gépkezelő azonosításához. */
export interface StartExecutionInput {
  workerId: string
  badgeHmacBase64: string
  hmacKeyVersion: string
}

/** RecordProgressRequest — a `kind` SZÁMKÉNT megy (wire.ts fordít). */
export interface RecordProgressInput {
  eventId: string
  kind: ProgressEventKind
  panel?: number
  occurredAt: string
  eventHmacBase64: string
  hmacKeyVersion: string
}

/** CompleteExecutionRequest — a `proofLevel` SZÁMKÉNT megy. */
export interface CompleteExecutionInput {
  proofLevel: ProofLevel
  proofHash: string
  signature?: string
  blobRef?: string
  encryptedWith?: string
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchExecutions(): Promise<ExecutionSummary[]> {
  return apiFetch(`${EXECUTIONS_API}/`, { schema: z.array(executionSummarySchema) })
}

export function fetchExecution(id: string): Promise<Execution> {
  return apiFetch(`${EXECUTIONS_API}/${id}`, { schema: executionSchema })
}

export function fetchExecutionProgress(id: string): Promise<ProgressEvent[]> {
  return apiFetch(`${EXECUTIONS_API}/${id}/progress`, { schema: z.array(progressEventSchema) })
}

export function fetchExecutionMilestones(id: string): Promise<Milestone[]> {
  return apiFetch(`${EXECUTIONS_API}/${id}/milestones`, { schema: z.array(milestoneSchema) })
}

export function startExecution(id: string, input: StartExecutionInput): Promise<void> {
  return apiFetch(`${EXECUTIONS_API}/${id}/start`, { method: 'POST', body: input })
}

export function recordProgress(id: string, input: RecordProgressInput): Promise<void> {
  return apiFetch(`${EXECUTIONS_API}/${id}/progress`, {
    method: 'POST',
    // enum → SZÁM a dróton (wire-szabály: request-oldali enum int ordinal)
    body: { ...input, kind: PROGRESS_EVENT_KIND_WIRE[input.kind] },
  })
}

export function completeExecution(id: string, input: CompleteExecutionInput): Promise<void> {
  return apiFetch(`${EXECUTIONS_API}/${id}/complete`, {
    method: 'POST',
    body: { ...input, proofLevel: PROOF_LEVEL_WIRE[input.proofLevel] },
  })
}

export function cancelExecution(id: string, reason: CancelReason): Promise<void> {
  return apiFetch(`${EXECUTIONS_API}/${id}/cancel`, {
    method: 'POST',
    body: { reason: CANCEL_REASON_WIRE[reason] },
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useExecutions() {
  return useQuery({ queryKey: productionKeys.executions(), queryFn: fetchExecutions })
}

export function useExecution(id: string | null) {
  return useQuery({
    queryKey: productionKeys.execution(id ?? ''),
    queryFn: () => fetchExecution(id!),
    enabled: id !== null,
  })
}

export function useExecutionProgress(id: string | null) {
  return useQuery({
    queryKey: productionKeys.executionProgress(id ?? ''),
    queryFn: () => fetchExecutionProgress(id!),
    enabled: id !== null,
  })
}

export function useExecutionMilestones(id: string | null) {
  return useQuery({
    queryKey: productionKeys.executionMilestones(id ?? ''),
    queryFn: () => fetchExecutionMilestones(id!),
    enabled: id !== null,
  })
}

/**
 * Végrehajtás-mutáció utáni invalidálás: lista + detail + esemény/mérföldkő
 * kulcsok (rule-6: a progress a milestone-okat is mozgathatja — backend
 * milestone-evaluate lánc).
 */
function useInvalidateExecutions() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: productionKeys.executions() })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'execution'] })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'executionProgress'] })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'executionMilestones'] })
  }
}

export type ExecutionMutationInput =
  | { id: string; action: 'start'; payload: StartExecutionInput }
  | { id: string; action: 'progress'; payload: RecordProgressInput }
  | { id: string; action: 'complete'; payload: CompleteExecutionInput }
  | { id: string; action: 'cancel'; payload: { reason: CancelReason } }

/**
 * Végrehajtás FSM-akció mutáció, optimista státusz-frissítéssel a detail
 * cache-en (409/422 → rollback + a szerver guard-üzenete toastban).
 * A végpontok üres 200-at adnak → siker után invalidálás hozza az új állapotot.
 */
export function useExecutionMutation() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateExecutions()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (input: ExecutionMutationInput) => {
      if (input.action === 'start') return startExecution(input.id, input.payload)
      if (input.action === 'progress') return recordProgress(input.id, input.payload)
      if (input.action === 'complete') return completeExecution(input.id, input.payload)
      return cancelExecution(input.id, input.payload.reason)
    },

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: productionKeys.execution(id) })
      const previous = queryClient.getQueryData<Execution>(productionKeys.execution(id))
      if (previous) {
        queryClient.setQueryData<Execution>(productionKeys.execution(id), {
          ...previous,
          status: EXECUTION_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productionKeys.execution(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'A művelet nem hajtható végre', 'error')
    },

    onSettled: () => invalidate(),
  })
}
