import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@spaceos/portal-core';
import { warehouseKeys } from './keys';
import { WAREHOUSE_CONFIG } from './config';
import {
  getOffcutListResponseSchema,
  getOffcutDetailResponseSchema,
  getOffcutStatsSummaryResponseSchema,
  reserveOffcutResponseSchema,
  approveOffcutReservationResponseSchema,
  useOffcutResponseSchema,
  offcutJobIdSchema,
} from './schemas';
import type {
  GetOffcutListResponse,
  GetOffcutDetailResponse,
  GetOffcutStatsSummaryResponse,
  ReserveOffcutResponse,
} from './schemas';
import { z } from 'zod';

export interface OffcutFilterParams {
  status?: string;
  materialCode?: string;
  minVolumeM3?: number;
  createdAfter?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch Offcuts List
 */
export async function getOffcutList(params: OffcutFilterParams = {}): Promise<GetOffcutListResponse> {
  return apiFetch<GetOffcutListResponse>('/api/inventory/offcuts/', {
    query: {
      status: params.status,
      materialCode: params.materialCode,
      minVolumeM3: params.minVolumeM3,
      createdAfter: params.createdAfter,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE,
    },
    schema: getOffcutListResponseSchema,
  });
}

/**
 * Fetch Offcut Detail
 */
export async function getOffcutDetail(offcutId: string): Promise<GetOffcutDetailResponse> {
  return apiFetch<GetOffcutDetailResponse>(`/api/inventory/offcuts/${offcutId}`, {
    schema: getOffcutDetailResponseSchema,
  });
}

/**
 * Fetch Offcut Stats Summary
 */
export async function getOffcutStatsSummary(): Promise<GetOffcutStatsSummaryResponse> {
  return apiFetch<GetOffcutStatsSummaryResponse>('/api/inventory/offcuts/stats/summary', {
    schema: getOffcutStatsSummaryResponseSchema,
  });
}

/**
 * Reserve Offcut — a jobId a backendben Guid (ReserveOffcutRequest), ezért a
 * kliens UUID-ként validálja küldés előtt. A válasz `reservationId`-ja a
 * VALÓDI foglalás-azonosító, amit az approve-ig át kell fűzni (nincs stub!).
 */
export async function reserveOffcut(
  { offcutId, jobId }: { offcutId: string; jobId: string },
): Promise<ReserveOffcutResponse> {
  const validJobId = offcutJobIdSchema.parse(jobId);
  return apiFetch<ReserveOffcutResponse>(`/api/inventory/offcuts/${offcutId}/reserve`, {
    method: 'POST',
    body: { jobId: validJobId },
    schema: reserveOffcutResponseSchema,
  });
}

/**
 * Approve Offcut Reservation — a reservationId KIZÁRÓLAG egy korábbi reserve
 * válaszából származhat (ApproveReservationRequest.ReservationId, Guid).
 */
export async function approveOffcutReservation(
  { offcutId, reservationId }: { offcutId: string; reservationId: string },
): Promise<{ status: string }> {
  const validReservationId = z.string().uuid('Érvénytelen foglalás-azonosító').parse(reservationId);
  return apiFetch<{ status: string }>(`/api/inventory/offcuts/${offcutId}/approve-reservation`, {
    method: 'POST',
    body: { reservationId: validReservationId },
    schema: approveOffcutReservationResponseSchema,
  });
}

/**
 * Use Offcut
 */
export async function useOffcut(
  { offcutId, jobId }: { offcutId: string; jobId: string },
): Promise<{ status: string; usedInJobId: string; usedAt: string }> {
  const validJobId = offcutJobIdSchema.parse(jobId);
  return apiFetch(`/api/inventory/offcuts/${offcutId}/use`, {
    method: 'POST',
    body: { jobId: validJobId },
    schema: useOffcutResponseSchema,
  });
}

/**
 * React Query Hooks
 */
export function useOffcutList(params: OffcutFilterParams = {}) {
  return useQuery({
    queryKey: warehouseKeys.offcutsList(params as Record<string, unknown>),
    queryFn: () => getOffcutList(params),
  });
}

export function useOffcutDetail(offcutId: string, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.offcutDetail(offcutId),
    queryFn: () => getOffcutDetail(offcutId),
    enabled: enabled && Boolean(offcutId),
  });
}

export function useOffcutStatsSummary() {
  return useQuery({
    queryKey: warehouseKeys.offcutsSummary(),
    queryFn: getOffcutStatsSummary,
  });
}

/** Offcut-mutáció utáni közös invalidálás (lista + detail + stock + summary). */
function invalidateOffcutMutationTargets(
  queryClient: ReturnType<typeof useQueryClient>,
  offcutId: string,
) {
  queryClient.invalidateQueries({ queryKey: warehouseKeys.offcuts() });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.offcutDetail(offcutId) });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() });
  queryClient.invalidateQueries({ queryKey: warehouseKeys.summary() });
}

export function useReserveOffcut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reserveOffcut,
    onSuccess: (_, variables) => invalidateOffcutMutationTargets(queryClient, variables.offcutId),
  });
}

export function useApproveOffcutReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveOffcutReservation,
    onSuccess: (_, variables) => invalidateOffcutMutationTargets(queryClient, variables.offcutId),
  });
}

export function useUseOffcut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useOffcut,
    onSuccess: (_, variables) => invalidateOffcutMutationTargets(queryClient, variables.offcutId),
  });
}
