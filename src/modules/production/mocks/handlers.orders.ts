import { http, HttpResponse } from 'msw'
import { JOINERY_ORDERS_API } from '../services/config'
import { DOOR_ORDER_FSM, submitItemsBlockReason } from '../services/fsm'
import type { CuttingList, DoorOrder } from '../services/orders'
import { getProductionDb, guardJoineryFsm, joineryValidationError } from './db'

/**
 * Ajtórendelés (joinery /api/orders) handlerek — a doksi 2.1 tükre.
 * Hiba-szemantika: sértés → **400 validációs tömb** ([{identifier,
 * errorMessage}] — joinery-konvenció), ismeretlen id → 404. A submit
 * tétellista-guardja a services/production/fsm.ts KÖZÖS függvénye.
 */

function findOrder(id: string | readonly string[]): DoorOrder | undefined {
  return getProductionDb().orders.find((o) => o.id === id)
}

function orderNotFound() {
  return HttpResponse.json([{ identifier: 'id', errorMessage: 'A rendelés nem található' }], { status: 404 })
}

/** Generált szabásjegyzék, ha a seedben nincs tárolt (kalkuláció-tükör). */
function buildCuttingList(order: DoorOrder): CuttingList {
  return {
    orderId: order.id,
    items: Array.from({ length: order.itemCount }, (_, i) => ({
      itemSorszam: String(i + 1),
      componentName: 'Ajtólap külső kéreg',
      material: 'MDF 6mm',
      componentType: 'Lap',
      thickness: 6, width: 860, length: 2080, quantity: 2,
    })),
    totalItemCount: order.itemCount,
  }
}

export const orderHandlers = [
  // GET /api/orders?page=&pageSize= — PagedList<DoorOrderDto>
  http.get(JOINERY_ORDERS_API, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20')
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return joineryValidationError('paging', 'page ≥ 1 és pageSize 1..100 kötelező.')
    }

    const all = [...getProductionDb().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const items = all.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({ items, totalCount: all.length, page, pageSize })
  }),

  http.get(`${JOINERY_ORDERS_API}/:id`, ({ params }) => {
    const order = findOrder(params.id as string)
    return order ? HttpResponse.json(order) : orderNotFound()
  }),

  http.get(`${JOINERY_ORDERS_API}/:id/cutting-list`, ({ params }) => {
    const order = findOrder(params.id as string)
    if (!order) return orderNotFound()
    const list = getProductionDb().cuttingLists[order.id]
    return list ? HttpResponse.json(list) : orderNotFound()
  }),

  // Kalkuláció — 200 CuttingListResponse; üres tétellista → 400
  http.post(`${JOINERY_ORDERS_API}/:id/calculate`, ({ params }) => {
    const order = findOrder(params.id as string)
    if (!order) return orderNotFound()
    if (order.itemCount === 0) {
      return joineryValidationError('items', 'Üres tétellistára nem futtatható kalkuláció.')
    }
    const db = getProductionDb()
    const list = db.cuttingLists[order.id] ?? buildCuttingList(order)
    db.cuttingLists[order.id] = list
    return HttpResponse.json(list)
  }),

  // Submit: Draft→Submitted — üres tétellista → 400 (közös guard)
  http.post(`${JOINERY_ORDERS_API}/:id/submit`, ({ params }) => {
    const order = findOrder(params.id as string)
    if (!order) return orderNotFound()
    const guard = guardJoineryFsm(DOOR_ORDER_FSM, 'submit', order.status)
    if (guard) return guard
    const itemsBlock = submitItemsBlockReason(order.itemCount)
    if (itemsBlock) return joineryValidationError('items', itemsBlock)

    order.status = DOOR_ORDER_FSM.submit.to
    return HttpResponse.json({})
  }),

  // Revert: CalculationFailed|Calculated→Draft
  http.put(`${JOINERY_ORDERS_API}/:id/revert`, ({ params }) => {
    const order = findOrder(params.id as string)
    if (!order) return orderNotFound()
    const guard = guardJoineryFsm(DOOR_ORDER_FSM, 'revert', order.status)
    if (guard) return guard

    order.status = DOOR_ORDER_FSM.revert.to
    return HttpResponse.json({})
  }),
]
