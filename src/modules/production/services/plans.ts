import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { CUTTING_API, CUTTING_ASSIGN_BATCH_API } from './config'
import { productionKeys } from './keys'
import { CUTTING_PLAN_FSM, type CuttingPlanAction } from './fsm'
import { CUTTING_PLAN_STATUSES } from './wire'

/**
 * Vágótervek (CuttingPlan planning-aggregátum) — lista, részlet, létrehozás
 * és FSM-átmenetek (publish/freeze/close) a kontraktus-doksi 1.1 planning-
 * csoportjának VALÓS útvonalain. A státusz-enum wire-alakja: angol string
 * (wire.ts szótár). Tiltott átmenet a backendben: Result.Invalid → 400
 * (NEM 409 — a planning végpontok hibalistája 400/404).
 *
 * ⚠ A PUT /{planId} (Obsolete UpdateStatus, FSM-bypass) SZÁNDÉKOSAN nincs
 * bekötve — a doksi 1.5 tiltja portál-használatát.
 */

const PLANNING_API = `${CUTTING_API}/planning`

// ── Sémák (wire-tükör: CuttingPlanResponse.cs) ──────────────────────────────

export const cuttingPlanStatusSchema = z.enum(CUTTING_PLAN_STATUSES)

/** CuttingJobResponse — a napi terv ütemezett munkája. */
export const cuttingJobSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  scheduledDate: z.string(),
  priority: z.string(),
  estimatedTimeHours: z.number(),
  status: z.string(),
})
export type CuttingJob = z.infer<typeof cuttingJobSchema>

/** DailyPlanResponse — nap-szelet kapacitással és munkákkal. */
export const dailyPlanSchema = z.object({
  id: z.string(),
  date: z.string(),
  availableCapacity: z.number(),
  allocatedCapacity: z.number(),
  utilizationPercent: z.number(),
  jobs: z.array(cuttingJobSchema),
})
export type DailyPlan = z.infer<typeof dailyPlanSchema>

/** CuttingPlanSummaryResponse — lista-elem (GET /planning/). */
export const cuttingPlanSummarySchema = z.object({
  id: z.string(),
  planDate: z.string(),
  planDays: z.number(),
  status: cuttingPlanStatusSchema,
  strategyId: z.string(),
})
export type CuttingPlanSummary = z.infer<typeof cuttingPlanSummarySchema>

/** CuttingPlanResponse — részlet (GET /planning/{planId}). */
export const cuttingPlanSchema = cuttingPlanSummarySchema.extend({
  dailyPlans: z.array(dailyPlanSchema),
})
export type CuttingPlan = z.infer<typeof cuttingPlanSchema>

/** CreateCuttingPlanResponse — a portál a planId + hozam mezőket használja. */
export const createPlanResponseSchema = z.object({
  planId: z.string(),
  totalYieldPercent: z.number(),
})
export type CreatePlanResponse = z.infer<typeof createPlanResponseSchema>

/** Átmenet-válasz: `{planId, status}` (publish/freeze/close — doksi 1.1). */
export const planTransitionResponseSchema = z.object({
  planId: z.string(),
  status: cuttingPlanStatusSchema,
})

/** PriorityProfileResponse — a publish profileSnapshotId-forrása. */
export const priorityProfileSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable(),
  name: z.string(),
  isDefault: z.boolean(),
  capacityModelId: z.string(),
  reworkPolicyId: z.string(),
  planningStrategyId: z.string(),
})
export type PriorityProfile = z.infer<typeof priorityProfileSchema>

/** CreateCuttingPlanRequest (doksi 1.3): planDate + planDays (7..90) + strategyId. */
export interface CreatePlanInput {
  planDate: string
  planDays: number
  strategyId: string
}

/** AssignBatchRequest (doksi 1.3) — a kevert prefixű assign-batch payloadja. */
export interface AssignBatchInput {
  batchId: string
  machineId: string
  operatorId: string
  /** 1..10 (backend-validáció). */
  priority: number
  startTime: string
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchPlans(): Promise<CuttingPlanSummary[]> {
  return apiFetch(`${PLANNING_API}/`, { schema: z.array(cuttingPlanSummarySchema) })
}

export function fetchPlan(planId: string): Promise<CuttingPlan> {
  return apiFetch(`${PLANNING_API}/${planId}`, { schema: cuttingPlanSchema })
}

export function createPlan(input: CreatePlanInput): Promise<CreatePlanResponse> {
  return apiFetch(`${PLANNING_API}/`, {
    method: 'POST',
    body: input,
    schema: createPlanResponseSchema,
  })
}

/** FSM-akció = dedikált végpont; a publish payloadja `{profileSnapshotId}`. */
export function transitionPlan(
  planId: string,
  action: CuttingPlanAction,
  payload?: { profileSnapshotId: string },
): Promise<z.infer<typeof planTransitionResponseSchema>> {
  return apiFetch(`${PLANNING_API}/${planId}/${action}`, {
    method: 'POST',
    body: action === 'publish' ? payload : undefined,
    schema: planTransitionResponseSchema,
  })
}

/** Panel-foglalás (POST /{planId}/reserve-panels → {planId, reservedCount}). */
export function reservePanels(planId: string): Promise<{ planId: string; reservedCount: number }> {
  return apiFetch(`${PLANNING_API}/${planId}/reserve-panels`, {
    method: 'POST',
    schema: z.object({ planId: z.string(), reservedCount: z.number() }),
  })
}

export function fetchPriorityProfiles(): Promise<PriorityProfile[]> {
  return apiFetch(`${CUTTING_API}/priority-profiles/`, {
    schema: z.array(priorityProfileSchema),
  })
}

/**
 * Batch-hozzárendelés — ⚠ a KEVERT prefixű route-on (P7, config.ts fejléc):
 * `POST /cutting/api/plans/{date}/assign-batch` → `{executionId, status}`.
 * A UI ma nem tudja etetni (P2: a batch-read-model nem ad batchId-t — a
 * DailyCuttingPlanResponse.batches elemeinek NINCS id-ja), de a fetcher és
 * az MSW-tükör a valós kontraktust hordozza a follow-uphoz.
 */
export function assignBatch(
  date: string,
  input: AssignBatchInput,
): Promise<{ executionId: string; status: string }> {
  return apiFetch(`${CUTTING_ASSIGN_BATCH_API}/${date}/assign-batch`, {
    method: 'POST',
    body: input,
    schema: z.object({ executionId: z.string(), status: z.string() }),
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({ queryKey: productionKeys.plans(), queryFn: fetchPlans })
}

export function usePlan(planId: string | null) {
  return useQuery({
    queryKey: productionKeys.plan(planId ?? ''),
    queryFn: () => fetchPlan(planId!),
    enabled: planId !== null,
  })
}

export function usePriorityProfiles(enabled = true) {
  return useQuery({
    queryKey: productionKeys.priorityProfiles(),
    queryFn: fetchPriorityProfiles,
    enabled,
  })
}

/**
 * Terv-mutáció utáni invalidálás (EHS README 6. szabály): lista- ÉS detail-
 * prefix (külön élnek). A freeze kereszt-entitás hatását (offcut-batch
 * regisztráció az inventory-ban — doksi 1.5) a hívó jelzi `crossEntity`-vel:
 * a végrehajtás-cache-t is frissítjük, az inventory-kulcs pedig a warehouse
 * modul megszületésekor kerül ide (follow-up a task-doksiban).
 */
function useInvalidatePlans() {
  const queryClient = useQueryClient()
  return (crossEntity = false) => {
    void queryClient.invalidateQueries({ queryKey: productionKeys.plans() })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'plan'] })
    if (crossEntity) {
      void queryClient.invalidateQueries({ queryKey: productionKeys.executions() })
    }
  }
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: (res) => {
      addToast(`Vágóterv létrehozva — hozam: ${res.totalYieldPercent.toFixed(1)}%`, 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A terv létrehozása nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}

export interface PlanTransitionInput {
  planId: string
  action: CuttingPlanAction
  profileSnapshotId?: string
}

/**
 * Terv FSM-átmenet, optimista frissítéssel a detail cache-en (409 helyett a
 * backend itt 400-zal jelez FSM-sértést — a rollback+toast útja azonos).
 * Freeze esetén kereszt-entitás invalidálás (offcut-batch regisztráció indul).
 */
export function usePlanTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidatePlans()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ planId, action, profileSnapshotId }: PlanTransitionInput) =>
      transitionPlan(planId, action, profileSnapshotId ? { profileSnapshotId } : undefined),

    onMutate: async ({ planId, action }) => {
      await queryClient.cancelQueries({ queryKey: productionKeys.plan(planId) })
      const previous = queryClient.getQueryData<CuttingPlan>(productionKeys.plan(planId))
      if (previous) {
        queryClient.setQueryData<CuttingPlan>(productionKeys.plan(planId), {
          ...previous,
          status: CUTTING_PLAN_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { planId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productionKeys.plan(planId), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSettled: (_res, _err, { action }) => invalidate(action === 'freeze'),
  })
}

export function useReservePanels() {
  const invalidate = useInvalidatePlans()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (planId: string) => reservePanels(planId),
    onSuccess: (res) => addToast(`${res.reservedCount} panel lefoglalva a tervhez`, 'success'),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A panel-foglalás nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}
