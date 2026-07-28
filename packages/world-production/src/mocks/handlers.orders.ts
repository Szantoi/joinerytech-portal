import { http, HttpResponse } from 'msw'
import { JOINERY_ORDERS_API } from '../services/config'
import { DOOR_ORDER_FSM, submitItemsBlockReason } from '../services/fsm'
import type { CuttingList, DoorOrder } from '../services/orders'
import { getProductionDb, guardJoineryFsm, isoTimestamp, joineryValidationError } from './db'

/**
 * Ajtórendelés (joinery /api/orders) handlerek — a doksi 2.1 tükre.
 * Hiba-szemantika a `DoorOrderEndpoints.cs` szerint: sértés → **400 + csupasz
 * `string[]`** (`Results.BadRequest(result.Errors)`), ismeretlen id → **404
 * ÜRES törzzsel** (`Results.NotFound()` — a UI ilyenkor a saját hibaágát mutatja,
 * nem a szerver üzenetét). A submit tétellista-guardja a
 * services/production/fsm.ts KÖZÖS függvénye.
 */

function findOrder(id: string | readonly string[]): DoorOrder | undefined {
  return getProductionDb().orders.find((o) => o.id === id)
}

function orderNotFound() {
  // A valós joinery 404-nek NINCS törzse — a mock sem találhat ki üzenetet.
  return new HttpResponse(null, { status: 404 })
}

/**
 * Egy AJTÓTÉTELBŐL keletkező alkatrész-sorok (a joinery `CalculateCuttingList`
 * tétel-bontásának tükre): egy ajtó lapból + keretlécekből + tokból áll.
 * Ezért a szabásjegyzék SORAINAK száma tudatosan több, mint az ajtótételek
 * száma (M-5: a `totalItemCount` = `order.Items.Count`, nem a sorszám).
 */
const COMPONENTS_PER_DOOR_ITEM = [
  { componentName: 'Ajtólap külső kéreg', material: 'MDF 6mm', componentType: 'Lap', thickness: 6, width: 860, length: 2080, quantity: 2 },
  { componentName: 'Keretléc függőleges', material: 'Fenyő 32mm', componentType: 'Léc', thickness: 32, width: 60, length: 2080, quantity: 2 },
  { componentName: 'Tok-szár', material: 'Tölgy 40mm', componentType: 'Tok', thickness: 40, width: 90, length: 2100, quantity: 2 },
] as const

/** Generált szabásjegyzék, ha a seedben nincs tárolt (kalkuláció-tükör). */
function buildCuttingList(order: DoorOrder): CuttingList {
  return {
    orderId: order.id,
    items: Array.from({ length: order.itemCount }, (_, i) =>
      COMPONENTS_PER_DOOR_ITEM.map((component) => ({ ...component, itemSorszam: String(i + 1) })),
    ).flat(),
    // A backend ezt `order.Items.Count`-ból adja — NEM az items.length-ből.
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

    // M-4: a valós lista-lekérdezésben NINCS OrderBy — a korábbi createdAt
    // szerinti rendezés olyan sorrendet mutatott, amit az éles API nem tud
    // reprodukálni (ráadásul a createdAt ott üres). A tükör a repository
    // sorrendjét adja vissza.
    const all = getProductionDb().orders
    const items = all.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({ items, totalCount: all.length, page, pageSize })
  }),

  http.get(`${JOINERY_ORDERS_API}/:id`, ({ params }) => {
    const order = findOrder(params.id as string)
    // M-4: a detail-route a backendben NEM a tárolt értéket adja vissza, hanem
    // a lekérés idejét (nem perzisztált mező) — a tükör ezt a „vándorló"
    // viselkedést mutatja, hogy a UI ne épülhessen rá.
    return order ? HttpResponse.json({ ...order, createdAt: isoTimestamp() }) : orderNotFound()
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
