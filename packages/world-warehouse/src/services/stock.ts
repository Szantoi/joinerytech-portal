import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@spaceos/portal-core';
import { warehouseKeys } from './keys';
import { WAREHOUSE_CONFIG } from './config';
import {
  stockListResponseSchema,
  inventorySummaryResponseSchema,
  consumptionTrendResponseSchema,
  recordConsumptionRequestSchema,
  recordInboundRequestSchema,
  movementListResponseSchema,
} from './schemas';
import type {
  StockListResponse,
  InventorySummaryResponse,
  ConsumptionTrendResponse,
  RecordConsumptionRequest,
  RecordInboundRequest,
  MovementListResponse,
} from './schemas';
import type { MovementType } from './config';

export type StockListFilter = {
  materialType?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Paginated stock read model — `GET /api/inventory/stock`
 * (GetStockListQuery.cs / StockListResponse). unitPrice/reorderMin kizárólag
 * innen jön (MaterialCatalog.UnitCost/ReorderPoint), nem kliens-konfigból.
 */
export async function getStockList(filters: StockListFilter = {}): Promise<StockListResponse> {
  return apiFetch<StockListResponse>('/api/inventory/stock', {
    query: {
      materialType: filters.materialType,
      q: filters.q,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE,
    },
    schema: stockListResponseSchema,
  });
}

/**
 * Warehouse KPI summary — `GET /api/inventory/summary`
 * (GetInventorySummaryQuery.cs / InventorySummaryResponse).
 */
export async function getInventorySummary(): Promise<InventorySummaryResponse> {
  return apiFetch<InventorySummaryResponse>('/api/inventory/summary', {
    schema: inventorySummaryResponseSchema,
  });
}

/**
 * Fetch Consumption Trend
 */
export async function getConsumptionTrend(
  materialType: string = WAREHOUSE_CONFIG.DEFAULT_MATERIAL_TYPE,
  from?: string,
  to?: string
): Promise<ConsumptionTrendResponse> {
  return apiFetch<ConsumptionTrendResponse>('/api/inventory/trend', {
    query: { materialType, from, to },
    schema: consumptionTrendResponseSchema,
  });
}

/**
 * Record Material Consumption
 */
export async function recordConsumption(request: RecordConsumptionRequest): Promise<void> {
  const validPayload = recordConsumptionRequestSchema.parse(request);
  await apiFetch('/api/inventory/movements/consumption', {
    method: 'POST',
    body: validPayload,
  });
}

/**
 * Record Material Inbound
 */
export async function recordInbound(request: RecordInboundRequest): Promise<void> {
  const validPayload = recordInboundRequestSchema.parse(request);
  await apiFetch('/api/inventory/movements/inbound', {
    method: 'POST',
    body: validPayload,
  });
}

export type MovementFilter = {
  materialType?: string;
  type?: MovementType;
  page?: number;
  pageSize?: number;
};

/** Fetch the backend-owned, paginated append-only inventory movement log. */
export async function getMovements(filters: MovementFilter = {}): Promise<MovementListResponse> {
  return apiFetch<MovementListResponse>('/api/inventory/movements', {
    query: filters,
    schema: movementListResponseSchema,
  });
}

/**
 * React Query Hooks
 */
export function useStockList(filters: StockListFilter = {}) {
  return useQuery({
    queryKey: warehouseKeys.stockList(filters as Record<string, unknown>),
    queryFn: () => getStockList(filters),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: warehouseKeys.summary(),
    queryFn: getInventorySummary,
  });
}

export function useConsumptionTrend(
  materialType: string = WAREHOUSE_CONFIG.DEFAULT_MATERIAL_TYPE,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: warehouseKeys.trend(materialType, from, to),
    queryFn: () => getConsumptionTrend(materialType, from, to),
  });
}

export function useMovements(filters: MovementFilter = {}) {
  return useQuery({
    queryKey: warehouseKeys.movements(filters),
    queryFn: () => getMovements(filters),
  });
}

/** Készlet-mutáció utáni közös invalidálás (stock + summary + trend + movements). */
function invalidateStockMutationTargets(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.summary() });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.trends() });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.movementsRoot() });
}

export function useRecordConsumption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordConsumption,
    onSuccess: () => invalidateStockMutationTargets(queryClient),
  });
}

export function useRecordInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordInbound,
    onSuccess: () => invalidateStockMutationTargets(queryClient),
  });
}
