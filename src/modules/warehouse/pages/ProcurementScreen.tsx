import React, { useRef, useState } from 'react';
import { Card, Button, Input, SelectField, StatusPill, DataTable, QueryGate, useToast } from '../../../components/ui';
import { useFocusTrap } from '../../../components/ui/hooks/useFocusTrap';
import { useInertBackground } from '../../../components/ui/hooks/useInertBackground';
import type { DataTableColumn } from '../../../components/ui/dataTable.types';
import {
  usePurchaseOrders,
  useSuppliers,
  useRequisitions,
  useCreatePurchaseOrder,
  useTransitionPurchaseOrder,
  useDeliverPurchaseOrder,
  PO_FSM,
  deliverQuantityBlockReason,
  warehouseErrorMessage,
  WAREHOUSE_CONFIG,
  PO_ACTION_LABELS,
  PO_STATUS_LABELS,
  PO_STATUS_TONES,
  REQUISITION_STATUS_LABELS,
  REQUISITION_STATUS_TONES,
} from '../services';
import type { PurchaseOrderListItem, BodylessPoAction } from '../services';
import { canTransition } from '../../../services/fsmGuards';

/**
 * Beszerzés képernyő — a PO-átmenetgombok láthatóságát a services/poFsm.ts
 * KÖZÖS PO_FSM táblája dönti el (ugyanaz a tábla adja az MSW 409-guardját).
 * A deliver a backend kötelező DeliverPurchaseOrderRequest törzsét küldi
 * (receivedQuantity UI-inputból — P0-4).
 */
export const ProcurementScreen: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState<string>(WAREHOUSE_CONFIG.DEFAULT_MATERIAL_TYPE);
  const [quantity, setQuantity] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(12000);
  const createDialogRef = useRef<HTMLDivElement>(null);

  // Deliver modal state (P0-4: kötelező receivedQuantity)
  const [deliverPoId, setDeliverPoId] = useState<string | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(1);
  const [deliverNotes, setDeliverNotes] = useState<string>('');
  const deliverDialogRef = useRef<HTMLDivElement>(null);

  const poQuery = usePurchaseOrders();
  const supplierQuery = useSuppliers();
  const reqQuery = useRequisitions();

  const createPoMutation = useCreatePurchaseOrder();
  const transitionMutation = useTransitionPurchaseOrder();
  const deliverMutation = useDeliverPurchaseOrder();

  const { addToast } = useToast();

  useInertBackground(createDialogRef, isCreateOpen);
  useFocusTrap(createDialogRef, isCreateOpen);
  useInertBackground(deliverDialogRef, Boolean(deliverPoId));
  useFocusTrap(deliverDialogRef, Boolean(deliverPoId));

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      addToast('Válasszon beszállítót', 'error');
      return;
    }

    try {
      await createPoMutation.mutateAsync({
        supplierId: selectedSupplierId,
        materialType,
        quantity,
        unitPrice,
        currency: 'HUF',
      });
      addToast('Megrendelés sikeresen létrehozva', 'success');
      setIsCreateOpen(false);
    } catch (error) {
      addToast(warehouseErrorMessage(error, 'Hiba a megrendelés létrehozása során'), 'error');
    }
  };

  const handleFsmTransition = async (id: string, action: BodylessPoAction) => {
    try {
      await transitionMutation.mutateAsync({ id, action });
      addToast(`PO állapot frissítve: ${PO_ACTION_LABELS[action]}`, 'success');
    } catch (error) {
      addToast(warehouseErrorMessage(error, 'Hiba az állapotátmenet során'), 'error');
    }
  };

  const openDeliverModal = (id: string) => {
    setDeliverPoId(id);
    setReceivedQuantity(1);
    setDeliverNotes('');
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverPoId) return;
    try {
      await deliverMutation.mutateAsync({
        id: deliverPoId,
        receivedQuantity,
        notes: deliverNotes || undefined,
      });
      addToast('Leszállítás rögzítve (Delivered)', 'success');
      setDeliverPoId(null);
    } catch (error) {
      addToast(warehouseErrorMessage(error, 'Hiba a leszállítás rögzítése során'), 'error');
    }
  };

  const columns: DataTableColumn<PurchaseOrderListItem>[] = [
    {
      key: 'supplierName',
      header: 'Beszállító',
      render: (row) => <span className="font-medium text-text-main dark:text-text-main-dark">{row.supplierName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Összeg',
      render: (row) => `${row.totalAmount.toLocaleString('hu-HU')} Ft`,
    },
    {
      key: 'expectedDelivery',
      header: 'Várható szállítás',
      render: (row) => row.expectedDelivery || '—',
    },
    {
      key: 'status',
      header: 'Státusz',
      render: (row) => (
        <StatusPill
          label={PO_STATUS_LABELS[row.status] || row.status}
          tone={PO_STATUS_TONES[row.status] || 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'FSM Állapotátmenetek',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {/* Gomb-láthatóság: a PO_FSM tábla dönt (poFsm.ts — egy igazságforrás az MSW guarddal) */}
          {canTransition(PO_FSM, 'submit', row.status) && (
            <Button variant="secondary" size="sm" onClick={() => handleFsmTransition(row.id, 'submit')}>
              {PO_ACTION_LABELS.submit}
            </Button>
          )}
          {canTransition(PO_FSM, 'confirm', row.status) && (
            <Button variant="secondary" size="sm" onClick={() => handleFsmTransition(row.id, 'confirm')}>
              {PO_ACTION_LABELS.confirm}
            </Button>
          )}
          {canTransition(PO_FSM, 'ship', row.status) && (
            <Button variant="secondary" size="sm" onClick={() => handleFsmTransition(row.id, 'ship')}>
              {PO_ACTION_LABELS.ship}
            </Button>
          )}
          {canTransition(PO_FSM, 'deliver', row.status) && (
            <Button variant="primary" size="sm" onClick={() => openDeliverModal(row.id)}>
              {PO_ACTION_LABELS.deliver}
            </Button>
          )}
          {canTransition(PO_FSM, 'cancel', row.status) && (
            <Button variant="ghost" size="sm" onClick={() => handleFsmTransition(row.id, 'cancel')}>
              {PO_ACTION_LABELS.cancel}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const supplierOptions = (supplierQuery.data || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const deliverBlockReason = deliverQuantityBlockReason(receivedQuantity);

  return (
    <QueryGate
      isPending={poQuery.isPending || supplierQuery.isPending || reqQuery.isPending}
      isError={poQuery.isError || supplierQuery.isError || reqQuery.isError}
      onRetry={() => {
        poQuery.refetch();
        supplierQuery.refetch();
        reqQuery.refetch();
      }}
      resource="Beszerzési megrendelések"
    >
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">Beszerzési Megrendelések (PO)</h3>
            <p className="text-xs text-text-sub dark:text-text-sub-dark">Beszállítói megrendelések FSM állapottal és utánpótlás</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            + Új Megrendelés
          </Button>
        </div>

        {/* PO Table */}
        <Card className="p-4">
          <DataTable
            rows={poQuery.data ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            caption="Beszerzési megrendelések listája"
            emptyMessage="Nincs beszerzési megrendelés."
          />
        </Card>

        {/* Requisitions Section */}
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">Nyitott Utánpótlás Igénylések</h3>
          {reqQuery.data && reqQuery.data.length > 0 ? (
            <div className="space-y-2">
              {reqQuery.data.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-lg bg-surface-subtle dark:bg-surface-subtle-dark flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-semibold text-text-main dark:text-text-main-dark">
                      {req.requisitionNumber} — {req.notes || 'Utánpótlás'}
                    </div>
                    <div className="text-xs text-text-sub dark:text-text-sub-dark mt-1">
                      Igénylő: {req.requestedBy} · Forrás: {req.source}
                    </div>
                  </div>
                  <StatusPill
                    label={REQUISITION_STATUS_LABELS[req.status] ?? req.status}
                    tone={REQUISITION_STATUS_TONES[req.status] ?? 'neutral'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-text-sub dark:text-text-sub-dark">Nincs nyitott igénylés</div>
          )}
        </Card>

        {/* Create PO Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={createDialogRef} role="dialog" aria-modal="true" aria-labelledby="warehouse-create-po-title" tabIndex={-1} onKeyDown={(event) => event.key === 'Escape' && setIsCreateOpen(false)}>
            <Card className="w-full max-w-md p-6 space-y-4 bg-surface-base dark:bg-surface-base-dark">
              <h3 id="warehouse-create-po-title" className="text-lg font-bold text-text-main dark:text-text-main-dark">Új Beszerzési Megrendelés</h3>
              <form onSubmit={handleCreatePo} className="space-y-4">
                <SelectField
                  id="po-supplier"
                  label="Beszállító"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">Válasszon...</option>
                  {supplierOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectField>
                <div>
                  <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Anyagtípus
                  </label>
                  <Input
                    type="text"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                      Mennyiség (db)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                      Egységár (Ft)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
                    Mégse
                  </Button>
                  <Button variant="primary" type="submit" disabled={createPoMutation.isPending}>
                    {createPoMutation.isPending ? 'Létrehozás...' : 'Megrendelés létrehozása'}
                  </Button>
                </div>
              </form>
            </Card>
            </div>
          </div>
        )}

        {/* Deliver Modal — DeliverPurchaseOrderRequest (kötelező receivedQuantity) */}
        {deliverPoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={deliverDialogRef} role="dialog" aria-modal="true" aria-labelledby="warehouse-deliver-po-title" tabIndex={-1} onKeyDown={(event) => event.key === 'Escape' && setDeliverPoId(null)}>
            <Card className="w-full max-w-md p-6 space-y-4 bg-surface-base dark:bg-surface-base-dark">
              <h3 id="warehouse-deliver-po-title" className="text-lg font-bold text-text-main dark:text-text-main-dark">
                Leszállítás rögzítése
              </h3>
              <p className="text-xs text-text-sub dark:text-text-sub-dark">
                A backend a ténylegesen átvett mennyiséget várja (receivedQuantity) — a bevételezés ebből könyvelődik.
              </p>
              <form onSubmit={handleDeliverSubmit} className="space-y-4">
                <div>
                  <label htmlFor="deliver-received-quantity" className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Átvett mennyiség (db)
                  </label>
                  <Input
                    id="deliver-received-quantity"
                    type="number"
                    min="1"
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                  {deliverBlockReason && (
                    <p className="mt-1 text-xs text-accent-rose dark:text-accent-rose-dark" role="alert">
                      {deliverBlockReason}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="deliver-notes" className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Megjegyzés (opcionális)
                  </label>
                  <Input
                    id="deliver-notes"
                    type="text"
                    placeholder="pl. sérült csomagolás, részszállítás"
                    value={deliverNotes}
                    onChange={(e) => setDeliverNotes(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setDeliverPoId(null)}>
                    Mégse
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={deliverMutation.isPending || Boolean(deliverBlockReason)}
                  >
                    {deliverMutation.isPending ? 'Rögzítés...' : PO_ACTION_LABELS.deliver}
                  </Button>
                </div>
              </form>
            </Card>
            </div>
          </div>
        )}
      </div>
    </QueryGate>
  );
};
