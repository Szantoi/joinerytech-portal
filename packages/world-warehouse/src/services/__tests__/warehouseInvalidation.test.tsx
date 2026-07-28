import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { warehouseHandlers, warehouseMockDb } from '../../mocks';
import { useDeliverPurchaseOrder, useTransitionPurchaseOrder } from '../procurement';
import { useRecordInbound } from '../stock';
import { warehouseKeys } from '../keys';

/**
 * Rule-6 invalidációs tesztek — a deliver a backendben inventory-inboundot
 * vált ki, ezért a PO-lista/detail MELLETT a stock + summary + movements +
 * trend cache-nek is frissülnie kell. A sima átmenetek NEM nyúlnak az
 * inventory cache-hez (szűkebb invalidálás).
 */

const server = setupServer(...warehouseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
beforeEach(() => warehouseMockDb.reset());

const PO_CONFIRMED = 'd1111111-1111-4111-8111-111111111111';
const PO_SUBMITTED = 'd2222222-2222-4222-8222-222222222222';

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, invalidateSpy, wrapper };
}

function invalidatedKeys(spy: { mock: { calls: unknown[][] } }): unknown[] {
  return spy.mock.calls.map((call: unknown[]) => (call[0] as { queryKey: unknown }).queryKey);
}

describe('Rule-6 — deliver utáni cache-invalidálás', () => {
  it('useDeliverPurchaseOrder: PO-lista + detail + stock + summary + movements + trend', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useDeliverPurchaseOrder(), { wrapper });

    await result.current.mutateAsync({ id: PO_CONFIRMED, receivedQuantity: 5 });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContainEqual(warehouseKeys.purchaseOrders());
    expect(keys).toContainEqual(warehouseKeys.purchaseOrderDetail(PO_CONFIRMED));
    expect(keys).toContainEqual(warehouseKeys.stock());
    expect(keys).toContainEqual(warehouseKeys.summary());
    expect(keys).toContainEqual(warehouseKeys.movementsRoot());
    expect(keys).toContainEqual(warehouseKeys.trends());
  });

  it('useTransitionPurchaseOrder (confirm): CSAK a PO-cache-t invalidálja', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useTransitionPurchaseOrder(), { wrapper });

    await result.current.mutateAsync({ id: PO_SUBMITTED, action: 'confirm' });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContainEqual(warehouseKeys.purchaseOrders());
    expect(keys).toContainEqual(warehouseKeys.purchaseOrderDetail(PO_SUBMITTED));
    expect(keys).not.toContainEqual(warehouseKeys.stock());
    expect(keys).not.toContainEqual(warehouseKeys.movementsRoot());
  });

  it('a movements-invalidáció prefixe tényleg illeszkedik a szűrt movement-kulcsokra', async () => {
    const { queryClient, wrapper } = setup();
    // Egy szűrt movements-lekérdezés a cache-ben:
    queryClient.setQueryData(warehouseKeys.movements({ type: 'Inbound', page: 1, pageSize: 20 }), {
      items: [], total: 0, page: 1, pageSize: 20,
    });
    const state = () =>
      queryClient.getQueryState(warehouseKeys.movements({ type: 'Inbound', page: 1, pageSize: 20 }));
    expect(state()?.isInvalidated).toBe(false);

    const { result } = renderHook(() => useDeliverPurchaseOrder(), { wrapper });
    await result.current.mutateAsync({ id: PO_CONFIRMED, receivedQuantity: 3 });

    await waitFor(() => expect(state()?.isInvalidated).toBe(true));
  });

  it('useRecordInbound: stock + summary + trend + movements invalidálás', async () => {
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useRecordInbound(), { wrapper });

    await result.current.mutateAsync({
      materialType: 'MDF 18mm', thickness: 18, area: 5.796, panelCount: 2,
      reference: 'DEL-1', occurredAt: new Date().toISOString(),
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContainEqual(warehouseKeys.stock());
    expect(keys).toContainEqual(warehouseKeys.summary());
    expect(keys).toContainEqual(warehouseKeys.trends());
    expect(keys).toContainEqual(warehouseKeys.movementsRoot());
  });
});
