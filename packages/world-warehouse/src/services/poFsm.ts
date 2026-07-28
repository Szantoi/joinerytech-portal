import type { FsmRule } from '@spaceos/portal-core'
import type { PurchaseOrderStatus } from './config'

/**
 * PurchaseOrder FSM-tükör — a backend átmenet-tábla EGYETLEN kliens-oldali
 * igazságforrása (production fsm.ts minta).
 *
 * Backend-források:
 *  - `PurchaseOrder.cs` (aggregátum): Submit Draft→Submitted, Confirm
 *    Submitted→Confirmed, MarkShipped Confirmed→Shipped, RecordDelivery
 *    Shipped→Delivered, Cancel bárhonnan KIVÉVE Delivered/Cancelled.
 *  - `RecordDeliveryCommandHandler.cs`: a POST /orders/{id}/deliver végpont
 *    Confirmed állapotból IS enged szállítást (automatikus MarkShipped-áthidalás),
 *    ezért a `deliver` wire-igazsága: Confirmed VAGY Shipped → Delivered.
 *  - Tiltott átmenet: InvalidOperationException → Result.Conflict →
 *    `ResultToHttp.cs` → **409** (törzs: csupasz `string[]`).
 *
 * Ugyanezt a táblát futtatja a UI (gomb-láthatóság + disabledReason) és az
 * MSW db.ts átmenet-guardja (tiltott átmenet → 409) — egy igazságforrás.
 */
export const PO_FSM = {
  submit: { from: ['Draft'], to: 'Submitted' },
  confirm: { from: ['Submitted'], to: 'Confirmed' },
  ship: { from: ['Confirmed'], to: 'Shipped' },
  deliver: { from: ['Confirmed', 'Shipped'], to: 'Delivered' },
  cancel: { from: ['Draft', 'Submitted', 'Confirmed', 'Shipped'], to: 'Cancelled' },
} as const satisfies Record<string, FsmRule<PurchaseOrderStatus>>

export type PurchaseOrderAction = keyof typeof PO_FSM

/** A fő (sikeres) lánc — stepper/megjelenítés; Cancelled mellékállapot. */
export const PO_MAIN_PATH = [
  'Draft', 'Submitted', 'Confirmed', 'Shipped', 'Delivered',
] as const satisfies readonly PurchaseOrderStatus[]

/** Nem-terminális PO-státuszok — dashboard „aktív megrendelés" KPI guardja. */
export const PO_ACTIVE_STATUSES = [
  'Draft', 'Submitted', 'Confirmed', 'Shipped',
] as const satisfies readonly PurchaseOrderStatus[]

export function isPurchaseOrderActive(status: PurchaseOrderStatus): boolean {
  return (PO_ACTIVE_STATUSES as readonly PurchaseOrderStatus[]).includes(status)
}

/**
 * Deliver FSM-en TÚLI guardja — a backend `DeliverPurchaseOrderRequest`
 * kötelező `ReceivedQuantity` mezőjének tükre (pozitív mennyiség nélkül a
 * kérés 400). A UI (submit-tiltás) és az MSW (400) közös feltétele.
 */
export function deliverQuantityBlockReason(receivedQuantity: number): string | undefined {
  if (Number.isFinite(receivedQuantity) && receivedQuantity > 0) return undefined
  return 'A leszállítás rögzítéséhez pozitív átvett mennyiség (receivedQuantity) kötelező.'
}
