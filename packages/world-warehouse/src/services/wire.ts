import type { OffcutStatus, OffcutReservationStatus, PurchaseOrderStatus, RequisitionStatus } from './config';
import type { Tone } from '@spaceos/portal-ui';

/**
 * Purchase Order Status Labels (HU)
 */
export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  Draft: 'Piszkozat',
  Submitted: 'Beküldve',
  Confirmed: 'Visszaigazolva',
  Shipped: 'Szállítás alatt',
  Delivered: 'Leszállítva',
  Cancelled: 'Törölve',
};

export const PO_STATUS_TONES: Record<PurchaseOrderStatus, Tone> = {
  Draft: 'neutral',
  Submitted: 'info',
  Confirmed: 'warn',
  Shipped: 'progress',
  Delivered: 'success',
  Cancelled: 'danger',
};

/**
 * PO FSM-akciók végleges magyar feliratai (L-3c) — a gomb-felirat és a
 * toast-üzenet közös forrása.
 */
export const PO_ACTION_LABELS = {
  submit: 'Beküldés',
  confirm: 'Visszaigazolás',
  ship: 'Szállítás indítása',
  deliver: 'Leszállítás rögzítése',
  cancel: 'Megrendelés törlése',
} as const;

/**
 * Offcut Status Labels (HU)
 */
export const OFFCUT_STATUS_LABELS: Record<OffcutStatus, string> = {
  Available: 'Elérhető',
  Reserved: 'Lefoglalva',
  Used: 'Felhasználva',
  Waste: 'Selejt (régi)',
  Scrapped: 'Selejtezve',
};

export const OFFCUT_STATUS_TONES: Record<OffcutStatus, Tone> = {
  Available: 'success',
  Reserved: 'warn',
  Used: 'progress',
  Waste: 'neutral',
  Scrapped: 'neutral',
};

/**
 * Offcut Reservation Status Labels (HU)
 */
export const OFFCUT_RESERVATION_STATUS_LABELS: Record<OffcutReservationStatus, string> = {
  Pending: 'Jóváhagyásra vár',
  Approved: 'Jóváhagyva',
  Cancelled: 'Elutasítva',
};

/**
 * Requisition Status Labels (HU)
 */
export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  Draft: 'Piszkozat',
  Approved: 'Jóváhagyva',
  ConvertedToPO: 'Megrendelve',
  Rejected: 'Elutasítva',
};

export const REQUISITION_STATUS_TONES: Record<RequisitionStatus, Tone> = {
  Draft: 'neutral',
  Approved: 'success',
  ConvertedToPO: 'progress',
  Rejected: 'danger',
};
