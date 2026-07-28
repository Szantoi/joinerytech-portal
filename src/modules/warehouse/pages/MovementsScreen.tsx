import React, { useState } from 'react';
import { Card, Button, DataTable, QueryGate } from '../../../components/ui';
import type { DataTableColumn } from '../../../components/ui/dataTable.types';
import { useMovements } from '../services';
import type { MovementListItem } from '../services';

type MovementTypeFilter = '' | 'Inbound' | 'Consumption' | 'Offcut';

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  Inbound: { label: 'Bevételezés', cls: 'text-accent-emerald dark:text-accent-emerald-dark font-semibold' },
  Consumption: { label: 'Felhasználás', cls: 'text-accent-rose dark:text-accent-rose-dark font-semibold' },
  Offcut: { label: 'Maradék (Offcut)', cls: 'text-accent-amber dark:text-accent-amber-dark font-semibold' },
};

export const MovementsScreen: React.FC = () => {
  const [filterType, setFilterType] = useState<MovementTypeFilter>('');
  const [page, setPage] = useState(1);

  const movementsQuery = useMovements({
    type: filterType || undefined,
    page,
    pageSize: 20,
  });

  const handleFilterChange = (newType: MovementTypeFilter) => {
    setFilterType(newType);
    setPage(1);
  };

  const columns: DataTableColumn<MovementListItem>[] = [
    {
      key: 'occurredAt',
      header: 'Dátum / Idő',
      render: (row) => new Date(row.occurredAt).toLocaleString('hu-HU'),
    },
    {
      key: 'materialType',
      header: 'Anyag',
      render: (row) => <span className="font-medium text-text-main dark:text-text-main-dark">{row.materialType}</span>,
    },
    {
      key: 'movementType',
      header: 'Típus',
      render: (row) => {
        const conf = TYPE_LABELS[row.movementType] ?? { label: row.movementType, cls: '' };
        return <span className={conf.cls}>{conf.label}</span>;
      },
    },
    {
      key: 'quantity',
      header: 'Mennyiség (db)',
      render: (row) => `${row.quantity} db`,
    },
    {
      key: 'reference',
      header: 'Hivatkozás',
      render: (row) => <span className="font-mono text-xs text-text-sub dark:text-text-sub-dark">{row.reference}</span>,
    },
  ];

  const data = movementsQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(total / (data.pageSize || 20)) : 1;

  return (
    <QueryGate
      isPending={movementsQuery.isPending}
      isError={movementsQuery.isError}
      onRetry={() => movementsQuery.refetch()}
      resource="Készletmozgások"
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={filterType === '' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('')}
            >
              Összes ({filterType === '' ? total : '—'})
            </Button>
            <Button
              variant={filterType === 'Inbound' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('Inbound')}
            >
              Bevételezések
            </Button>
            <Button
              variant={filterType === 'Consumption' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('Consumption')}
            >
              Felhasználások
            </Button>
            <Button
              variant={filterType === 'Offcut' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('Offcut')}
            >
              Offcut mozgások
            </Button>
          </div>
          <div className="text-xs text-text-sub dark:text-text-sub-dark">
            {total} bejegyzés összesen
          </div>
        </Card>

        {/* Movements Table */}
        <Card className="p-4">
          {items.length > 0 ? (
            <DataTable
              rows={items}
              columns={columns}
              rowKey={(row) => row.id}
              caption="Készletmozgások naplója"
            />
          ) : (
            <div className="py-8 text-center text-sm text-text-sub dark:text-text-sub-dark">
              {filterType
                ? `Nincs „${TYPE_LABELS[filterType]?.label ?? filterType}" típusú mozgás rögzítve.`
                : 'Nincs megjeleníthető készletmozgás.'}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
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
      </div>
    </QueryGate>
  );
};
