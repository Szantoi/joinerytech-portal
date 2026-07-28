import { http, HttpResponse } from 'msw';
import { WAREHOUSE_CONFIG } from '../services/config';
import { warehouseMockDb } from './db';

export const movementsHandlers = [
  // GET /api/inventory/movements
  // Query params: materialType?, type?, from?, to?, page?, pageSize?
  http.get('/api/inventory/movements', ({ request }) => {
    const url = new URL(request.url);
    const materialType = url.searchParams.get('materialType') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || String(WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE), 10);

    if (page < 1) {
      return new HttpResponse(JSON.stringify({ error: 'page must be >= 1.' }), { status: 400 });
    }
    if (pageSize < 1 || pageSize > WAREHOUSE_CONFIG.MAX_PAGE_SIZE) {
      return new HttpResponse(JSON.stringify({ error: `pageSize must be between 1 and ${WAREHOUSE_CONFIG.MAX_PAGE_SIZE}.` }), { status: 400 });
    }

    const result = warehouseMockDb.getMovements({ materialType, type, from, to, page, pageSize });
    return HttpResponse.json(result);
  }),
];
