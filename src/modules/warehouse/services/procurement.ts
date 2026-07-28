import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../services/apiClient';
import { warehouseKeys } from './keys';
import {
  supplierResponseSchema,
  purchaseOrderListItemSchema,
  createPurchaseOrderRequestSchema,
  deliverPurchaseOrderRequestSchema,
  orderStatusResponseSchema,
  requisitionDtoSchema,
} from './schemas';
import type {
  SupplierResponse,
  PurchaseOrderListItem,
  CreatePurchaseOrderRequest,
  DeliverPurchaseOrderRequest,
  OrderStatusResponse,
  RequisitionDto,
} from './schemas';
import { z } from 'zod';

/** A törzs nélküli FSM-átmenetek (a deliver KÜLÖN: kötelező body-ja van). */
export type BodylessPoAction = 'submit' | 'confirm' | 'ship' | 'cancel';

/**
 * Fetch Suppliers List
 */
export async function getSuppliers(): Promise<SupplierResponse[]> {
  return apiFetch<SupplierResponse[]>('/api/procurement/suppliers', {
    schema: z.array(supplierResponseSchema),
  });
}

/**
 * Fetch Purchase Orders List
 */
export async function getPurchaseOrders(): Promise<PurchaseOrderListItem[]> {
  return apiFetch<PurchaseOrderListItem[]>('/api/procurement/orders', {
    schema: z.array(purchaseOrderListItemSchema),
  });
}

/**
 * Create Purchase Order
 */
export async function createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<{ id: string }> {
  const validPayload = createPurchaseOrderRequestSchema.parse(request);
  return apiFetch<{ id: string }>('/api/procurement/orders', {
    method: 'POST',
    body: validPayload,
    schema: z.object({ id: z.string() }),
  });
}

/**
 * Fetch Requisitions List
 */
export async function getRequisitions(): Promise<RequisitionDto[]> {
  return apiFetch<RequisitionDto[]>('/api/procurement/requisitions/', {
    schema: z.array(requisitionDtoSchema),
  });
}

/**
 * PO FSM-átmenetek (WORLDS-PROC-PO-FSM):
 *   POST /api/procurement/orders/{id}/{submit|confirm|ship|cancel}
 * Siker: friss OrderStatusResponse; tiltott átmenet: Result.Conflict → 409
 * (ResultToHttp.cs); ismeretlen id: 404.
 */
export async function transitionPurchaseOrder(
  { id, action }: { id: string; action: BodylessPoAction },
): Promise<OrderStatusResponse> {
  return apiFetch<OrderStatusResponse>(`/api/procurement/orders/${id}/${action}`, {
    method: 'POST',
    body: {},
    schema: orderStatusResponseSchema,
  });
}

/**
 * Deliver — POST /api/procurement/orders/{id}/deliver. A backend
 * `DeliverPurchaseOrderRequest`-je KÖTELEZŐ `receivedQuantity`-t vár
 * (ProcurementEndpoints.cs); hiányzó/nem-pozitív mennyiség 400.
 */
export async function deliverPurchaseOrder(
  { id, ...request }: { id: string } & DeliverPurchaseOrderRequest,
): Promise<OrderStatusResponse> {
  const validPayload = deliverPurchaseOrderRequestSchema.parse(request);
  return apiFetch<OrderStatusResponse>(`/api/procurement/orders/${id}/deliver`, {
    method: 'POST',
    body: validPayload,
    schema: orderStatusResponseSchema,
  });
}

/**
 * React Query Hooks
 */
export function useSuppliers() {
  return useQuery({
    queryKey: warehouseKeys.suppliers(),
    queryFn: getSuppliers,
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: warehouseKeys.purchaseOrders(),
    queryFn: getPurchaseOrders,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.purchaseOrders() });
    },
  });
}

export function useRequisitions() {
  return useQuery({
    queryKey: warehouseKeys.requisitions(),
    queryFn: getRequisitions,
  });
}

/** submit/confirm/ship/cancel — csak a PO-lista + detail érintett. */
export function useTransitionPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitionPurchaseOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.purchaseOrderDetail(variables.id) });
    },
  });
}

/**
 * Deliver — Rule-6: a szállítás inventory-inboundot vált ki a backendben
 * (RecordDeliveryCommandHandler sync path), ezért a PO-lista + order-detail
 * MELLETT a stock, summary, movements ÉS trend is invalidálandó.
 */
export function useDeliverPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliverPurchaseOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.purchaseOrderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movementsRoot() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.trends() });
    },
  });
}
