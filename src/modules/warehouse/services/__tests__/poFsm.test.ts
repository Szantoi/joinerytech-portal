import { describe, it, expect } from 'vitest';
import { canTransition, transitionBlockReason } from '../../../../services/fsmGuards';
import {
  PO_FSM, PO_MAIN_PATH, PO_ACTIVE_STATUSES,
  isPurchaseOrderActive, deliverQuantityBlockReason,
} from '../poFsm';
import { PO_STATUS_LABELS } from '../wire';
import { WAREHOUSE_CONFIG } from '../config';
import type { PurchaseOrderStatus } from '../config';

/**
 * PO FSM-tükör unit tesztek — a PurchaseOrder.cs aggregátum + a deliver
 * végpont (RecordDeliveryCommandHandler Confirmed→auto-ship áthidalás)
 * átmenet-szabályainak táblabizonyítása. A UI gomb-láthatóság és az MSW
 * 409-guard UGYANEZT a táblát futtatja.
 */

describe('PO_FSM — elérhető átmenetek (PurchaseOrder.cs tükör)', () => {
  it('submit: Draft→Submitted', () => {
    expect(canTransition(PO_FSM, 'submit', 'Draft')).toBe(true);
    expect(PO_FSM.submit.to).toBe('Submitted');
  });

  it('confirm: Submitted→Confirmed', () => {
    expect(canTransition(PO_FSM, 'confirm', 'Submitted')).toBe(true);
    expect(PO_FSM.confirm.to).toBe('Confirmed');
  });

  it('ship: Confirmed→Shipped', () => {
    expect(canTransition(PO_FSM, 'ship', 'Confirmed')).toBe(true);
    expect(PO_FSM.ship.to).toBe('Shipped');
  });

  it('deliver: Shipped→Delivered ÉS Confirmed→Delivered (auto-MarkShipped áthidalás)', () => {
    expect(canTransition(PO_FSM, 'deliver', 'Shipped')).toBe(true);
    expect(canTransition(PO_FSM, 'deliver', 'Confirmed')).toBe(true);
    expect(PO_FSM.deliver.to).toBe('Delivered');
  });

  it('cancel: minden nem-terminális állapotból', () => {
    for (const status of ['Draft', 'Submitted', 'Confirmed', 'Shipped'] as const) {
      expect(canTransition(PO_FSM, 'cancel', status)).toBe(true);
    }
  });
});

describe('PO_FSM — tiltott átmenetek (409-guard forrása)', () => {
  it('submit csak Draft-ból indítható', () => {
    for (const status of ['Submitted', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as const) {
      expect(canTransition(PO_FSM, 'submit', status)).toBe(false);
    }
  });

  it('confirm csak Submitted-ből indítható', () => {
    for (const status of ['Draft', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as const) {
      expect(canTransition(PO_FSM, 'confirm', status)).toBe(false);
    }
  });

  it('ship csak Confirmed-ből indítható', () => {
    for (const status of ['Draft', 'Submitted', 'Shipped', 'Delivered', 'Cancelled'] as const) {
      expect(canTransition(PO_FSM, 'ship', status)).toBe(false);
    }
  });

  it('deliver tiltott Draft/Submitted/Delivered/Cancelled állapotból', () => {
    for (const status of ['Draft', 'Submitted', 'Delivered', 'Cancelled'] as const) {
      expect(canTransition(PO_FSM, 'deliver', status)).toBe(false);
    }
  });

  it('cancel tiltott terminális (Delivered/Cancelled) állapotból', () => {
    expect(canTransition(PO_FSM, 'cancel', 'Delivered')).toBe(false);
    expect(canTransition(PO_FSM, 'cancel', 'Cancelled')).toBe(false);
  });

  it('terminális állapotból (Delivered/Cancelled) SEMMILYEN akció nem indítható', () => {
    for (const action of Object.keys(PO_FSM)) {
      expect(canTransition(PO_FSM, action, 'Delivered')).toBe(false);
      expect(canTransition(PO_FSM, action, 'Cancelled')).toBe(false);
    }
  });

  it('transitionBlockReason magyar indokot ad tiltott átmenetre, undefined-et engedélyezettre', () => {
    expect(transitionBlockReason(PO_FSM, 'submit', 'Draft', PO_STATUS_LABELS)).toBeUndefined();
    const reason = transitionBlockReason(PO_FSM, 'submit', 'Delivered', PO_STATUS_LABELS);
    expect(reason).toContain('Piszkozat');
    expect(reason).toContain('Leszállítva');
  });
});

describe('PO segéd-guardok', () => {
  it('PO_MAIN_PATH a teljes sikeres láncot fedi', () => {
    expect(PO_MAIN_PATH).toEqual(['Draft', 'Submitted', 'Confirmed', 'Shipped', 'Delivered']);
  });

  it('isPurchaseOrderActive: nem-terminális true, Delivered/Cancelled false', () => {
    for (const status of PO_ACTIVE_STATUSES) {
      expect(isPurchaseOrderActive(status)).toBe(true);
    }
    expect(isPurchaseOrderActive('Delivered')).toBe(false);
    expect(isPurchaseOrderActive('Cancelled')).toBe(false);
  });

  it('a tábla minden státusz-hivatkozása a konfigurált PO_STATUSES-ból való', () => {
    const known = WAREHOUSE_CONFIG.PO_STATUSES as readonly PurchaseOrderStatus[];
    for (const rule of Object.values(PO_FSM)) {
      expect(known).toContain(rule.to);
      for (const from of rule.from) {
        expect(known).toContain(from);
      }
    }
  });

  it('deliverQuantityBlockReason: nem-pozitív/NaN mennyiség blokkol, pozitív nem', () => {
    expect(deliverQuantityBlockReason(0)).toBeDefined();
    expect(deliverQuantityBlockReason(-3)).toBeDefined();
    expect(deliverQuantityBlockReason(Number.NaN)).toBeDefined();
    expect(deliverQuantityBlockReason(12)).toBeUndefined();
    expect(deliverQuantityBlockReason(0.5)).toBeUndefined();
  });
});
