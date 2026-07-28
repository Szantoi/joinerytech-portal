/**
 * Warehouse Module Configuration & Constants
 */

export const WAREHOUSE_CONFIG = {
  // Pagination defaults — a backend InventoryEndpoints [1, MaxPageSize]
  // lapozási kontraktusának tükre (pageSize a sávon kívül → 400, nem clamp).
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Default material for the consumption-trend query (the backend trend
  // endpoint itself defaults to this material when none is given).
  DEFAULT_MATERIAL_TYPE: 'MDF 18mm',

  // The inventory read-model does not expose material thickness/panel area.
  // Keep the UI's selectable material metadata in one configuration source so
  // mutation payloads never reuse MDF dimensions for a different selected
  // material. ⚠ Price/reorder data is NOT kept here — unitPrice/reorderMin
  // come exclusively from the GET /api/inventory/stock read model.
  MATERIALS: [
    { value: 'MDF 18mm', label: 'MDF 18mm (2800x2070)', thicknessMm: 18, panelAreaM2: 5.796 },
    { value: 'Tölgy furnér 19mm', label: 'Tölgy furnér 19mm (2800x2070)', thicknessMm: 19, panelAreaM2: 5.796 },
    { value: 'Bükk tömörfa 25mm', label: 'Bükk tömörfa 25mm (2500x1250)', thicknessMm: 25, panelAreaM2: 3.125 },
    { value: 'Rétegelt lemez 15mm', label: 'Rétegelt lemez 15mm (2500x1250)', thicknessMm: 15, panelAreaM2: 3.125 },
  ] as const,

  // Offcut warning & threshold settings
  MIN_VOLUME_M3: 0.001,

  // Movement types (Backend MovementType canonical wire names — string tag;
  // Scrap-nak ma nincs írója a backendben, de az enum része, ezért a
  // lista-parse nem bukhat el rajta)
  MOVEMENT_TYPES: ['Inbound', 'Consumption', 'Offcut', 'Scrap'] as const,

  // Purchase Order FSM Statuses (Backend PurchaseOrderStatus canonical wire names)
  PO_STATUSES: ['Draft', 'Submitted', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as const,

  // Offcut Statuses (Backend OffcutStatus canonical wire names; a Waste
  // legacy érték — új írója nincs, de egy régi sor nem buktathatja a parse-t)
  OFFCUT_STATUSES: ['Available', 'Reserved', 'Used', 'Waste', 'Scrapped'] as const,

  // Offcut Reservation Statuses
  OFFCUT_RESERVATION_STATUSES: ['Pending', 'Approved', 'Cancelled'] as const,

  // Requisition Statuses
  REQUISITION_STATUSES: ['Draft', 'Approved', 'ConvertedToPO', 'Rejected'] as const,
};

export type PurchaseOrderStatus = (typeof WAREHOUSE_CONFIG.PO_STATUSES)[number];
export type OffcutStatus = (typeof WAREHOUSE_CONFIG.OFFCUT_STATUSES)[number];
export type OffcutReservationStatus = (typeof WAREHOUSE_CONFIG.OFFCUT_RESERVATION_STATUSES)[number];
export type RequisitionStatus = (typeof WAREHOUSE_CONFIG.REQUISITION_STATUSES)[number];
export type MovementType = (typeof WAREHOUSE_CONFIG.MOVEMENT_TYPES)[number];
export type WarehouseMaterial = (typeof WAREHOUSE_CONFIG.MATERIALS)[number];

export function getWarehouseMaterial(materialType: string): WarehouseMaterial {
  return WAREHOUSE_CONFIG.MATERIALS.find((material) => material.value === materialType)
    ?? WAREHOUSE_CONFIG.MATERIALS[0];
}
