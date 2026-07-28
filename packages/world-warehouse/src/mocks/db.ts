import {
  SEED_STOCK_ITEMS, SEED_OFFCUTS, SEED_RESERVATIONS, SEED_MOVEMENTS,
  SEED_SUPPLIERS, SEED_PURCHASE_ORDERS, SEED_REQUISITIONS, SEED_TENANT_ID,
} from './seed';
import type { SeedPurchaseOrder, SeedReservation } from './seed';
import type {
  StockListItem, OffcutListItem, SupplierResponse, PurchaseOrderListItem,
  OrderStatusResponse, RequisitionDto, MovementListItem, InventorySummaryResponse,
} from '../services/schemas';
import { PO_FSM } from '../services/poFsm';
import type { PurchaseOrderAction } from '../services/poFsm';
import { canTransition } from '@spaceos/portal-core';

/**
 * Warehouse mock adatbázis — állapottartó in-memory store az MSW kontraktus-
 * tükörhöz (production db.ts minta). Hiba-szemantika a backend forrásokból:
 *  - inventory lapozás: sávon kívüli page/pageSize → 400 (InventoryEndpoints),
 *  - inbound ismeretlen anyagra → 404 (Results.NotFound ág), consumption
 *    hibára → 400 (Results.BadRequest ág),
 *  - offcut reserve nem-Available státuszból → 409 (Result.Conflict),
 *    approve ismeretlen foglalásra → 404, lejárt foglalásra → **410**
 *    (OffcutEndpoints ApproveReservation), use nem-Reserved státuszból → 409,
 *  - PO-átmenetek: a services/poFsm.ts KÖZÖS táblájának guardja — tiltott
 *    átmenet → 409 (Result.Conflict → ResultToHttp), törzs: csupasz string[].
 */

type MockErrorResult = { error: string; status: number; message: string };

function conflict(message: string): MockErrorResult {
  return { error: 'CONFLICT', status: 409, message };
}

function notFound(message: string): MockErrorResult {
  return { error: 'NOT_FOUND', status: 404, message };
}

function badRequest(message: string): MockErrorResult {
  return { error: 'VALIDATION', status: 400, message };
}

function gone(message: string): MockErrorResult {
  return { error: 'GONE', status: 410, message };
}

export function isMockError(res: unknown): res is MockErrorResult {
  return typeof res === 'object' && res !== null && 'error' in res && 'status' in res;
}

function paginate<T>(rows: T[], page: number, pageSize: number): { slice: T[]; total: number } {
  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { slice: rows.slice(start, start + pageSize), total };
}

class WarehouseMockDb {
  private stockItems: StockListItem[] = JSON.parse(JSON.stringify(SEED_STOCK_ITEMS));
  private offcuts: OffcutListItem[] = JSON.parse(JSON.stringify(SEED_OFFCUTS));
  private reservations: SeedReservation[] = JSON.parse(JSON.stringify(SEED_RESERVATIONS));
  private movements: MovementListItem[] = JSON.parse(JSON.stringify(SEED_MOVEMENTS));
  private suppliers: SupplierResponse[] = JSON.parse(JSON.stringify(SEED_SUPPLIERS));
  private purchaseOrders: SeedPurchaseOrder[] = JSON.parse(JSON.stringify(SEED_PURCHASE_ORDERS));
  private requisitions: RequisitionDto[] = JSON.parse(JSON.stringify(SEED_REQUISITIONS));

  // Reset helper for tests
  public reset() {
    this.stockItems = JSON.parse(JSON.stringify(SEED_STOCK_ITEMS));
    this.offcuts = JSON.parse(JSON.stringify(SEED_OFFCUTS));
    this.reservations = JSON.parse(JSON.stringify(SEED_RESERVATIONS));
    this.movements = JSON.parse(JSON.stringify(SEED_MOVEMENTS));
    this.suppliers = JSON.parse(JSON.stringify(SEED_SUPPLIERS));
    this.purchaseOrders = JSON.parse(JSON.stringify(SEED_PURCHASE_ORDERS));
    this.requisitions = JSON.parse(JSON.stringify(SEED_REQUISITIONS));
  }

  // ── Stock (GetStockListQuery tükör) ────────────────────────────────────────

  public getStockList(opts: { materialType?: string; q?: string; page: number; pageSize: number }) {
    let filtered = [...this.stockItems];
    if (opts.materialType) {
      filtered = filtered.filter((s) => s.materialType.toLowerCase() === opts.materialType!.toLowerCase());
    }
    if (opts.q) {
      filtered = filtered.filter((s) => s.materialType.toLowerCase().includes(opts.q!.toLowerCase()));
    }
    const { slice, total } = paginate(filtered, opts.page, opts.pageSize);
    return { items: slice.map((s) => ({ ...s })), total, page: opts.page, pageSize: opts.pageSize };
  }

  private findStock(materialType: string): StockListItem | undefined {
    return this.stockItems.find((s) => s.materialType.toLowerCase() === materialType.toLowerCase());
  }

  // ── Summary (GetInventorySummaryQuery tükör) ───────────────────────────────

  public getInventorySummary(): InventorySummaryResponse {
    const byUnit = new Map<string, number>();
    for (const item of this.stockItems) {
      byUnit.set(item.unitOfMeasure, (byUnit.get(item.unitOfMeasure) ?? 0) + item.totalQuantity);
    }
    return {
      activeMaterialTypeCount: this.stockItems.length,
      totalQuantityByUnit: [...byUnit.entries()].map(([unitOfMeasure, quantity]) => ({ unitOfMeasure, quantity })),
      // A backend a perzisztált MaterialCatalog.ReorderPoint küszöböt használja.
      lowStockCount: this.stockItems.filter((s) => s.totalQuantity <= s.reorderMin).length,
      totalStockValue: this.stockItems.reduce((acc, s) => acc + s.totalQuantity * s.unitPrice, 0),
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Mutations (consumption 400 / inbound 404 hibaágakkal) ──────────────────

  public recordConsumption(materialType: string, panelCount: number, reason?: string): MockErrorResult | { ok: true } {
    const stock = this.findStock(materialType);
    if (!stock) {
      // Backend: RecordConsumption hibaágon Results.BadRequest(result.Errors).
      return badRequest(`Ismeretlen anyagtípus: '${materialType}' — nincs hozzá készlet.`);
    }
    stock.fullPanelQuantity = Math.max(0, stock.fullPanelQuantity - panelCount);
    stock.totalQuantity = stock.fullPanelQuantity + stock.offcutQuantity;
    this.movements.unshift({
      id: crypto.randomUUID(),
      materialType: stock.materialType,
      movementType: 'Consumption',
      quantity: panelCount,
      reference: reason || 'Gyártási felhasználás',
      occurredAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  public recordInbound(materialType: string, panelCount: number, reference?: string): MockErrorResult | { ok: true } {
    const stock = this.findStock(materialType);
    if (!stock) {
      // Backend: RecordInbound NotFound-ága → 404 — ismeretlen anyagra NEM
      // találunk ki készletsort (MaterialCatalog-bejegyzés kell hozzá).
      return notFound(`Ismeretlen anyagtípus: '${materialType}' — nincs MaterialCatalog-bejegyzés.`);
    }
    stock.fullPanelQuantity += panelCount;
    stock.totalQuantity = stock.fullPanelQuantity + stock.offcutQuantity;
    this.movements.unshift({
      id: crypto.randomUUID(),
      materialType: stock.materialType,
      movementType: 'Inbound',
      quantity: panelCount,
      reference: reference || 'BEV-MANUAL',
      occurredAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  // ── Offcuts ────────────────────────────────────────────────────────────────

  public getOffcutsList(status?: string, materialCode?: string, page: number = 1, pageSize: number = 20) {
    let filtered = [...this.offcuts];
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    if (materialCode) {
      filtered = filtered.filter((o) => o.materialCode.toLowerCase().includes(materialCode.toLowerCase()));
    }
    const { slice, total } = paginate(filtered, page, pageSize);
    return { offcuts: slice, total, page, pageSize };
  }

  public getOffcutDetail(id: string) {
    const item = this.offcuts.find((o) => o.id === id);
    if (!item) return null;
    return {
      ...item,
      usedAt: item.status === 'Used' ? item.createdAt : null,
      usedInJobId: item.status === 'Used' ? item.cuttingJobId : null,
      reservationHistory: this.reservations
        .filter((r) => r.offcutId === id)
        .map((r) => ({
          reservationId: r.reservationId,
          jobId: r.jobId,
          status: r.status,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
        })),
    };
  }

  public getOffcutStatsSummary() {
    const available = this.offcuts.filter((o) => o.status === 'Available');
    const reserved = this.offcuts.filter((o) => o.status === 'Reserved');
    const used = this.offcuts.filter((o) => o.status === 'Used');
    const scrapped = this.offcuts.filter((o) => o.status === 'Scrapped');

    const availableByMaterial: Record<string, { volumeM3: number; weightKg: number }> = {};
    available.forEach((o) => {
      if (!availableByMaterial[o.materialCode]) {
        availableByMaterial[o.materialCode] = { volumeM3: 0, weightKg: 0 };
      }
      availableByMaterial[o.materialCode].volumeM3 += o.volumeM3;
      availableByMaterial[o.materialCode].weightKg += o.weightKg;
    });

    return {
      totalAvailableVolumeM3: available.reduce((acc, o) => acc + o.volumeM3, 0),
      totalAvailableWeightKg: available.reduce((acc, o) => acc + o.weightKg, 0),
      availableByMaterial,
      reservedCount: reserved.length,
      usedCount: used.length,
      scrappedCount: scrapped.length,
    };
  }

  /** Reserve: csak Available offcutra (Conflict-tükör); Pending foglalást hoz létre. */
  public reserveOffcut(id: string, jobId: string) {
    const item = this.offcuts.find((o) => o.id === id);
    if (!item) return notFound('Offcut nem található');
    if (item.status !== 'Available') {
      return conflict(`Az offcut nem foglalható le (státusz: ${item.status}).`);
    }
    if (!jobId) return badRequest('Munkalap-azonosító (jobId) kötelező.');

    const reservation: SeedReservation = {
      reservationId: crypto.randomUUID(),
      offcutId: id,
      jobId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    };
    this.reservations.push(reservation);
    return { reservationId: reservation.reservationId, expiresAt: reservation.expiresAt };
  }

  /**
   * Approve: a foglalást a VALÓDI reservationId azonosítja (backend:
   * ismeretlen → 404, lejárt → 410); siker: reservation Approved + offcut
   * Available→Reserved. Nem-Available offcutra 409 (dupla jóváhagyás-védelem).
   */
  public approveOffcutReservation(offcutId: string, reservationId: string) {
    const reservation = this.reservations.find(
      (r) => r.reservationId === reservationId && r.offcutId === offcutId,
    );
    if (!reservation) return notFound(`Foglalás (${reservationId}) nem található ehhez az offcuthoz.`);
    if (new Date(reservation.expiresAt).getTime() < Date.now()) {
      return gone('Reservation has expired.');
    }
    if (reservation.status !== 'Pending') {
      return badRequest(`A foglalás már nem jóváhagyható (státusz: ${reservation.status}).`);
    }
    const item = this.offcuts.find((o) => o.id === reservation.offcutId);
    if (!item) return notFound('Offcut nem található');
    if (item.status !== 'Available') {
      return conflict(`Az offcut már nem jóváhagyható (státusz: ${item.status}).`);
    }

    reservation.status = 'Approved';
    item.status = 'Reserved';
    item.cuttingJobId = reservation.jobId;
    return { status: 'Approved' };
  }

  public useOffcut(id: string, jobId: string) {
    const item = this.offcuts.find((o) => o.id === id);
    if (!item) return notFound('Offcut nem található');
    if (item.status !== 'Reserved') {
      return conflict('Csak lefoglalt (Reserved) offcut használható fel.');
    }
    if (!jobId) return badRequest('Munkalap-azonosító (jobId) kötelező.');

    item.status = 'Used';
    item.cuttingJobId = jobId;
    return { status: 'Used', usedInJobId: jobId, usedAt: new Date().toISOString() };
  }

  /** TESZT-helper: foglalás lejáratása a 410-es ág bizonyításához. */
  public expireReservation(reservationId: string) {
    const reservation = this.reservations.find((r) => r.reservationId === reservationId);
    if (reservation) {
      reservation.expiresAt = new Date(Date.now() - 1000).toISOString();
    }
  }

  // ── Suppliers & POs ────────────────────────────────────────────────────────

  public getSuppliers() {
    return this.suppliers.map((s) => ({ ...s }));
  }

  private toListItem(po: SeedPurchaseOrder): PurchaseOrderListItem {
    const supplier = this.suppliers.find((s) => s.id === po.supplierId);
    return {
      id: po.id,
      // Backend GetOrdersQueryHandler: ismeretlen supplierId → maga az id.
      supplierName: supplier?.name ?? po.supplierId,
      totalAmount: po.quantity * po.unitPrice,
      expectedDelivery: po.expectedDelivery,
      status: po.status,
      createdAt: po.createdAt,
    };
  }

  private toOrderStatus(po: SeedPurchaseOrder): OrderStatusResponse {
    return {
      id: po.id,
      tenantId: po.tenantId,
      supplierId: po.supplierId,
      materialType: po.materialType,
      quantity: po.quantity,
      unitPrice: po.unitPrice,
      currency: po.currency,
      status: po.status,
      expectedDelivery: po.expectedDelivery,
      createdAt: po.createdAt,
    };
  }

  public getPurchaseOrders(): PurchaseOrderListItem[] {
    return this.purchaseOrders.map((po) => this.toListItem(po));
  }

  public createPurchaseOrder(input: {
    supplierId?: string; materialType?: string; quantity?: number;
    unitPrice?: number; expectedDeliveryDate?: string; currency?: string;
  }) {
    if (!input.supplierId || !input.materialType || !input.quantity || input.quantity <= 0
      || !input.unitPrice || input.unitPrice <= 0) {
      return badRequest('supplierId, materialType, pozitív quantity és unitPrice kötelező.');
    }
    const po: SeedPurchaseOrder = {
      id: crypto.randomUUID(),
      tenantId: SEED_TENANT_ID,
      supplierId: input.supplierId,
      materialType: input.materialType,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      currency: input.currency ?? 'HUF',
      // Backend-hű: a CreatePurchaseOrderCommandHandler a Create után azonnal
      // Submit()-et hív, így a direkt create SOSEM hagy Draft-ot — Draft PO
      // kizárólag rekvizíció-konverzióból születik (ConvertRequisitionToPO).
      status: 'Submitted',
      // Backend-hű: hiányzó expectedDeliveryDate → null tárolódik
      // (CreatePurchaseOrderCommand.ExpectedDeliveryDate nullable), a mock
      // nem talál ki dátumot a supplier leadTimeDays-ből.
      expectedDelivery: input.expectedDeliveryDate ?? null,
      createdAt: new Date().toISOString(),
    };
    this.purchaseOrders.unshift(po);
    return { id: po.id };
  }

  public getPurchaseOrderDetail(id: string): OrderStatusResponse | null {
    const po = this.purchaseOrders.find((p) => p.id === id);
    return po ? this.toOrderStatus(po) : null;
  }

  /**
   * PO FSM-átmenet — a guard UGYANABBÓL a PO_FSM táblából fut, mint a UI
   * gomb-láthatóság (poFsm.ts): tiltott átmenet → 409 (Result.Conflict tükör).
   * Deliver: kötelező pozitív receivedQuantity (400), siker esetén a backend
   * sync inventory-inbound párjaként a stock/movements is frissül.
   */
  public transitionPurchaseOrder(
    id: string,
    action: PurchaseOrderAction,
    options: { receivedQuantity?: number } = {},
  ): MockErrorResult | OrderStatusResponse {
    const po = this.purchaseOrders.find((p) => p.id === id);
    if (!po) return notFound(`Purchase order ${id} not found.`);

    if (!canTransition(PO_FSM, action, po.status)) {
      return conflict(`Cannot ${action} order in status ${po.status}.`);
    }

    if (action === 'deliver') {
      const receivedQuantity = options.receivedQuantity;
      if (typeof receivedQuantity !== 'number' || !Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
        return badRequest('A leszállításhoz kötelező pozitív receivedQuantity (DeliverPurchaseOrderRequest).');
      }
      po.status = PO_FSM.deliver.to;
      // A RecordDeliveryCommandHandler sync inventory-inbound hívásának tükre.
      this.recordInbound(po.materialType, Math.ceil(receivedQuantity), `Delivery from PO ${po.id}`);
      return this.toOrderStatus(po);
    }

    po.status = PO_FSM[action].to;
    return this.toOrderStatus(po);
  }

  public getRequisitions() {
    return this.requisitions.map((r) => ({ ...r }));
  }

  // ── Movements ──────────────────────────────────────────────────────────────

  public getMovements(opts: {
    materialType?: string;
    type?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) {
    let filtered = [...this.movements];

    if (opts.materialType) {
      filtered = filtered.filter((m) =>
        m.materialType.toLowerCase().includes(opts.materialType!.toLowerCase())
      );
    }
    if (opts.type) {
      filtered = filtered.filter((m) => m.movementType === opts.type);
    }
    if (opts.from) {
      const from = new Date(opts.from).getTime();
      filtered = filtered.filter((m) => new Date(m.occurredAt).getTime() >= from);
    }
    if (opts.to) {
      const to = new Date(opts.to).getTime();
      filtered = filtered.filter((m) => new Date(m.occurredAt).getTime() <= to);
    }

    const { slice, total } = paginate(filtered, opts.page, opts.pageSize);
    return { items: slice, total, page: opts.page, pageSize: opts.pageSize };
  }
}

export const warehouseMockDb = new WarehouseMockDb();
