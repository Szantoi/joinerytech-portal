import { http, HttpResponse } from 'msw';
import { warehouseMockDb, isMockError } from './db';

/**
 * Procurement handlerek (ProcurementEndpoints.cs tükör, WORLDS-PROC-PO-FSM).
 * Minden átmenet-végpont sikeres átmenet után a FRISS OrderStatusResponse-t
 * adja vissza; tiltott átmenet → 409 (Result.Conflict → ResultToHttp),
 * a törzs — a backendhez híven — csupasz string[].
 */

const BODYLESS_ACTIONS = ['submit', 'confirm', 'ship', 'cancel'] as const;
type BodylessAction = (typeof BODYLESS_ACTIONS)[number];

function mockErrorResponse(res: { status: number; message: string }) {
  // Ardalis Result hibaágak (NotFound/Conflict/BadRequest): string[] a törzs.
  return HttpResponse.json([res.message], { status: res.status });
}

export const procurementHandlers = [
  // GET /api/procurement/suppliers
  http.get('/api/procurement/suppliers', () => {
    return HttpResponse.json(warehouseMockDb.getSuppliers());
  }),

  // GET /api/procurement/orders
  http.get('/api/procurement/orders', () => {
    return HttpResponse.json(warehouseMockDb.getPurchaseOrders());
  }),

  // POST /api/procurement/orders
  http.post('/api/procurement/orders', async ({ request }) => {
    const body = (await request.json()) as {
      supplierId?: string; materialType?: string; quantity?: number;
      unitPrice?: number; currency?: string; expectedDeliveryDate?: string;
    } | null;
    const created = warehouseMockDb.createPurchaseOrder(body ?? {});
    if (isMockError(created)) {
      return mockErrorResponse(created);
    }
    return HttpResponse.json({ id: created.id }, { status: 200 });
  }),

  // GET /api/procurement/orders/:id — OrderStatusResponse
  http.get('/api/procurement/orders/:id', ({ params }) => {
    const detail = warehouseMockDb.getPurchaseOrderDetail(params.id as string);
    if (!detail) {
      return HttpResponse.json([`Purchase order ${params.id as string} not found.`], { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  // POST /api/procurement/orders/:id/deliver — KÖTELEZŐ DeliverPurchaseOrderRequest
  // törzs (receivedQuantity!) — hiányzó/hibás body → 400, NEM 200.
  http.post('/api/procurement/orders/:id/deliver', async ({ params, request }) => {
    interface DeliverBody { receivedQuantity?: unknown; notes?: string; recordedBy?: string }
    let body: DeliverBody | null;
    try {
      body = (await request.json()) as DeliverBody | null;
    } catch {
      // hiányzó/nem-JSON törzs → ugyanaz a 400-as ág, mint a hibás mennyiség
      body = null;
    }
    const receivedQuantity = body?.receivedQuantity;
    if (typeof receivedQuantity !== 'number' || !Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
      return HttpResponse.json(
        ['DeliverPurchaseOrderRequest: pozitív receivedQuantity kötelező.'],
        { status: 400 },
      );
    }
    const res = warehouseMockDb.transitionPurchaseOrder(params.id as string, 'deliver', { receivedQuantity });
    if (isMockError(res)) {
      return mockErrorResponse(res);
    }
    return HttpResponse.json(res, { status: 200 });
  }),

  // POST /api/procurement/orders/:id/:action — submit/confirm/ship/cancel
  http.post('/api/procurement/orders/:id/:action', ({ params }) => {
    const action = params.action as string;
    if (!(BODYLESS_ACTIONS as readonly string[]).includes(action)) {
      // Ismeretlen útvonal a backendben: 404.
      return HttpResponse.json([`Unknown transition: ${action}.`], { status: 404 });
    }
    const res = warehouseMockDb.transitionPurchaseOrder(params.id as string, action as BodylessAction);
    if (isMockError(res)) {
      return mockErrorResponse(res);
    }
    return HttpResponse.json(res, { status: 200 });
  }),

  // GET /api/procurement/requisitions/
  http.get('/api/procurement/requisitions/', () => {
    return HttpResponse.json(warehouseMockDb.getRequisitions());
  }),
];
