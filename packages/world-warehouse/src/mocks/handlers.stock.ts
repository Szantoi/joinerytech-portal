import { http, HttpResponse } from 'msw';
import { warehouseMockDb, isMockError } from './db';
import { WAREHOUSE_CONFIG } from '../services/config';

/**
 * Inventory stock/summary/trend/mutation handlerek (InventoryEndpoints.cs
 * tükör). A GET /movements handler NEM itt él — egyetlen tulajdonosa a
 * handlers.movements.ts (duplikált route tilos, ld. a backend
 * WORLDS-INV-OFFCUT-ROUTEFIX tanulságát).
 */

function pageParams(url: URL): { page: number; pageSize: number } | null {
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('pageSize') || String(WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 1) return null;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > WAREHOUSE_CONFIG.MAX_PAGE_SIZE) return null;
  return { page, pageSize };
}

/** Determinisztikus 7 napos trend-minta (nincs Math.random a mockban). */
const TREND_AREAS = [4.2, 3.1, 5.0, 2.8, 4.6, 3.9, 4.4] as const;

export const stockHandlers = [
  // GET /api/inventory/stock — lapozott, szűrhető StockListResponse
  http.get('/api/inventory/stock', ({ request }) => {
    const url = new URL(request.url);
    const paging = pageParams(url);
    if (!paging) {
      return HttpResponse.json(
        { error: `page >= 1 és pageSize 1..${WAREHOUSE_CONFIG.MAX_PAGE_SIZE} kötelező.` },
        { status: 400 },
      );
    }
    return HttpResponse.json(warehouseMockDb.getStockList({
      materialType: url.searchParams.get('materialType') || undefined,
      q: url.searchParams.get('q') || undefined,
      page: paging.page,
      pageSize: paging.pageSize,
    }));
  }),

  // GET /api/inventory/summary — InventorySummaryResponse
  http.get('/api/inventory/summary', () => {
    return HttpResponse.json(warehouseMockDb.getInventorySummary());
  }),

  // GET /api/inventory/trend — determinisztikus napi bontás
  http.get('/api/inventory/trend', ({ request }) => {
    const url = new URL(request.url);
    const materialType = url.searchParams.get('materialType') || WAREHOUSE_CONFIG.DEFAULT_MATERIAL_TYPE;

    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return {
        date: d.toISOString().split('T')[0],
        area: TREND_AREAS[i],
      };
    });

    const total = dailyData.reduce((acc, curr) => acc + curr.area, 0);
    return HttpResponse.json({
      materialType,
      dailyData,
      averageDailyConsumption: Number((total / 7).toFixed(2)),
    });
  }),

  // POST /api/inventory/movements/consumption — hibaág: 400
  http.post('/api/inventory/movements/consumption', async ({ request }) => {
    const body = (await request.json()) as { materialType?: string; panelCount?: number; reason?: string } | null;
    if (!body || !body.materialType || !body.panelCount || body.panelCount <= 0) {
      return HttpResponse.json({ error: 'Hibás kérés: materialType és pozitív panelCount kötelező.' }, { status: 400 });
    }
    const res = warehouseMockDb.recordConsumption(body.materialType, body.panelCount, body.reason);
    if (isMockError(res)) {
      return HttpResponse.json({ error: res.message }, { status: res.status });
    }
    return new HttpResponse(null, { status: 200 });
  }),

  // POST /api/inventory/movements/inbound — ismeretlen anyag: 404 (NotFound ág)
  http.post('/api/inventory/movements/inbound', async ({ request }) => {
    const body = (await request.json()) as { materialType?: string; panelCount?: number; reference?: string } | null;
    if (!body || !body.materialType || !body.panelCount || body.panelCount <= 0) {
      return HttpResponse.json({ error: 'Hibás kérés: materialType és pozitív panelCount kötelező.' }, { status: 400 });
    }
    const res = warehouseMockDb.recordInbound(body.materialType, body.panelCount, body.reference);
    if (isMockError(res)) {
      return HttpResponse.json({ error: res.message }, { status: res.status });
    }
    return new HttpResponse(null, { status: 201 });
  }),
];
