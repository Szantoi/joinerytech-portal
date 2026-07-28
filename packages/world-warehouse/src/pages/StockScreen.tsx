import React, { useRef, useState } from 'react';
import { Card, Button, Input, SelectField, StatusPill, DataTable, QueryGate, useToast } from '@spaceos/portal-ui';
import type { DataTableColumn } from '@spaceos/portal-ui';
import { useFocusTrap } from '@spaceos/portal-ui';
import { useInertBackground } from '@spaceos/portal-ui';
import {
  useStockList,
  useConsumptionTrend,
  useRecordConsumption,
  useRecordInbound,
  WAREHOUSE_CONFIG, getWarehouseMaterial,
  warehouseErrorMessage,
} from '../services';
import type { StockListItem } from '../services';

/**
 * Alapkészlet képernyő — a lapozott `GET /api/inventory/stock` read-modelre
 * épül (StockListResponse): unitPrice/reorderMin az API-ból jön, nem
 * kliens-konfigból. A felhasználás/bevételezés modálok payloadja a
 * WAREHOUSE_CONFIG.MATERIALS vastagság/tábla-terület metaadatát használja
 * (a read-model ezt nem szolgáltatja).
 */
export const StockScreen: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(WAREHOUSE_CONFIG.DEFAULT_MATERIAL_TYPE);
  const [isConsumptionOpen, setIsConsumptionOpen] = useState<boolean>(false);
  const [isInboundOpen, setIsInboundOpen] = useState<boolean>(false);
  const consumptionDialogRef = useRef<HTMLDivElement>(null);
  const inboundDialogRef = useRef<HTMLDivElement>(null);

  // Form states
  const [panelCount, setPanelCount] = useState<number>(1);
  const [reasonOrRef, setReasonOrRef] = useState<string>('');

  const stockQuery = useStockList({ q: search || undefined, page, pageSize: WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE });
  const trendQuery = useConsumptionTrend(selectedMaterial);

  const consumptionMutation = useRecordConsumption();
  const inboundMutation = useRecordInbound();
  const { addToast } = useToast();
  const material = getWarehouseMaterial(selectedMaterial);

  useInertBackground(consumptionDialogRef, isConsumptionOpen);
  useFocusTrap(consumptionDialogRef, isConsumptionOpen);
  useInertBackground(inboundDialogRef, isInboundOpen);
  useFocusTrap(inboundDialogRef, isInboundOpen);

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await consumptionMutation.mutateAsync({
        materialType: selectedMaterial,
        thickness: material.thicknessMm,
        area: panelCount * material.panelAreaM2,
        panelCount,
        reason: reasonOrRef || 'Gyártási felhasználás',
        occurredAt: new Date().toISOString(),
      });
      addToast('Sikeres felhasználás rögzítés', 'success');
      setIsConsumptionOpen(false);
      setPanelCount(1);
      setReasonOrRef('');
    } catch (error) {
      addToast(warehouseErrorMessage(error, 'Hiba a felhasználás rögzítése során'), 'error');
    }
  };

  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inboundMutation.mutateAsync({
        materialType: selectedMaterial,
        thickness: material.thicknessMm,
        area: panelCount * material.panelAreaM2,
        panelCount,
        reference: reasonOrRef || 'BEV-MANUAL',
        occurredAt: new Date().toISOString(),
      });
      addToast('Sikeres bevételezés', 'success');
      setIsInboundOpen(false);
      setPanelCount(1);
      setReasonOrRef('');
    } catch (error) {
      addToast(warehouseErrorMessage(error, 'Hiba a bevételezés során'), 'error');
    }
  };

  const columns: DataTableColumn<StockListItem>[] = [
    {
      key: 'materialType',
      header: 'Anyagtípus',
      render: (row) => <span className="font-medium text-text-main dark:text-text-main-dark">{row.materialType}</span>,
    },
    {
      key: 'quantities',
      header: 'Készlet (tábla + offcut)',
      render: (row) => `${row.totalQuantity} ${row.unitOfMeasure} (${row.fullPanelQuantity} + ${row.offcutQuantity})`,
    },
    {
      key: 'unitPrice',
      header: 'Egységár',
      render: (row) => `${row.unitPrice.toLocaleString('hu-HU')} Ft`,
    },
    {
      key: 'reorderMin',
      header: 'Rendelési szint',
      render: (row) => `${row.reorderMin} ${row.unitOfMeasure}`,
    },
    {
      key: 'level',
      header: 'Szint',
      render: (row) =>
        row.totalQuantity <= row.reorderMin ? (
          <StatusPill label="Alacsony készlet" tone="warn" />
        ) : (
          <StatusPill label="Rendben" tone="success" />
        ),
    },
  ];

  const data = stockQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.pageSize || WAREHOUSE_CONFIG.DEFAULT_PAGE_SIZE))) : 1;

  return (
    <QueryGate
      isPending={stockQuery.isPending}
      isError={stockQuery.isError}
      onRetry={() => stockQuery.refetch()}
      resource="Alapkészlet"
    >
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:w-64">
            <label htmlFor="stock-search" className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
              Keresés anyagtípusra
            </label>
            <Input
              id="stock-search"
              type="search"
              placeholder="pl. MDF"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsConsumptionOpen(true)}>
              − Felhasználás
            </Button>
            <Button variant="primary" onClick={() => setIsInboundOpen(true)}>
              + Bevételezés
            </Button>
          </div>
        </div>

        {/* Stock table (paginated read model) */}
        <Card className="p-4">
          <DataTable
            rows={data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.materialCatalogId}
            caption="Alapanyag-készlet lista"
            emptyMessage={
              search
                ? `Nincs a keresésre („${search}") illeszkedő készlettétel.`
                : 'Nincs megjeleníthető készlettétel.'
            }
          />
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              ← Előző
            </Button>
            <span className="text-xs text-text-sub dark:text-text-sub-dark">
              {page} / {totalPages} oldal
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Következő →
            </Button>
          </div>
        )}

        {/* Consumption Trend Chart / Table */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-text-main dark:text-text-main-dark">
              Felhasználási trend — {selectedMaterial}
            </h3>
            <div className="w-full sm:w-64">
              <SelectField
                id="material-selector"
                label="Anyag a trendhez és rögzítéshez"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
              >
                {WAREHOUSE_CONFIG.MATERIALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          {trendQuery.isPending ? (
            <div className="text-sm text-text-sub dark:text-text-sub-dark" aria-busy="true">Trendadatok betöltése…</div>
          ) : trendQuery.isError ? (
            <div className="text-sm text-text-sub dark:text-text-sub-dark" role="alert">
              A trendadatok betöltése nem sikerült.{' '}
              <Button variant="ghost" size="sm" onClick={() => trendQuery.refetch()}>Újra</Button>
            </div>
          ) : trendQuery.data && trendQuery.data.dailyData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center">
              {trendQuery.data.dailyData.map((d) => (
                <div key={d.date} className="p-3 rounded-lg bg-surface-subtle dark:bg-surface-subtle-dark">
                  <div className="text-xs text-text-sub dark:text-text-sub-dark">{d.date.split('-').slice(1).join('/')}</div>
                  <div className="text-sm font-semibold text-text-main dark:text-text-main-dark mt-1">{d.area} m²</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-text-sub dark:text-text-sub-dark">Nincs megjeleníthető trendadat</div>
          )}
        </Card>

        {/* Consumption Modal */}
        {isConsumptionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={consumptionDialogRef} role="dialog" aria-modal="true" aria-labelledby="warehouse-consumption-title" tabIndex={-1} onKeyDown={(event) => event.key === 'Escape' && setIsConsumptionOpen(false)}>
            <Card className="w-full max-w-md p-6 space-y-4 bg-surface-base dark:bg-surface-base-dark">
              <h3 id="warehouse-consumption-title" className="text-lg font-bold text-text-main dark:text-text-main-dark">Felhasználás rögzítése</h3>
              <form onSubmit={handleConsumptionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-sub dark:text-text-sub-dark mb-1">
                    Anyag: {selectedMaterial}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Felhasznált táblák száma (db)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={panelCount}
                    onChange={(e) => setPanelCount(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Indoklás / Munkalap száma
                  </label>
                  <Input
                    type="text"
                    placeholder="pl. WO-2026-042"
                    value={reasonOrRef}
                    onChange={(e) => setReasonOrRef(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setIsConsumptionOpen(false)}>
                    Mégse
                  </Button>
                  <Button variant="primary" type="submit" disabled={consumptionMutation.isPending}>
                    {consumptionMutation.isPending ? 'Mentés...' : 'Rögzítés'}
                  </Button>
                </div>
              </form>
            </Card>
            </div>
          </div>
        )}

        {/* Inbound Modal */}
        {isInboundOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={inboundDialogRef} role="dialog" aria-modal="true" aria-labelledby="warehouse-inbound-title" tabIndex={-1} onKeyDown={(event) => event.key === 'Escape' && setIsInboundOpen(false)}>
            <Card className="w-full max-w-md p-6 space-y-4 bg-surface-base dark:bg-surface-base-dark">
              <h3 id="warehouse-inbound-title" className="text-lg font-bold text-text-main dark:text-text-main-dark">Bevételezés rögzítése</h3>
              <form onSubmit={handleInboundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-sub dark:text-text-sub-dark mb-1">
                    Anyag: {selectedMaterial}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Érkezett táblák száma (db)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={panelCount}
                    onChange={(e) => setPanelCount(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                    Hivatkozási szám / Szállítólevél
                  </label>
                  <Input
                    type="text"
                    placeholder="pl. DEL-2026-99"
                    value={reasonOrRef}
                    onChange={(e) => setReasonOrRef(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setIsInboundOpen(false)}>
                    Mégse
                  </Button>
                  <Button variant="primary" type="submit" disabled={inboundMutation.isPending}>
                    {inboundMutation.isPending ? 'Mentés...' : 'Bevételezés'}
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
