/**
 * WORLDS-WAREHOUSE-API-GATE — élő inventory/procurement kontraktus-kapu.
 *
 * ⚠ Ez a fájl SZÁNDÉKOSAN nem `*.test.ts`/`*.spec.ts` — a vitest alap
 * `include` mintája (`**\/*.{test,spec}.*`) ezért NEM szedi fel, tehát
 * `npm test` / `test:pr` / `test:full` / `test:nightly` sosem futtatja.
 * Kizárólag a `test:contract:warehouse` script futtatja, a saját
 * `vitest.contract.warehouse.config.ts` fájlon keresztül.
 *
 * Kötelező env:
 *   WAREHOUSE_INVENTORY_BASE_URL    pl. http://127.0.0.1:3458 (vagy inventory host)
 *   WAREHOUSE_PROCUREMENT_BASE_URL  pl. http://127.0.0.1:3458 (vagy procurement host)
 *   WAREHOUSE_CONTRACT_TOKEN        Bearer JWT egy engedélyezett tenanthoz.
 */
/// <reference types="node" />
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import {
  stockListResponseSchema,
  inventorySummaryResponseSchema,
  getOffcutListResponseSchema,
  consumptionTrendResponseSchema,
  purchaseOrderListItemSchema,
  supplierResponseSchema,
  requisitionDtoSchema,
} from '../schemas';
import { requireEnv, summarizeDrift, formatReportRow, type RouteReport } from '../contract/gateHelpers';

const report: RouteReport[] = [];

interface FetchResult {
  status: number;
  json: unknown;
  durationMs: number;
}

async function timedFetch(url: string, init: RequestInit = {}): Promise<FetchResult> {
  const start = performance.now();
  const res = await fetch(url, init);
  const durationMs = Math.round(performance.now() - start);
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, json, durationMs };
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

describe('WORLDS-WAREHOUSE-API-GATE — élő inventory/procurement kontraktus-kapu', () => {
  let inventoryBase: string;
  let procurementBase: string;
  let token: string | undefined;

  beforeAll(() => {
    inventoryBase = requireEnv('WAREHOUSE_INVENTORY_BASE_URL');
    procurementBase = requireEnv('WAREHOUSE_PROCUREMENT_BASE_URL');
    token = process.env.WAREHOUSE_CONTRACT_TOKEN?.trim() || undefined;
  });

  afterAll(() => {
    console.log('\n=== WORLDS-WAREHOUSE-API-GATE — route report (HTTP/schema/drift/duration) ===');
    for (const row of report) {
      console.log(formatReportRow(row));
    }
  });

  describe('401 hibakontraktus — token nélkül (nem igényel valós bearer tokent)', () => {
    it('GET /api/inventory/stock → 401 hitelesítés nélkül', async () => {
      const { status, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/stock`);
      report.push({ route: '/api/inventory/stock', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs });
      expect(status).toBe(401);
    });

    it('GET /api/procurement/orders → 401 hitelesítés nélkül', async () => {
      const { status, durationMs } = await timedFetch(`${procurementBase}/api/procurement/orders`);
      report.push({ route: '/api/procurement/orders', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs });
      expect(status).toBe(401);
    });
  });

  describe('Read-only kontraktus + zod schema-validáció (TOKEN KÖTELEZŐ)', () => {
    it('GET /api/inventory/stock — valós válasz a stockListResponseSchema-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/stock`, {
        headers: authHeader(token),
      });
      const parsed = stockListResponseSchema.safeParse(json);
      report.push({
        route: '/api/inventory/stock',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/inventory/summary — valós válasz az inventorySummaryResponseSchema-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/summary`, {
        headers: authHeader(token),
      });
      const parsed = inventorySummaryResponseSchema.safeParse(json);
      report.push({
        route: '/api/inventory/summary',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/inventory/offcuts — valós válasz a getOffcutListResponseSchema-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/offcuts`, {
        headers: authHeader(token),
      });
      const parsed = getOffcutListResponseSchema.safeParse(json);
      report.push({
        route: '/api/inventory/offcuts',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/inventory/trend — valós válasz a consumptionTrendResponseSchema-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/trend`, {
        headers: authHeader(token),
      });
      const parsed = consumptionTrendResponseSchema.safeParse(json);
      report.push({
        route: '/api/inventory/trend',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/procurement/orders — valós válasz a z.array(purchaseOrderListItemSchema)-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${procurementBase}/api/procurement/orders`, {
        headers: authHeader(token),
      });
      const parsed = z.array(purchaseOrderListItemSchema).safeParse(json);
      report.push({
        route: '/api/procurement/orders',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/procurement/suppliers — valós válasz a z.array(supplierResponseSchema)-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${procurementBase}/api/procurement/suppliers`, {
        headers: authHeader(token),
      });
      const parsed = z.array(supplierResponseSchema).safeParse(json);
      report.push({
        route: '/api/procurement/suppliers',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });

    it('GET /api/procurement/requisitions — valós válasz a z.array(requisitionDtoSchema)-n PASS', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.');
      }
      const { status, json, durationMs } = await timedFetch(`${procurementBase}/api/procurement/requisitions`, {
        headers: authHeader(token),
      });
      const parsed = z.array(requisitionDtoSchema).safeParse(json);
      report.push({
        route: '/api/procurement/requisitions',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      });
      expect(status).toBe(200);
      expect(parsed.success).toBe(true);
    });
  });

  describe('400/409/410 hibakontraktus — hibás paraméterek (TOKEN KÖTELEZŐ)', () => {
    it('GET /api/inventory/offcuts?page=0 (invalid page) → 400', async () => {
      if (!token) {
        throw new Error('[gate] WAREHOUSE_CONTRACT_TOKEN hiányzik — a hibakontraktus-fázis nem futtatható.');
      }
      const { status, durationMs } = await timedFetch(`${inventoryBase}/api/inventory/offcuts?page=0`, {
        headers: authHeader(token),
      });
      report.push({ route: '/api/inventory/offcuts (page=0)', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs });
      expect([400, 422]).toContain(status);
    });
  });

  describe('tiltott FSM-átmenet (offcut 409/410 / PO 409) — MUTÁCIÓ, disposable dev tenant nélkül BLOKKOLT', () => {
    it.fails('nincs safe disposable dev tenant — FSM-mutáció nem futtatható', () => {
      throw new Error(
        'BLOCKED: a tiltott FSM-átmenet bizonyítása mutációt igényelne (pl. duplikált PO szállítás vagy lejárt offcut foglalása) egy disposable dev/seed tenanton. ' +
          'Ilyen tenant/token nem áll rendelkezésre ebben a környezetben — lásd WORLDS-WAREHOUSE-API-GATE.md Stop-klauzula. ' +
          'A 400 hibakontraktus (fentebb) és a 401 token hiányos tesztek a kaput teljesítik.',
      );
    });
  });
});
