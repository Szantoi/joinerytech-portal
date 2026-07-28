import type { StockListItem, OffcutListItem, SupplierResponse, RequisitionDto, MovementListItem } from '../services/schemas';
import type { PurchaseOrderStatus } from '../services/config';

/**
 * Warehouse mock seed — a backend read-modellek ALAKHŰ seed-adatai.
 * A stock a GetStockListQuery StockListItem-jét tükrözi (materialCatalogId +
 * unitPrice/reorderMin a MaterialCatalogból — nem kliens-konfigból!).
 */

export const SEED_STOCK_ITEMS: StockListItem[] = [
  {
    materialCatalogId: 'f1111111-1111-4111-8111-111111111111',
    materialType: 'MDF 18mm',
    unitOfMeasure: 'db',
    fullPanelQuantity: 42,
    offcutQuantity: 14,
    totalQuantity: 56,
    unitPrice: 12000,
    reorderMin: 20,
  },
  {
    materialCatalogId: 'f2222222-2222-4222-8222-222222222222',
    materialType: 'Tölgy furnér 19mm',
    unitOfMeasure: 'db',
    fullPanelQuantity: 18,
    offcutQuantity: 6,
    totalQuantity: 24,
    unitPrice: 28500,
    reorderMin: 10,
  },
  {
    materialCatalogId: 'f3333333-3333-4333-8333-333333333333',
    materialType: 'Bükk tömörfa 25mm',
    unitOfMeasure: 'db',
    fullPanelQuantity: 25,
    offcutQuantity: 8,
    totalQuantity: 33,
    unitPrice: 22000,
    reorderMin: 10,
  },
  {
    // Szándékosan alacsony készletű tétel (totalQuantity <= reorderMin) —
    // a summary lowStockCount KPI-nak van valós, determinisztikus forrása.
    materialCatalogId: 'f4444444-4444-4444-8444-444444444444',
    materialType: 'Rétegelt lemez 15mm',
    unitOfMeasure: 'db',
    fullPanelQuantity: 8,
    offcutQuantity: 2,
    totalQuantity: 10,
    unitPrice: 9800,
    reorderMin: 12,
  },
];

export const SEED_OFFCUTS: OffcutListItem[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    materialCode: 'MDF 18mm',
    widthMm: 1200,
    heightMm: 800,
    thicknessMm: 18,
    volumeM3: 0.01728,
    weightKg: 12.5,
    status: 'Available',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    cuttingJobId: null,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    materialCode: 'Tölgy furnér 19mm',
    widthMm: 1500,
    heightMm: 600,
    thicknessMm: 19,
    volumeM3: 0.0171,
    weightKg: 13.0,
    status: 'Reserved',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    cuttingJobId: 'c1111111-1111-4111-8111-111111111111',
  },
  {
    id: 'b3333333-3333-4333-8333-333333333333',
    materialCode: 'Bükk tömörfa 25mm',
    widthMm: 900,
    heightMm: 500,
    thicknessMm: 25,
    volumeM3: 0.01125,
    weightKg: 8.5,
    status: 'Used',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    cuttingJobId: 'c2222222-2222-4222-8222-222222222222',
  },
];

/** A Reserved seed-offcut jóváhagyott foglalása (reservationHistory-forrás). */
export interface SeedReservation {
  reservationId: string;
  offcutId: string;
  jobId: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
  createdAt: string;
  expiresAt: string;
}

export const SEED_RESERVATIONS: SeedReservation[] = [
  {
    reservationId: 'e1111111-1111-4111-8111-111111111111',
    offcutId: 'b2222222-2222-4222-8222-222222222222',
    jobId: 'c1111111-1111-4111-8111-111111111111',
    status: 'Approved',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
];

export const SEED_MOVEMENTS: MovementListItem[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    materialType: 'MDF 18mm',
    movementType: 'Inbound',
    quantity: 20,
    reference: 'BEV-2026-001',
    occurredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'a2222222-2222-4222-8222-222222222222',
    materialType: 'Tölgy furnér 19mm',
    movementType: 'Consumption',
    quantity: 4,
    reference: 'WO-2026-042',
    occurredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    materialType: 'MDF 18mm',
    movementType: 'Offcut',
    quantity: 2,
    reference: 'CUT-JOB-88',
    occurredAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const SEED_SUPPLIERS: SupplierResponse[] = [
  {
    id: 'a1111111-2222-4333-8444-555555555551',
    name: 'Jácint Faipar Kft.',
    email: 'rendeles@jacintfaipar.hu',
    phone: '+36 1 234 5678',
    address: '1107 Budapest, Mázsa utca 9.',
    leadTimeDays: 3,
    rating: 4.8,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'a1111111-2222-4333-8444-555555555552',
    name: 'Erdőstér Kft.',
    email: 'info@erdoster.hu',
    phone: '+36 20 987 6543',
    address: '9024 Győr, Ipari út 12.',
    leadTimeDays: 5,
    rating: 4.5,
    createdAt: '2026-02-01T09:00:00Z',
  },
];

/**
 * Teljes PO-rekord a mockban — a lista-projekció (PurchaseOrderListResponse)
 * ÉS az átmenet-válasz (OrderStatusResponse) közös háttere: supplierId-ból
 * oldódik fel a név, az összeg mennyiség × egységár (L-3a/L-4).
 */
export interface SeedPurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  materialType: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  status: PurchaseOrderStatus;
  expectedDelivery: string | null;
  createdAt: string;
}

// Zod v4 szigorú UUID-mintát validál (verzió-nibble kötelező) — a tenant-id
// ezért szabályos v4-alakú.
export const SEED_TENANT_ID = '11111111-1111-4111-8111-111111111111';

export const SEED_PURCHASE_ORDERS: SeedPurchaseOrder[] = [
  {
    id: 'd1111111-1111-4111-8111-111111111111',
    tenantId: SEED_TENANT_ID,
    supplierId: 'a1111111-2222-4333-8444-555555555551',
    materialType: 'MDF 18mm',
    quantity: 40,
    unitPrice: 12000,
    currency: 'HUF',
    status: 'Confirmed',
    expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'd2222222-2222-4222-8222-222222222222',
    tenantId: SEED_TENANT_ID,
    supplierId: 'a1111111-2222-4333-8444-555555555552',
    materialType: 'Tölgy furnér 19mm',
    quantity: 25,
    unitPrice: 30000,
    currency: 'HUF',
    status: 'Submitted',
    expectedDelivery: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    // Draft PO — a backendben ilyet kizárólag a rekvizíció→PO konverzió hagy
    // (a direkt create auto-submitál); expectedDelivery: null a nullable ág
    // hű fedésére (a backend nem talál ki dátumot).
    id: 'd3333333-3333-4333-8333-333333333333',
    tenantId: SEED_TENANT_ID,
    supplierId: 'a1111111-2222-4333-8444-555555555551',
    materialType: 'Bükk tömörfa 25mm',
    quantity: 12,
    unitPrice: 45000,
    currency: 'HUF',
    status: 'Draft',
    expectedDelivery: null,
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
];

export const SEED_REQUISITIONS: RequisitionDto[] = [
  {
    id: 'ee111111-1111-4111-8111-111111111111',
    tenantId: SEED_TENANT_ID,
    requisitionNumber: 'REQ-2026-001',
    source: 'ReorderAlert',
    status: 'Approved',
    requestedBy: 'Szabó Péter',
    approvedBy: 'Kovács Ferenc',
    approvedAt: new Date(Date.now() - 86400000).toISOString(),
    rejectedReason: null,
    convertedPurchaseOrderId: null,
    notes: 'MDF alapkészlet utánpótlás',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lines: [
      {
        id: 'ee111111-1111-4111-8111-222222222222',
        materialCode: 'MDF 18mm',
        quantity: 20,
        estimatedUnitPrice: 12000,
        preferredSupplierId: 'a1111111-2222-4333-8444-555555555551',
        notes: '2800x2070mm',
      },
    ],
  },
];
