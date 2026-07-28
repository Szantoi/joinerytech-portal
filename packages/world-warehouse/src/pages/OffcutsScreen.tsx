import React, { useRef, useState } from 'react';
import { Card, Button, Input, StatusPill, DataTable, SlideOver, QueryGate, useToast } from '@spaceos/portal-ui';
import { useFocusTrap } from '@spaceos/portal-ui';
import { useInertBackground } from '@spaceos/portal-ui';
import type { DataTableColumn } from '@spaceos/portal-ui';
import {
  useOffcutList,
  useOffcutDetail,
  useOffcutStatsSummary,
  useReserveOffcut,
  useApproveOffcutReservation,
  useUseOffcut,
  offcutJobIdSchema,
  warehouseErrorMessage,
  OFFCUT_STATUS_LABELS,
  OFFCUT_STATUS_TONES,
  OFFCUT_RESERVATION_STATUS_LABELS,
} from '../services';
import type { OffcutListItem, OffcutReservationStatus } from '../services';
import { ApiError } from '@spaceos/portal-core';

/** A reserve válaszából átfűzött, jóváhagyásra váró foglalás (P0-3). */
interface PendingReservation {
  reservationId: string;
  jobId: string;
  expiresAt: string;
}

type JobModalIntent = 'reserve' | 'use';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Mind' },
  { value: 'Available', label: 'Elérhető' },
  { value: 'Reserved', label: 'Lefoglalt' },
  { value: 'Used', label: 'Felhasznált' },
];

/**
 * Offcut képernyő — a reserve→approve→use lánc a VALÓDI azonosítókkal fut:
 * a jobId validált UUID-input (a backend Guid-ot vár), az approve a reserve
 * válaszában kapott reservationId-t használja (nincs demo-stub). A 410-es
 * (lejárt foglalás) ág külön kezelt.
 */
export const OffcutsScreen: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOffcutId, setSelectedOffcutId] = useState<string | null>(null);
  const [pendingReservations, setPendingReservations] = useState<Record<string, PendingReservation>>({});
  const [jobModal, setJobModal] = useState<{ offcutId: string; intent: JobModalIntent } | null>(null);
  const [jobIdInput, setJobIdInput] = useState<string>('');
  const [jobIdError, setJobIdError] = useState<string | null>(null);
  const jobDialogRef = useRef<HTMLDivElement>(null);

  const offcutListQuery = useOffcutList({ status: statusFilter || undefined });
  const summaryQuery = useOffcutStatsSummary();
  const detailQuery = useOffcutDetail(selectedOffcutId || '', Boolean(selectedOffcutId));

  const reserveMutation = useReserveOffcut();
  const approveMutation = useApproveOffcutReservation();
  const useMutation = useUseOffcut();

  const { addToast } = useToast();

  useInertBackground(jobDialogRef, Boolean(jobModal));
  useFocusTrap(jobDialogRef, Boolean(jobModal));

  const openJobModal = (offcutId: string, intent: JobModalIntent, prefillJobId?: string | null) => {
    setJobModal({ offcutId, intent });
    setJobIdInput(prefillJobId ?? '');
    setJobIdError(null);
  };

  const closeJobModal = () => {
    setJobModal(null);
    setJobIdInput('');
    setJobIdError(null);
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal) return;
    const parsed = offcutJobIdSchema.safeParse(jobIdInput.trim());
    if (!parsed.success) {
      setJobIdError(parsed.error.issues[0]?.message ?? 'Érvénytelen munkalap-azonosító');
      return;
    }
    const jobId = parsed.data;
    try {
      if (jobModal.intent === 'reserve') {
        const res = await reserveMutation.mutateAsync({ offcutId: jobModal.offcutId, jobId });
        setPendingReservations((prev) => ({
          ...prev,
          [jobModal.offcutId]: { reservationId: res.reservationId, jobId, expiresAt: res.expiresAt },
        }));
        addToast('Offcut-foglalás létrehozva — jóváhagyásra vár', 'success');
      } else {
        await useMutation.mutateAsync({ offcutId: jobModal.offcutId, jobId });
        setPendingReservations((prev) => {
          const next = { ...prev };
          delete next[jobModal.offcutId];
          return next;
        });
        addToast('Offcut felhasználva (Used)', 'success');
      }
      closeJobModal();
    } catch (error) {
      addToast(
        warehouseErrorMessage(
          error,
          jobModal.intent === 'reserve' ? 'Hiba a foglalás során' : 'Hiba a felhasználás során',
        ),
        'error',
      );
    }
  };

  const handleApprove = async (offcutId: string) => {
    const reservation = pendingReservations[offcutId];
    if (!reservation) {
      addToast('Ehhez az offcuthoz nincs jóváhagyható foglalás ebben a munkamenetben.', 'error');
      return;
    }
    try {
      await approveMutation.mutateAsync({ offcutId, reservationId: reservation.reservationId });
      setPendingReservations((prev) => {
        const next = { ...prev };
        delete next[offcutId];
        return next;
      });
      addToast('Offcut-foglalás jóváhagyva (Reserved)', 'success');
    } catch (error) {
      // 410: a foglalás lejárt — a stub-azonosító nem használható újra.
      if (error instanceof ApiError && error.status === 410) {
        setPendingReservations((prev) => {
          const next = { ...prev };
          delete next[offcutId];
          return next;
        });
      }
      addToast(warehouseErrorMessage(error, 'Hiba a jóváhagyás során'), 'error');
    }
  };

  const renderActions = (row: OffcutListItem) => {
    const pending = pendingReservations[row.id];
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedOffcutId(row.id)}>
          Részletek
        </Button>
        {row.status === 'Available' && !pending && (
          <Button variant="secondary" size="sm" onClick={() => openJobModal(row.id, 'reserve')}>
            Foglalás
          </Button>
        )}
        {row.status === 'Available' && pending && (
          <Button variant="primary" size="sm" onClick={() => handleApprove(row.id)}>
            Foglalás jóváhagyása
          </Button>
        )}
        {row.status === 'Reserved' && (
          <Button variant="primary" size="sm" onClick={() => openJobModal(row.id, 'use', row.cuttingJobId)}>
            Felhasználás
          </Button>
        )}
      </div>
    );
  };

  const columns: DataTableColumn<OffcutListItem>[] = [
    {
      key: 'materialCode',
      header: 'Anyagkód',
      render: (row) => <span className="font-medium text-text-main dark:text-text-main-dark">{row.materialCode}</span>,
    },
    {
      key: 'dimensions',
      header: 'Méret (széxmagxvast)',
      render: (row) => `${row.widthMm} × ${row.heightMm} × ${row.thicknessMm} mm`,
    },
    {
      key: 'volume',
      header: 'Térfogat / Tömeg',
      render: (row) => `${row.volumeM3.toFixed(3)} m³ (${row.weightKg} kg)`,
    },
    {
      key: 'status',
      header: 'Státusz',
      render: (row) => (
        <StatusPill
          label={OFFCUT_STATUS_LABELS[row.status] || row.status}
          tone={OFFCUT_STATUS_TONES[row.status] || 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Műveletek',
      render: renderActions,
    },
  ];

  const activeFilterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? statusFilter;
  const detailPending = pendingReservations[selectedOffcutId ?? ''];

  return (
    <QueryGate
      isPending={offcutListQuery.isPending || summaryQuery.isPending}
      isError={offcutListQuery.isError || summaryQuery.isError}
      onRetry={() => {
        offcutListQuery.refetch();
        summaryQuery.refetch();
      }}
      resource="Offcut készlet"
    >
      <div className="space-y-6">
        {/* Header summary cards */}
        {summaryQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-xs text-text-sub dark:text-text-sub-dark">Összes térfogat</div>
              <div className="text-xl font-bold text-accent-emerald dark:text-accent-emerald-dark mt-1">
                {summaryQuery.data.totalAvailableVolumeM3.toFixed(3)} m³
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-text-sub dark:text-text-sub-dark">Lefoglalt darab</div>
              <div className="text-xl font-bold text-accent-amber dark:text-accent-amber-dark mt-1">
                {summaryQuery.data.reservedCount} db
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-text-sub dark:text-text-sub-dark">Felhasznált darab</div>
              <div className="text-xl font-bold text-accent-blue dark:text-accent-blue-dark mt-1">
                {summaryQuery.data.usedCount} db
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-text-sub dark:text-text-sub-dark">Selejtezve</div>
              <div className="text-xl font-bold text-text-sub dark:text-text-sub-dark mt-1">
                {summaryQuery.data.scrappedCount} db
              </div>
            </Card>
          </div>
        )}

        {/* Filter bar */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value || 'all'}
                variant={statusFilter === filter.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.value === '' ? `Mind (${offcutListQuery.data?.total ?? 0})` : filter.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Table — üres szűrő-eredménynek saját, kimondott állapota van (L-2) */}
        <Card className="p-4">
          <DataTable
            rows={offcutListQuery.data?.offcuts ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            caption="Offcut maradék lista"
            emptyMessage={
              statusFilter
                ? `Nincs „${activeFilterLabel}" státuszú offcut a készletben.`
                : 'Nincs megjeleníthető offcut.'
            }
          />
        </Card>

        {/* Offcut Detail SlideOver — pending ≠ error ≠ adat (P1-10) */}
        <SlideOver
          open={Boolean(selectedOffcutId)}
          onClose={() => setSelectedOffcutId(null)}
          title="Offcut Részletek"
        >
          {detailQuery.isPending ? (
            <div className="p-5 text-sm text-text-sub dark:text-text-sub-dark" aria-busy="true">
              Offcut-részletek betöltése…
            </div>
          ) : detailQuery.isError ? (
            <div className="p-5 space-y-3" role="alert">
              <p className="text-sm text-text-sub dark:text-text-sub-dark">
                Az offcut-részletek betöltése nem sikerült.
              </p>
              <Button variant="secondary" size="sm" onClick={() => detailQuery.refetch()}>
                Újra
              </Button>
            </div>
          ) : detailQuery.data ? (
            <div className="p-5 space-y-6">
              <div className="p-4 rounded-lg bg-surface-subtle dark:bg-surface-subtle-dark space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-main dark:text-text-main-dark">
                    {detailQuery.data.materialCode}
                  </span>
                  <StatusPill
                    label={OFFCUT_STATUS_LABELS[detailQuery.data.status] || detailQuery.data.status}
                    tone={OFFCUT_STATUS_TONES[detailQuery.data.status] || 'neutral'}
                  />
                </div>
                <div className="text-sm text-text-sub dark:text-text-sub-dark">
                  Méret: {detailQuery.data.widthMm} × {detailQuery.data.heightMm} × {detailQuery.data.thicknessMm} mm
                </div>
                <div className="text-sm text-text-sub dark:text-text-sub-dark">
                  Térfogat: {detailQuery.data.volumeM3} m³ ({detailQuery.data.weightKg} kg)
                </div>
              </div>

              {/* Reservation history */}
              {detailQuery.data.reservationHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-text-main dark:text-text-main-dark">Foglalás-előzmények</h4>
                  <ul className="space-y-1">
                    {detailQuery.data.reservationHistory.map((r) => (
                      <li
                        key={r.reservationId}
                        className="text-xs text-text-sub dark:text-text-sub-dark flex justify-between gap-2"
                      >
                        <span className="font-mono truncate">{r.jobId}</span>
                        <span>
                          {OFFCUT_RESERVATION_STATUS_LABELS[r.status as OffcutReservationStatus] ?? r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FSM Action buttons in SlideOver — a táblázattal AZONOS logika */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-main dark:text-text-main-dark">Állapotátmenetek</h4>
                <div className="flex flex-wrap gap-2">
                  {detailQuery.data.status === 'Available' && !detailPending && (
                    <Button variant="secondary" onClick={() => openJobModal(detailQuery.data!.id, 'reserve')}>
                      Foglalás kezdeményezése
                    </Button>
                  )}
                  {detailQuery.data.status === 'Available' && detailPending && (
                    <Button variant="primary" onClick={() => handleApprove(detailQuery.data!.id)}>
                      Foglalás jóváhagyása
                    </Button>
                  )}
                  {detailQuery.data.status === 'Reserved' && (
                    <Button
                      variant="primary"
                      onClick={() => openJobModal(detailQuery.data!.id, 'use', detailQuery.data!.cuttingJobId)}
                    >
                      Felhasználás rögzítése
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </SlideOver>

        {/* Job assignment modal (reserve/use) — validált UUID jobId (P0-3) */}
        {jobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              ref={jobDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="warehouse-offcut-job-title"
              tabIndex={-1}
              onKeyDown={(event) => event.key === 'Escape' && closeJobModal()}
            >
              <Card className="w-full max-w-md p-6 space-y-4 bg-surface-base dark:bg-surface-base-dark">
                <h3 id="warehouse-offcut-job-title" className="text-lg font-bold text-text-main dark:text-text-main-dark">
                  {jobModal.intent === 'reserve' ? 'Offcut foglalása munkalaphoz' : 'Offcut felhasználása munkalapon'}
                </h3>
                <p className="text-xs text-text-sub dark:text-text-sub-dark">
                  A munkalap-azonosító a vágási munka (cutting job) UUID-ja — a backend Guid-ként validálja.
                </p>
                <form onSubmit={handleJobSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="offcut-job-id" className="block text-xs font-medium text-text-main dark:text-text-main-dark mb-1">
                      Munkalap-azonosító (jobId)
                    </label>
                    <Input
                      id="offcut-job-id"
                      type="text"
                      placeholder="pl. c1111111-1111-4111-8111-111111111111"
                      value={jobIdInput}
                      onChange={(e) => {
                        setJobIdInput(e.target.value);
                        setJobIdError(null);
                      }}
                      required
                    />
                    {jobIdError && (
                      <p className="mt-1 text-xs text-accent-rose dark:text-accent-rose-dark" role="alert">
                        {jobIdError}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={closeJobModal}>
                      Mégse
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={reserveMutation.isPending || useMutation.isPending}
                    >
                      {jobModal.intent === 'reserve'
                        ? (reserveMutation.isPending ? 'Foglalás...' : 'Foglalás rögzítése')
                        : (useMutation.isPending ? 'Rögzítés...' : 'Felhasználás rögzítése')}
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
