import { http, HttpResponse } from 'msw';
import { WAREHOUSE_CONFIG } from '../services/config';
import { warehouseMockDb, isMockError } from './db';

/**
 * Offcut handlerek (OffcutEndpoints.cs tükör). Hibakódok: 404 (ismeretlen
 * offcut/foglalás), 409 (nem-Available reserve / nem-Reserved use — Conflict),
 * 410 (lejárt foglalás jóváhagyása), 400 (hiányzó/hibás jobId).
 */

export const offcutHandlers = [
  // GET /api/inventory/offcuts/stats/summary
  http.get('/api/inventory/offcuts/stats/summary', () => {
    const summary = warehouseMockDb.getOffcutStatsSummary();
    return HttpResponse.json(summary);
  }),

  // GET /api/inventory/offcuts/
  http.get('/api/inventory/offcuts/', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const materialCode = url.searchParams.get('materialCode') || undefined;
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const page: number = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize: number = pageSizeParam ? parseInt(pageSizeParam, 10) : WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE;

    if (!Number.isInteger(page) || page < 1) {
      return HttpResponse.json({ error: 'page must be >= 1.' }, { status: 400 });
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > WAREHOUSE_CONFIG.MAX_PAGE_SIZE) {
      return HttpResponse.json({ error: `pageSize must be between 1 and ${WAREHOUSE_CONFIG.MAX_PAGE_SIZE}.` }, { status: 400 });
    }

    const result = warehouseMockDb.getOffcutsList(status, materialCode, page, pageSize);
    return HttpResponse.json(result);
  }),

  // GET /api/inventory/offcuts/{offcutId}
  http.get('/api/inventory/offcuts/:offcutId', ({ params }) => {
    const offcutId = params.offcutId as string;
    const item = warehouseMockDb.getOffcutDetail(offcutId);
    if (!item) {
      return HttpResponse.json({ error: 'Offcut nem található' }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  // POST /api/inventory/offcuts/{offcutId}/reserve → 201 + ReserveOffcutResponse
  http.post('/api/inventory/offcuts/:offcutId/reserve', async ({ params, request }) => {
    const offcutId = params.offcutId as string;
    const body = (await request.json()) as { jobId?: string } | null;
    const res = warehouseMockDb.reserveOffcut(offcutId, body?.jobId || '');
    if (isMockError(res)) {
      return HttpResponse.json({ error: res.message }, { status: res.status });
    }
    return HttpResponse.json(res, { status: 201 });
  }),

  // POST /api/inventory/offcuts/{offcutId}/approve-reservation
  // Valódi reservationId kötelező; lejárt foglalás → 410 (backend-tükör).
  http.post('/api/inventory/offcuts/:offcutId/approve-reservation', async ({ params, request }) => {
    const offcutId = params.offcutId as string;
    const body = (await request.json()) as { reservationId?: string } | null;
    if (!body?.reservationId) {
      return HttpResponse.json({ error: 'reservationId kötelező (ApproveReservationRequest).' }, { status: 400 });
    }
    const res = warehouseMockDb.approveOffcutReservation(offcutId, body.reservationId);
    if (isMockError(res)) {
      return HttpResponse.json({ error: res.message }, { status: res.status });
    }
    return HttpResponse.json(res, { status: 200 });
  }),

  // POST /api/inventory/offcuts/{offcutId}/use
  http.post('/api/inventory/offcuts/:offcutId/use', async ({ params, request }) => {
    const offcutId = params.offcutId as string;
    const body = (await request.json()) as { jobId?: string } | null;
    const res = warehouseMockDb.useOffcut(offcutId, body?.jobId || '');
    if (isMockError(res)) {
      return HttpResponse.json({ error: res.message }, { status: res.status });
    }
    return HttpResponse.json(res, { status: 200 });
  }),
];
