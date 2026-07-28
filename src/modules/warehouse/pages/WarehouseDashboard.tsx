import React from 'react';
import { Card, KpiCard, StatusPill, Button, QueryGate } from '../../../components/ui';
import {
  useInventorySummary,
  useStockList,
  usePurchaseOrders,
  PO_STATUS_LABELS,
  PO_STATUS_TONES,
  isPurchaseOrderActive,
} from '../services';

interface WarehouseDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

/**
 * Raktár irányítópult — a KPI-k a `GET /api/inventory/summary` valós
 * összesítőjéből jönnek (GetInventorySummaryQuery), nem egy default-anyag
 * számából. A gyors műveletek NAVIGÁLNAK a rögzítő képernyőkre (nincs halott
 * modal-gomb — P1-11).
 */
export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({ onNavigateTab }) => {
  const summaryQuery = useInventorySummary();
  const stockQuery = useStockList({ page: 1, pageSize: 20 });
  const poQuery = usePurchaseOrders();

  const isError = summaryQuery.isError || stockQuery.isError || poQuery.isError;
  const isPending = summaryQuery.isPending || stockQuery.isPending || poQuery.isPending;

  const handleRetryAll = () => {
    summaryQuery.refetch();
    stockQuery.refetch();
    poQuery.refetch();
  };

  const summary = summaryQuery.data;
  const quantityByUnit = summary
    ? summary.totalQuantityByUnit.map((q) => `${q.quantity} ${q.unitOfMeasure}`).join(' · ')
    : '';
  const activeOrdersCount = poQuery.data
    ? poQuery.data.filter((po) => isPurchaseOrderActive(po.status)).length
    : 0;
  const lowStockItems = (stockQuery.data?.items ?? []).filter(
    (item) => item.totalQuantity <= item.reorderMin,
  );

  return (
    <QueryGate
      isPending={isPending}
      isError={isError}
      onRetry={handleRetryAll}
      resource="Raktár irányítópult"
    >
      <div className="space-y-6">
        {/* KPI Cards Grid — inventory summary (valós backend-összesítő) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Aktív anyagtípusok"
            value={`${summary?.activeMaterialTypeCount ?? 0} típus`}
            unit={quantityByUnit || 'Összkészlet mértékegységenként'}
          />
          <KpiCard
            title="Alacsony készletű anyagok"
            value={`${summary?.lowStockCount ?? 0} db`}
            unit="Rendelési szint alatt / szintjén"
          />
          <KpiCard
            title="Készletérték"
            value={`${(summary?.totalStockValue ?? 0).toLocaleString('hu-HU')} Ft`}
            unit="Mennyiség × katalógus-egységár"
          />
          <KpiCard
            title="Aktív megrendelések"
            value={`${activeOrdersCount} db`}
            unit="Beszállítói PO"
          />
        </div>

        {/* Quick Action Bar — navigáció a rögzítő képernyőkre */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">Gyors műveletek</h3>
            <p className="text-xs text-text-sub dark:text-text-sub-dark">
              Felhasználás és bevételezés a Készlet képernyőn rögzíthető
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onNavigateTab?.('offcuts')}>
              Offcut kezelés →
            </Button>
            <Button variant="primary" onClick={() => onNavigateTab?.('inventory')}>
              Készletmozgás rögzítése →
            </Button>
          </div>
        </Card>

        {/* Overview Tables / Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low stock overview */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">Alacsony készlet</h3>
              {onNavigateTab && (
                <Button variant="ghost" size="sm" onClick={() => onNavigateTab('inventory')}>
                  Teljes készlet →
                </Button>
              )}
            </div>
            {lowStockItems.length > 0 ? (
              <div className="space-y-2">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div
                    key={item.materialCatalogId}
                    className="p-3 rounded-lg bg-surface-subtle dark:bg-surface-subtle-dark flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium text-text-main dark:text-text-main-dark">{item.materialType}</div>
                      <div className="text-xs text-text-sub dark:text-text-sub-dark mt-0.5">
                        Rendelési szint: {item.reorderMin} {item.unitOfMeasure}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-accent-amber dark:text-accent-amber-dark">
                        {item.totalQuantity} {item.unitOfMeasure}
                      </div>
                      <div className="text-xs text-text-sub dark:text-text-sub-dark mt-0.5">
                        Tábla: {item.fullPanelQuantity} · Offcut: {item.offcutQuantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-sub dark:text-text-sub-dark">
                Nincs rendelési szint alá esett anyag az első készletoldalon.
              </div>
            )}
          </Card>

          {/* Active Purchase Orders Overview */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">Beszállítói megrendelések</h3>
              {onNavigateTab && (
                <Button variant="ghost" size="sm" onClick={() => onNavigateTab('procurement')}>
                  Összes PO →
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {poQuery.data && poQuery.data.length > 0 ? (
                poQuery.data.slice(0, 3).map((po) => (
                  <div
                    key={po.id}
                    className="p-3 rounded-lg border border-border-subtle dark:border-border-subtle-dark flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium text-text-main dark:text-text-main-dark">{po.supplierName}</div>
                      <div className="text-xs text-text-sub dark:text-text-sub-dark mt-0.5">
                        Összeg: {po.totalAmount.toLocaleString('hu-HU')} Ft
                      </div>
                    </div>
                    <StatusPill label={PO_STATUS_LABELS[po.status] || po.status} tone={PO_STATUS_TONES[po.status] || 'neutral'} />
                  </div>
                ))
              ) : (
                <div className="text-sm text-text-sub dark:text-text-sub-dark">Nincs aktív megrendelés</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </QueryGate>
  );
};
