import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { warehouseHandlers, warehouseMockDb } from '../../mocks';
import {
  getStockList,
  getInventorySummary,
  getConsumptionTrend,
  getMovements,
  recordConsumption,
  recordInbound,
  getOffcutList,
  getOffcutDetail,
  getOffcutStatsSummary,
  reserveOffcut,
  approveOffcutReservation,
  useOffcut,
  getSuppliers,
  getPurchaseOrders,
  createPurchaseOrder,
  transitionPurchaseOrder,
  deliverPurchaseOrder,
} from '../index';
import { ApiError, isConflict } from '../../../../services/apiClient';

const server = setupServer(...warehouseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
beforeEach(() => warehouseMockDb.reset());

/** Státuszkód-assert: NEM elég a rejects.toThrow — a kódot is bizonyítjuk. */
async function expectApiError(promise: Promise<unknown>, status: number): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    return error as ApiError;
  }
  throw new Error(`A hívásnak ${status}-as ApiError-ral kellett volna elbuknia, de sikeres volt.`);
}

const JOB_A = 'c1111111-1111-4111-8111-aaaaaaaaaaaa';
const OFFCUT_AVAILABLE = 'b1111111-1111-4111-8111-111111111111';
const OFFCUT_RESERVED = 'b2222222-2222-4222-8222-222222222222';
const OFFCUT_USED = 'b3333333-3333-4333-8333-333333333333';
const PO_CONFIRMED = 'd1111111-1111-4111-8111-111111111111';
const PO_SUBMITTED = 'd2222222-2222-4222-8222-222222222222';
const PO_DRAFT = 'd3333333-3333-4333-8333-333333333333';

describe('Warehouse Module API & Services', () => {
  describe('Inventory Stock API (GetStockListQuery-tükör)', () => {
    it('lapozott StockListResponse-t ad items/total/page/pageSize alakkal', async () => {
      const result = await getStockList();
      expect(result).toMatchObject({ total: 4, page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(4);
      const mdf = result.items.find((i) => i.materialType === 'MDF 18mm');
      expect(mdf).toMatchObject({
        unitOfMeasure: 'db',
        fullPanelQuantity: 42,
        offcutQuantity: 14,
        totalQuantity: 56,
        unitPrice: 12000,
        reorderMin: 20,
      });
      expect(mdf?.materialCatalogId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('materialType filter pontos találatot ad, q keresés részleges egyezést', async () => {
      const byType = await getStockList({ materialType: 'MDF 18mm' });
      expect(byType.total).toBe(1);
      expect(byType.items[0].materialType).toBe('MDF 18mm');

      const byQuery = await getStockList({ q: 'lemez' });
      expect(byQuery.total).toBe(1);
      expect(byQuery.items[0].materialType).toBe('Rétegelt lemez 15mm');
    });

    it('lapozás: pageSize=2 két oldalra vágja a 4 tételt', async () => {
      const page1 = await getStockList({ page: 1, pageSize: 2 });
      const page2 = await getStockList({ page: 2, pageSize: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
      expect(page1.total).toBe(4);
    });

    it('sávon kívüli lapozás (page=0 / pageSize=101) → 400', async () => {
      await expectApiError(getStockList({ page: 0 }), 400);
      await expectApiError(getStockList({ pageSize: 101 }), 400);
    });
  });

  describe('Inventory Summary API (GetInventorySummaryQuery-tükör)', () => {
    it('a summary a készletből számolt KPI-ket adja (nem default-anyag számát)', async () => {
      const summary = await getInventorySummary();
      expect(summary.activeMaterialTypeCount).toBe(4);
      expect(summary.totalQuantityByUnit).toEqual([{ unitOfMeasure: 'db', quantity: 56 + 24 + 33 + 10 }]);
      // Rétegelt lemez: total 10 <= reorderMin 12 → 1 alacsony készletű tétel
      expect(summary.lowStockCount).toBe(1);
      expect(summary.totalStockValue).toBe(56 * 12000 + 24 * 28500 + 33 * 22000 + 10 * 9800);
      expect(summary.generatedAt).toBeTruthy();
    });

    it('a summary követi a készletmozgást (inbound után nő az összkészlet)', async () => {
      const before = await getInventorySummary();
      await recordInbound({
        materialType: 'MDF 18mm', thickness: 18, area: 5.796, panelCount: 10,
        reference: 'DEL-999', occurredAt: new Date().toISOString(),
      });
      const after = await getInventorySummary();
      expect(after.totalQuantityByUnit[0].quantity).toBe(before.totalQuantityByUnit[0].quantity + 10);
      expect(after.totalStockValue).toBe(before.totalStockValue + 10 * 12000);
    });
  });

  describe('Inventory mutations & movements', () => {
    it('felhasználás rögzítése csökkenti a készletet és movements-sort ír', async () => {
      await recordConsumption({
        materialType: 'MDF 18mm', thickness: 18, area: 5.796, panelCount: 2,
        reason: 'Munkalap-42', occurredAt: new Date().toISOString(),
      });
      const stock = await getStockList({ materialType: 'MDF 18mm' });
      expect(stock.items[0].fullPanelQuantity).toBe(40);
      expect(stock.items[0].totalQuantity).toBe(54);

      const movements = await getMovements({ type: 'Consumption' });
      expect(movements.items[0]).toMatchObject({
        materialType: 'MDF 18mm', movementType: 'Consumption', quantity: 2, reference: 'Munkalap-42',
      });
    });

    it('bevételezés növeli a készletet és movements-sort ír', async () => {
      await recordInbound({
        materialType: 'MDF 18mm', thickness: 18, area: 5.796, panelCount: 10,
        reference: 'DEL-999', occurredAt: new Date().toISOString(),
      });
      const stock = await getStockList({ materialType: 'MDF 18mm' });
      expect(stock.items[0].fullPanelQuantity).toBe(52);

      const movements = await getMovements({ type: 'Inbound' });
      expect(movements.items[0]).toMatchObject({ movementType: 'Inbound', quantity: 10, reference: 'DEL-999' });
    });

    it('ismeretlen anyagra a bevételezés 404 (nincs kitalált készletsor)', async () => {
      await expectApiError(recordInbound({
        materialType: 'Nemlétező anyag', thickness: 18, area: 5.796, panelCount: 1,
        reference: 'DEL-1', occurredAt: new Date().toISOString(),
      }), 404);
      const stock = await getStockList();
      expect(stock.total).toBe(4);
    });

    it('ismeretlen anyagra a felhasználás 400 (BadRequest-ág tükör)', async () => {
      await expectApiError(recordConsumption({
        materialType: 'Nemlétező anyag', thickness: 18, area: 5.796, panelCount: 1,
        reason: 'x', occurredAt: new Date().toISOString(),
      }), 400);
    });

    it('lapozott movement-lista + típus-szűrő', async () => {
      const result = await getMovements({ type: 'Offcut', page: 1, pageSize: 20 });
      expect(result).toMatchObject({ total: 1, page: 1, pageSize: 20 });
      expect(result.items[0]).toMatchObject({ movementType: 'Offcut', materialType: 'MDF 18mm' });
    });

    it('movements sávon kívüli lapozás → 400', async () => {
      await expectApiError(getMovements({ page: 0 }), 400);
      await expectApiError(getMovements({ pageSize: 101 }), 400);
    });

    it('a trend determinisztikus (két hívás azonos adatot ad)', async () => {
      const a = await getConsumptionTrend('MDF 18mm');
      const b = await getConsumptionTrend('MDF 18mm');
      expect(a.dailyData).toEqual(b.dailyData);
      expect(a.averageDailyConsumption).toBe(b.averageDailyConsumption);
      expect(a.dailyData).toHaveLength(7);
    });
  });

  describe('Inventory Offcuts API', () => {
    it('lista + statisztika-összesítő', async () => {
      const list = await getOffcutList();
      expect(list.total).toBe(3);
      expect(list.offcuts.length).toBe(3);

      const summary = await getOffcutStatsSummary();
      expect(summary.reservedCount).toBe(1);
      expect(summary.usedCount).toBe(1);
    });

    it('offcut detail a foglalás-előzményekkel (Reserved seed → Approved history)', async () => {
      const detail = await getOffcutDetail(OFFCUT_RESERVED);
      expect(detail.status).toBe('Reserved');
      expect(detail.reservationHistory).toHaveLength(1);
      expect(detail.reservationHistory[0]).toMatchObject({ status: 'Approved' });
    });

    it('ismeretlen offcut detail → 404', async () => {
      await expectApiError(getOffcutDetail('00000000-0000-0000-0000-000000000000'), 404);
    });

    it('reserve→approve→use lánc VALÓDI reservationId-átfűzéssel', async () => {
      // 1. Reserve: a válaszban valódi reservationId (nem stub)
      const res = await reserveOffcut({ offcutId: OFFCUT_AVAILABLE, jobId: JOB_A });
      expect(res.reservationId).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.expiresAt).toBeTruthy();

      // a foglalás Pending — az offcut még Available (backend-szemantika)
      const afterReserve = await getOffcutDetail(OFFCUT_AVAILABLE);
      expect(afterReserve.status).toBe('Available');
      expect(afterReserve.reservationHistory).toContainEqual(
        expect.objectContaining({ reservationId: res.reservationId, status: 'Pending' }),
      );

      // 2. Approve a valódi reservationId-val → Reserved
      const approved = await approveOffcutReservation({ offcutId: OFFCUT_AVAILABLE, reservationId: res.reservationId });
      expect(approved.status).toBe('Approved');
      const afterApprove = await getOffcutDetail(OFFCUT_AVAILABLE);
      expect(afterApprove.status).toBe('Reserved');

      // 3. Use → Used (UseOffcutInJobResponse-alak)
      const used = await useOffcut({ offcutId: OFFCUT_AVAILABLE, jobId: JOB_A });
      expect(used).toMatchObject({ status: 'Used', usedInJobId: JOB_A });
      const afterUse = await getOffcutDetail(OFFCUT_AVAILABLE);
      expect(afterUse.status).toBe('Used');
    });

    it('reserve nem-UUID jobId-val kliens-oldalon bukik (a backend Guid-ot vár)', async () => {
      await expect(reserveOffcut({ offcutId: OFFCUT_AVAILABLE, jobId: 'job-demo-001' })).rejects.toThrow(/UUID/);
    });

    it('reserve nem-Available offcutra → 409 Conflict', async () => {
      const error = await expectApiError(reserveOffcut({ offcutId: OFFCUT_RESERVED, jobId: JOB_A }), 409);
      expect(isConflict(error)).toBe(true);
    });

    it('reserve ismeretlen offcutra → 404', async () => {
      await expectApiError(reserveOffcut({ offcutId: '00000000-0000-0000-0000-000000000000', jobId: JOB_A }), 404);
    });

    it('approve ismeretlen reservationId-val → 404 (stub-azonosító nem zöldülhet)', async () => {
      await expectApiError(approveOffcutReservation({
        offcutId: OFFCUT_AVAILABLE,
        reservationId: '99999999-9999-4999-8999-999999999999',
      }), 404);
    });

    it('approve LEJÁRT foglalásra → 410 Gone (backend expiry-tükör)', async () => {
      const res = await reserveOffcut({ offcutId: OFFCUT_AVAILABLE, jobId: JOB_A });
      warehouseMockDb.expireReservation(res.reservationId);
      await expectApiError(approveOffcutReservation({
        offcutId: OFFCUT_AVAILABLE, reservationId: res.reservationId,
      }), 410);
    });

    it('use Available (nem Reserved) offcutra → 409', async () => {
      await expectApiError(useOffcut({ offcutId: OFFCUT_AVAILABLE, jobId: JOB_A }), 409);
    });

    it('use már felhasznált offcutra → 409', async () => {
      await expectApiError(useOffcut({ offcutId: OFFCUT_USED, jobId: JOB_A }), 409);
    });

    it('offcut lista sávon kívüli lapozása → 400', async () => {
      await expectApiError(getOffcutList({ page: 0 }), 400);
    });
  });

  describe('Procurement API (PO FSM + deliver-body)', () => {
    it('beszállítók és PO-lista: supplierId-ból feloldott név, mennyiség × egységár összeg', async () => {
      const suppliers = await getSuppliers();
      expect(suppliers.length).toBe(2);

      const pos = await getPurchaseOrders();
      const confirmed = pos.find((p) => p.id === PO_CONFIRMED);
      expect(confirmed).toMatchObject({
        supplierName: 'Jácint Faipar Kft.',
        totalAmount: 40 * 12000,
        status: 'Confirmed',
      });
    });

    it('PO létrehozás + teljes sikeres FSM-lánc (submit→confirm→ship→deliver)', async () => {
      const suppliers = await getSuppliers();
      const created = await createPurchaseOrder({
        supplierId: suppliers[0].id,
        materialType: 'MDF 18mm',
        quantity: 15,
        unitPrice: 12500,
        currency: 'HUF',
      });
      expect(created.id).toBeDefined();

      // A backend create-handlere auto-submitál (Create → Submit() → mentés),
      // így a direkt create-ből SOSEM látszik Draft — a mock ennek tükre.
      const createdOrder = (await getPurchaseOrders()).find((order) => order.id === created.id);
      expect(createdOrder).toMatchObject({ supplierName: suppliers[0].name, totalAmount: 187500, status: 'Submitted' });

      // A submit akció a seedelt Draft PO-n fedhető (Draft kizárólag
      // rekvizíció-konverzióból létezik a backendben).
      const afterSubmit = await transitionPurchaseOrder({ id: PO_DRAFT, action: 'submit' });
      expect(afterSubmit.status).toBe('Submitted');
      const afterConfirm = await transitionPurchaseOrder({ id: created.id, action: 'confirm' });
      expect(afterConfirm.status).toBe('Confirmed');
      const afterShip = await transitionPurchaseOrder({ id: created.id, action: 'ship' });
      expect(afterShip.status).toBe('Shipped');

      const delivered = await deliverPurchaseOrder({ id: created.id, receivedQuantity: 15 });
      // Minden átmenet-végpont a FRISS OrderStatusResponse-t adja vissza
      expect(delivered).toMatchObject({
        id: created.id,
        status: 'Delivered',
        materialType: 'MDF 18mm',
        quantity: 15,
        unitPrice: 12500,
      });
    });

    it('deliver bevételezést könyvel (a backend sync inventory-inbound tükre)', async () => {
      const before = await getStockList({ materialType: 'MDF 18mm' });
      await deliverPurchaseOrder({ id: PO_CONFIRMED, receivedQuantity: 40 });
      const after = await getStockList({ materialType: 'MDF 18mm' });
      expect(after.items[0].fullPanelQuantity).toBe(before.items[0].fullPanelQuantity + 40);

      const movements = await getMovements({ type: 'Inbound' });
      expect(movements.items[0].reference).toContain(`Delivery from PO ${PO_CONFIRMED}`);
    });

    it('deliver hiányzó/nem-pozitív receivedQuantity-vel kliens-oldalon bukik', async () => {
      await expect(deliverPurchaseOrder({ id: PO_CONFIRMED, receivedQuantity: 0 })).rejects.toThrow(/pozitívnak/);
    });

    it('az MSW hiányzó deliver-body-ra 400-at tükröz (nem 200-at)', async () => {
      const res = await fetch(`/api/procurement/orders/${PO_CONFIRMED}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const order = (await getPurchaseOrders()).find((p) => p.id === PO_CONFIRMED);
      expect(order?.status).toBe('Confirmed');
    });

    it('deliver Confirmed-ből is megengedett (auto-MarkShipped áthidalás)', async () => {
      const delivered = await deliverPurchaseOrder({ id: PO_CONFIRMED, receivedQuantity: 10 });
      expect(delivered.status).toBe('Delivered');
    });

    it('tiltott átmenet → 409 Conflict (submit nem-Draft állapotból)', async () => {
      const error = await expectApiError(transitionPurchaseOrder({ id: PO_CONFIRMED, action: 'submit' }), 409);
      expect(isConflict(error)).toBe(true);
    });

    it('tiltott átmenet → 409 (deliver Submitted-ből; a státusz nem változik)', async () => {
      await expectApiError(deliverPurchaseOrder({ id: PO_SUBMITTED, receivedQuantity: 5 }), 409);
      const order = (await getPurchaseOrders()).find((p) => p.id === PO_SUBMITTED);
      expect(order?.status).toBe('Submitted');
    });

    it('cancel leszállított rendelésre → 409 (terminális állapot)', async () => {
      await transitionPurchaseOrder({ id: PO_CONFIRMED, action: 'ship' });
      await deliverPurchaseOrder({ id: PO_CONFIRMED, receivedQuantity: 40 });
      await expectApiError(transitionPurchaseOrder({ id: PO_CONFIRMED, action: 'cancel' }), 409);
    });

    it('átmenet ismeretlen rendelés-id-ra → 404', async () => {
      await expectApiError(
        transitionPurchaseOrder({ id: '00000000-0000-0000-0000-000000000000', action: 'submit' }),
        404,
      );
    });
  });
});
