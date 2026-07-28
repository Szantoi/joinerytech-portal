import { z } from 'zod';
import { WAREHOUSE_CONFIG } from './config';

/**
 * Warehouse zod-sémák — MINDEN séma a backend forrás-DTO tükre:
 *  - inventory: GetStockListQuery.cs / GetInventorySummaryQuery.cs /
 *    GetMovementListQuery.cs / InventoryEndpoints.cs (spaceos-modules-inventory)
 *  - offcut: GetOffcutListQuery.cs / GetOffcutDetailQuery.cs / OffcutEndpoints.cs
 *  - procurement: GetOrdersQuery.cs / GetOrderStatusQuery.cs /
 *    ProcurementEndpoints.cs (DeliverPurchaseOrderRequest!)
 */

/**
 * Stock — `GET /api/inventory/stock` (WORLDS-INV-READ-API).
 * Backend: `StockListResponse{items[],total,page,pageSize}`; item =
 * `StockListItem` (GetStockListQuery.cs). unitPrice/reorderMin a perzisztált
 * MaterialCatalog.UnitCost/ReorderPoint — az API az EGYETLEN ár/min-forrás.
 */
export const stockListItemSchema = z.object({
  materialCatalogId: z.string().uuid(),
  materialType: z.string(),
  unitOfMeasure: z.string(),
  fullPanelQuantity: z.number().int().nonnegative(),
  offcutQuantity: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  unitPrice: z.number().nonnegative(),
  reorderMin: z.number().int().nonnegative(),
});

export type StockListItem = z.infer<typeof stockListItemSchema>;

export const stockListResponseSchema = z.object({
  items: z.array(stockListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export type StockListResponse = z.infer<typeof stockListResponseSchema>;

/**
 * Summary — `GET /api/inventory/summary` (GetInventorySummaryQuery.cs).
 * `totalQuantityByUnit`: mértékegységenkénti bontás (a nyers mennyiségek
 * anyagok között nem összegezhetők biztonságosan); `totalStockValue`:
 * mennyiség × MaterialCatalog.UnitCost összege (implicit hazai pénznem).
 */
export const quantityByUnitSchema = z.object({
  unitOfMeasure: z.string(),
  quantity: z.number().int().nonnegative(),
});

export const inventorySummaryResponseSchema = z.object({
  activeMaterialTypeCount: z.number().int().nonnegative(),
  totalQuantityByUnit: z.array(quantityByUnitSchema),
  lowStockCount: z.number().int().nonnegative(),
  totalStockValue: z.number().nonnegative(),
  generatedAt: z.string(),
});

export type InventorySummaryResponse = z.infer<typeof inventorySummaryResponseSchema>;

/**
 * Offcut Schemas
 */
export const offcutListItemSchema = z.object({
  id: z.string(),
  materialCode: z.string(),
  widthMm: z.number(),
  heightMm: z.number(),
  thicknessMm: z.number(),
  volumeM3: z.number(),
  weightKg: z.number(),
  status: z.enum(WAREHOUSE_CONFIG.OFFCUT_STATUSES),
  createdAt: z.string(),
  cuttingJobId: z.string().optional().nullable(),
});

export type OffcutListItem = z.infer<typeof offcutListItemSchema>;

export const getOffcutListResponseSchema = z.object({
  offcuts: z.array(offcutListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type GetOffcutListResponse = z.infer<typeof getOffcutListResponseSchema>;

export const offcutReservationHistoryItemSchema = z.object({
  reservationId: z.string(),
  jobId: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type OffcutReservationHistoryItem = z.infer<typeof offcutReservationHistoryItemSchema>;

export const getOffcutDetailResponseSchema = offcutListItemSchema.extend({
  usedAt: z.string().optional().nullable(),
  usedInJobId: z.string().optional().nullable(),
  reservationHistory: z.array(offcutReservationHistoryItemSchema).default([]),
});

export type GetOffcutDetailResponse = z.infer<typeof getOffcutDetailResponseSchema>;

export const getOffcutStatsSummaryResponseSchema = z.object({
  totalAvailableVolumeM3: z.number(),
  totalAvailableWeightKg: z.number(),
  availableByMaterial: z.record(
    z.string(),
    z.object({
      volumeM3: z.number(),
      weightKg: z.number(),
    })
  ).default({}),
  reservedCount: z.number(),
  usedCount: z.number(),
  scrappedCount: z.number(),
});

export type GetOffcutStatsSummaryResponse = z.infer<typeof getOffcutStatsSummaryResponseSchema>;

/**
 * Offcut mutációs válaszok — ReserveOffcutResponse(ReservationId, ExpiresAt),
 * ApproveOffcutReservationResponse(Status), UseOffcutInJobResponse(Status,
 * UsedInJobId, UsedAt) — a parancs-DTO-k tükre (Commands/*).
 */
export const reserveOffcutResponseSchema = z.object({
  reservationId: z.string().uuid(),
  expiresAt: z.string(),
});

export type ReserveOffcutResponse = z.infer<typeof reserveOffcutResponseSchema>;

export const approveOffcutReservationResponseSchema = z.object({
  status: z.string(),
});

export const useOffcutResponseSchema = z.object({
  status: z.string(),
  usedInJobId: z.string().uuid(),
  usedAt: z.string(),
});

/** A reserve/use kérések jobId-ja a backendben Guid — nem-UUID input 400. */
export const offcutJobIdSchema = z.string().uuid('A munkalap-azonosítónak érvényes UUID-nak kell lennie');

/**
 * Movements & Trend Schemas
 */
export const consumptionTrendItemSchema = z.object({
  date: z.string(),
  area: z.number(),
});

export const consumptionTrendResponseSchema = z.object({
  materialType: z.string(),
  dailyData: z.array(consumptionTrendItemSchema),
  averageDailyConsumption: z.number(),
});

export type ConsumptionTrendResponse = z.infer<typeof consumptionTrendResponseSchema>;

export const recordConsumptionRequestSchema = z.object({
  materialType: z.string().min(1, 'Anyag típus kötelező'),
  thickness: z.number().positive('Vastagság kötelező'),
  area: z.number().positive('Terület kötelező'),
  panelCount: z.number().int().positive('Darabszám kötelező'),
  reason: z.string().min(1, 'Indoklás kötelező'),
  occurredAt: z.string(),
});

export type RecordConsumptionRequest = z.infer<typeof recordConsumptionRequestSchema>;

export const recordInboundRequestSchema = z.object({
  materialType: z.string().min(1, 'Anyag típus kötelező'),
  thickness: z.number().positive('Vastagság kötelező'),
  area: z.number().positive('Terület kötelező'),
  panelCount: z.number().int().positive('Darabszám kötelező'),
  reference: z.string().min(1, 'Hivatkozási szám kötelező'),
  occurredAt: z.string(),
});

export type RecordInboundRequest = z.infer<typeof recordInboundRequestSchema>;

export const movementListItemSchema = z.object({
  id: z.string(),
  materialType: z.string(),
  movementType: z.enum(WAREHOUSE_CONFIG.MOVEMENT_TYPES),
  quantity: z.number(),
  occurredAt: z.string(),
  reference: z.string(),
});

export const movementListResponseSchema = z.object({
  items: z.array(movementListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export type MovementListItem = z.infer<typeof movementListItemSchema>;
export type MovementListResponse = z.infer<typeof movementListResponseSchema>;

/**
 * Supplier Schemas
 */
export const supplierResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  leadTimeDays: z.number(),
  rating: z.number(),
  createdAt: z.string(),
});

export type SupplierResponse = z.infer<typeof supplierResponseSchema>;

/**
 * Purchase Order Schemas
 */
export const purchaseOrderListItemSchema = z.object({
  id: z.string(),
  supplierName: z.string(),
  totalAmount: z.number(),
  expectedDelivery: z.string().nullable().optional(),
  status: z.enum(WAREHOUSE_CONFIG.PO_STATUSES),
  createdAt: z.string(),
});

export type PurchaseOrderListItem = z.infer<typeof purchaseOrderListItemSchema>;

/**
 * `OrderStatusResponse` (GetOrderStatusQuery.cs) — MINDEN FSM-átmenet végpont
 * ugyanezt a friss rendelés-DTO-t adja vissza sikeres átmenet után
 * (OrderStatusResponseFactory, WORLDS-PROC-PO-FSM).
 */
export const orderStatusResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  supplierId: z.string().uuid(),
  materialType: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  currency: z.string(),
  status: z.enum(WAREHOUSE_CONFIG.PO_STATUSES),
  expectedDelivery: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type OrderStatusResponse = z.infer<typeof orderStatusResponseSchema>;

export const createPurchaseOrderRequestSchema = z.object({
  supplierId: z.string().min(1, 'Válasszon beszállítót'),
  materialType: z.string().min(1, 'Anyagtípus megadása kötelező'),
  quantity: z.number().positive('Mennyiségnek pozitívnak kell lennie'),
  unitPrice: z.number().positive('Egységárnak pozitívnak kell lennie'),
  currency: z.string().default('HUF'),
  expectedDeliveryDate: z.string().optional(),
});

export type CreatePurchaseOrderRequest = z.infer<typeof createPurchaseOrderRequestSchema>;

/**
 * `DeliverPurchaseOrderRequest` (ProcurementEndpoints.cs) — a
 * POST /orders/{id}/deliver KÖTELEZŐ törzse; a rendelés-id a route-param.
 */
export const deliverPurchaseOrderRequestSchema = z.object({
  receivedQuantity: z.number().positive('Az átvett mennyiségnek pozitívnak kell lennie'),
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
});

export type DeliverPurchaseOrderRequest = z.infer<typeof deliverPurchaseOrderRequestSchema>;

/**
 * Requisition Schemas
 */
export const requisitionLineSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  quantity: z.number(),
  estimatedUnitPrice: z.number().optional().nullable(),
  preferredSupplierId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const requisitionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  requisitionNumber: z.string(),
  source: z.string(),
  status: z.enum(WAREHOUSE_CONFIG.REQUISITION_STATUSES),
  requestedBy: z.string(),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().optional().nullable(),
  rejectedReason: z.string().optional().nullable(),
  convertedPurchaseOrderId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
  lines: z.array(requisitionLineSchema).default([]),
});

export type RequisitionDto = z.infer<typeof requisitionDtoSchema>;
