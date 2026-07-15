import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { useToast } from '../../components/ui'
import { MAINTENANCE_API_BASE } from './config'
import { maintenanceKeys } from './keys'
import { WORK_ORDER_FSM, type WorkOrderAction, type WorkOrderStatus } from './fsm'

/**
 * Munkalapok (WorkOrder) — lista, részlet, létrehozás, felelős-hozzárendelés
 * és FSM-átmenetek (schedule/start/complete/postpone/reject/reopen — a backend
 * WorkOrder aggregátum akció-tükre). Átmenet: optimista státusz-frissítés a
 * detail cache-en, 409 (guard) esetén rollback + hiba-toast, minden esetben
 * invalidálás (a szerver az igazságforrás).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const workOrderStatusSchema = z.enum([
  'bejelentve', 'utemezve', 'folyamatban', 'kesz', 'halasztva', 'elutasitva',
]) satisfies z.ZodType<WorkOrderStatus>

/** Munkalap-típus — a backend WorkOrderType (Corrective/Preventive/Cleaning) tükre. */
export const workOrderTypeSchema = z.enum(['javitas', 'megelozo', 'takaritas'])
export type WorkOrderType = z.infer<typeof workOrderTypeSchema>

/** Prioritás — a backend WorkOrderPriority tükre. */
export const workOrderPrioritySchema = z.enum(['kritikus', 'magas', 'kozepes', 'alacsony'])
export type WorkOrderPriority = z.infer<typeof workOrderPrioritySchema>

/** Hozzárendelés-típus — a backend AssignmentType (Internal/External) tükre. */
export const assignmentTypeSchema = z.enum(['belso', 'kulso'])
export type AssignmentType = z.infer<typeof assignmentTypeSchema>

export const workOrderLogEntrySchema = z.object({
  at: z.string(),
  text: z.string(),
})

export const workOrderSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  /** Denormalizált eszköz-adatok (a backend lista-DTO-ja is joinolva adná). */
  assetCode: z.string(),
  assetName: z.string(),
  type: workOrderTypeSchema,
  priority: workOrderPrioritySchema,
  status: workOrderStatusSchema,
  title: z.string(),
  description: z.string(),
  /** Leállással jár-e — a SZÁMÍTOTT eszköz-státusz (geptores/karbantartas) alapja. */
  requiresDowntime: z.boolean(),
  scheduledAt: z.string().nullable(),
  estimatedHours: z.number().nullable(),
  actualHours: z.number().nullable(),
  assignmentType: assignmentTypeSchema.nullable(),
  /** Denormalizált felelős-név (belső szerelő vagy külső partner). */
  assigneeName: z.string().nullable(),
  reportedAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  postponementReason: z.string().optional(),
  rejectionReason: z.string().optional(),
  log: z.array(workOrderLogEntrySchema),
})
export type WorkOrder = z.infer<typeof workOrderSchema>

/** Az egyes FSM-akciók request-payloadjai (a backend Command-ok tükrei). */
export interface WorkOrderTransitionPayloads {
  /** ScheduleWorkOrderCommand: dátum + becsült óraszám kötelező. */
  schedule: { scheduledAt: string; estimatedHours: number }
  start: Record<string, never>
  /** CompleteWorkOrderCommand: tényleges óraszám kötelező (> 0). */
  complete: { actualHours: number }
  /** PostponeWorkOrderCommand: kötelező indok. */
  postpone: { reason: string }
  /** RejectWorkOrderCommand: kötelező indok. */
  reject: { reason: string }
  reopen: Record<string, never>
}

/** AssignWorkOrderCommand tükör: belső szerelő vagy külső partner. */
export interface WorkOrderAssignInput {
  assignmentType: AssignmentType
  assigneeName: string
}

/** ReportWorkOrderCommand tükör (a státusz mindig bejelentve-ként indul). */
export interface WorkOrderCreateInput {
  assetId: string
  type: WorkOrderType
  priority: WorkOrderPriority
  title: string
  description: string
  requiresDowntime: boolean
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type WorkOrderFilters = {
  status?: WorkOrderStatus
  type?: WorkOrderType
  assetId?: string
  /** true → csak a nyitott (bejelentve/utemezve/folyamatban) munkalapok. */
  open?: boolean
}

export function fetchWorkOrders(filters: WorkOrderFilters = {}): Promise<WorkOrder[]> {
  return apiFetch(`${MAINTENANCE_API_BASE}/work-orders`, {
    query: filters,
    schema: z.array(workOrderSchema),
  })
}

export function fetchWorkOrder(id: string): Promise<WorkOrder> {
  return apiFetch(`${MAINTENANCE_API_BASE}/work-orders/${id}`, { schema: workOrderSchema })
}

export function createWorkOrder(input: WorkOrderCreateInput): Promise<WorkOrder> {
  return apiFetch(`${MAINTENANCE_API_BASE}/work-orders`, {
    method: 'POST',
    body: input,
    schema: workOrderSchema,
  })
}

/** FSM-akció = dedikált végpont (EHS README 2. szabály) — nincs generikus PATCH. */
export function transitionWorkOrder<A extends WorkOrderAction>(
  id: string,
  action: A,
  payload: WorkOrderTransitionPayloads[A],
): Promise<WorkOrder> {
  return apiFetch(`${MAINTENANCE_API_BASE}/work-orders/${id}/${action}`, {
    method: 'PUT',
    body: payload,
    schema: workOrderSchema,
  })
}

/** Felelős-hozzárendelés — státusz-guardolt akció, de NEM FSM-átmenet. */
export function assignWorkOrder(id: string, input: WorkOrderAssignInput): Promise<WorkOrder> {
  return apiFetch(`${MAINTENANCE_API_BASE}/work-orders/${id}/assign`, {
    method: 'PUT',
    body: input,
    schema: workOrderSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useWorkOrders(filters: WorkOrderFilters = {}) {
  return useQuery({
    queryKey: maintenanceKeys.workOrders(filters),
    queryFn: () => fetchWorkOrders(filters),
  })
}

export function useWorkOrder(id: string | null) {
  return useQuery({
    queryKey: maintenanceKeys.workOrder(id ?? ''),
    queryFn: () => fetchWorkOrder(id!),
    enabled: id !== null,
  })
}

/**
 * Munkalap-mutáció utáni invalidálás — a keresztkötéseket is (EHS README 6.):
 *  - 'workorders' lista-prefix + 'workorder' DETAIL-prefix (külön él!),
 *  - 'assets' + 'asset': az eszköz-státusz SZÁMÍTOTT a munkalapokból
 *    (start/complete leállásos munkán átbillenti), és a nyitott-számláló is
 *    munkalap-függő — az eszköz-cache-ek is újratöltendők.
 */
function useInvalidateWorkOrders() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'workorders'] })
    void queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'workorder'] })
    void queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'assets'] })
    void queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'asset'] })
  }
}

export interface WorkOrderTransitionInput {
  id: string
  action: WorkOrderAction
  payload: WorkOrderTransitionPayloads[WorkOrderAction]
}

/**
 * Munkalap FSM-átmenet mutáció, optimista frissítéssel:
 *  - onMutate: a detail cache státusza azonnal a célállapotra vált,
 *  - onError: rollback + hiba-toast (409-nél a szerver guard-üzenete),
 *  - onSettled: munkalap- + eszköz-cache-ek invalidálása (kereszt-invalidálás).
 */
export function useWorkOrderTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateWorkOrders()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: WorkOrderTransitionInput) =>
      transitionWorkOrder(id, action, payload),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.workOrder(id) })
      const previous = queryClient.getQueryData<WorkOrder>(maintenanceKeys.workOrder(id))
      if (previous) {
        queryClient.setQueryData<WorkOrder>(maintenanceKeys.workOrder(id), {
          ...previous,
          status: WORK_ORDER_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(maintenanceKeys.workOrder(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSuccess: (workOrder) => {
      queryClient.setQueryData(maintenanceKeys.workOrder(workOrder.id), workOrder)
    },

    onSettled: () => invalidate(),
  })
}

/** Felelős-hozzárendelés mutáció (nem FSM-átmenet — nincs optimista státusz-váltás). */
export function useWorkOrderAssign() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateWorkOrders()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkOrderAssignInput }) =>
      assignWorkOrder(id, input),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A hozzárendelés nem sikerült', 'error')
    },
    onSuccess: (workOrder) => {
      queryClient.setQueryData(maintenanceKeys.workOrder(workOrder.id), workOrder)
    },
    onSettled: () => invalidate(),
  })
}

/** Új munkalap (bejelentés) mutáció — rule-6 invalidálással. */
export function useCreateWorkOrder() {
  const invalidate = useInvalidateWorkOrders()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (input: WorkOrderCreateInput) => createWorkOrder(input),
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A munkalap létrehozása nem sikerült', 'error')
    },
    onSettled: () => invalidate(),
  })
}
