import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { JOINERY_ORDERS_API, ORDERS_PAGE_SIZE } from './config'
import { productionKeys } from './keys'
import { DOOR_ORDER_FSM } from './fsm'
import { DOOR_ORDER_STATUSES } from './wire'

/**
 * Ajtórendelések (joinery DoorOrder) — lista (lapozott), részlet, szabásjegyzék
 * és a portálról hívható FSM-akciók (submit / revert / calculate) a doksi 2.1
 * `/api/orders` csoportján. Wire: a status STRING tagnév (DoorOrderStatus).
 *
 * Ismert DTO-gapek (doksi 2.3, P6): a `deliveryDate` ma mindig null, a
 * `createdAt` nem perzisztált (UtcNow) — a UI ezekre nem épít üzleti logikát.
 * Az InProduction/Completed/Cancelled elérhetetlen állapotok kezelése: fsm.ts.
 *
 * ⚠ Rendelés-felvétel (POST /api/orders) és tétel-felvétel (POST /{id}/items)
 * NINCS bekötve: a CreateDoorOrderRequest kötelező `flowEpicId` Guid-ja a
 * kernel flow-epic világából jön (P5 kernel-scope gap) — follow-up.
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const doorOrderStatusSchema = z.enum(DOOR_ORDER_STATUSES)

/** DoorOrderDto (doksi 2.3). */
export const doorOrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  flowEpicId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  status: doorOrderStatusSchema,
  itemCount: z.number(),
  deliveryDate: z.string().nullable(),
  createdAt: z.string(),
})
export type DoorOrder = z.infer<typeof doorOrderSchema>

/** PagedList<DoorOrderDto>. */
export const pagedOrdersSchema = z.object({
  items: z.array(doorOrderSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type PagedOrders = z.infer<typeof pagedOrdersSchema>

/** CuttingListResponse (doksi 2.3) — a kalkuláció eredménye is ez az alak. */
export const cuttingListSchema = z.object({
  orderId: z.string(),
  items: z.array(z.object({
    itemSorszam: z.string(),
    componentName: z.string(),
    material: z.string(),
    componentType: z.string(),
    thickness: z.number(),
    width: z.number(),
    length: z.number(),
    quantity: z.number(),
  })),
  totalItemCount: z.number(),
})
export type CuttingList = z.infer<typeof cuttingListSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export interface OrderFilters {
  page?: number
  pageSize?: number
}

export function fetchOrders(filters: OrderFilters = {}): Promise<PagedOrders> {
  return apiFetch(JOINERY_ORDERS_API, {
    query: { page: filters.page ?? 1, pageSize: filters.pageSize ?? ORDERS_PAGE_SIZE },
    schema: pagedOrdersSchema,
  })
}

export function fetchOrder(id: string): Promise<DoorOrder> {
  return apiFetch(`${JOINERY_ORDERS_API}/${id}`, { schema: doorOrderSchema })
}

export function fetchOrderCuttingList(id: string): Promise<CuttingList> {
  return apiFetch(`${JOINERY_ORDERS_API}/${id}/cutting-list`, { schema: cuttingListSchema })
}

/** Submit: Draft→Submitted (200 üres törzs; üres tétellista → 400). */
export function submitOrder(id: string): Promise<void> {
  return apiFetch(`${JOINERY_ORDERS_API}/${id}/submit`, { method: 'POST' })
}

/** Revert: CalculationFailed|Calculated→Draft (PUT, 200 üres törzs). */
export function revertOrder(id: string): Promise<void> {
  return apiFetch(`${JOINERY_ORDERS_API}/${id}/revert`, { method: 'PUT' })
}

/** Kalkuláció indítása — 200 CuttingListResponse (doksi 2.1). */
export function calculateOrder(id: string): Promise<CuttingList> {
  return apiFetch(`${JOINERY_ORDERS_API}/${id}/calculate`, {
    method: 'POST',
    schema: cuttingListSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: productionKeys.orders(filters as Record<string, number>),
    queryFn: () => fetchOrders(filters),
  })
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: productionKeys.order(id ?? ''),
    queryFn: () => fetchOrder(id!),
    enabled: id !== null,
  })
}

export function useOrderCuttingList(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: productionKeys.orderCuttingList(id ?? ''),
    queryFn: () => fetchOrderCuttingList(id!),
    enabled: id !== null && enabled,
  })
}

/**
 * Rendelés-mutáció utáni invalidálás: lista + detail + szabásjegyzék
 * (rule-6: a kalkuláció/revert a cutting-list cache-t is érinti).
 */
function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'orders'] })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'order'] })
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'orderCuttingList'] })
  }
}

export type OrderMutationInput =
  | { id: string; action: 'submit' }
  | { id: string; action: 'revert' }

/**
 * DoorOrder FSM-átmenet (submit/revert), optimista frissítéssel; tiltott
 * átmenet → 400 validációs tömb → rollback + toast. A calculate KÜLÖN hook
 * (nem FSM-átmenet a kliens felől — az állapotot az Orchestrator viszi).
 */
export function useOrderTransition() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOrders()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action }: OrderMutationInput) =>
      action === 'submit' ? submitOrder(id) : revertOrder(id),

    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: productionKeys.order(id) })
      const previous = queryClient.getQueryData<DoorOrder>(productionKeys.order(id))
      if (previous) {
        queryClient.setQueryData<DoorOrder>(productionKeys.order(id), {
          ...previous,
          status: DOOR_ORDER_FSM[action].to,
        })
      }
      return { previous }
    },

    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productionKeys.order(id), context.previous)
      }
      addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error')
    },

    onSettled: () => invalidate(),
  })
}

export function useCalculateOrder() {
  const invalidate = useInvalidateOrders()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: (id: string) => calculateOrder(id),
    onSuccess: (list) => {
      addToast(`Kalkuláció kész — ${list.totalItemCount} szabásjegyzék-tétel`, 'success')
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A kalkuláció nem indítható', 'error')
    },
    onSettled: () => invalidate(),
  })
}
