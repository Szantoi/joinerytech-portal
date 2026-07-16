import { useState } from 'react'
import { QueryGate, STATUS_TONES } from '../../components/ui'
import {
  SCHEDULE_WINDOW_DAYS, scheduleWindow, todayIso, useWorkOrders,
} from '../../services/maintenance'
import type { WorkOrder, WorkOrderType } from '../../services/maintenance/workOrders'
import {
  WO_STATUS_LABELS, WO_TYPE_META, formatDate, formatGridDay, isWeekend,
} from './labels'
import { WorkOrderDetailSlideOver } from './WorkOrderDetailSlideOver'

/**
 * Karbantartási ütemterv — eszköz-soros naptár-rács a következő
 * SCHEDULE_WINDOW_DAYS napra (config): az ütemezett + folyamatban lévő
 * munkalapok az ütemezett napjukon jelennek meg; cella-kattintás →
 * munkalap-SlideOver. A rács SAJÁT görgethető régió (role="region" +
 * aria-label + tabIndex — Kontrolling S1-lecke), és sr-only lista-alternatíva
 * is jár hozzá (M3-lecke: a vizuális rács nem az egyetlen olvasat).
 */

/** A rácson megjelenő munkalapok: van ütemezett napjuk és még aktívak. */
function isOnSchedule(wo: WorkOrder, days: string[]): boolean {
  return (
    wo.scheduledAt !== null &&
    (wo.status === 'utemezve' || wo.status === 'folyamatban') &&
    days.includes(wo.scheduledAt)
  )
}

export function ScheduleScreen() {
  const workOrders = useWorkOrders({ open: true })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const today = todayIso()
  const days = scheduleWindow(today)
  const scheduled = (workOrders.data ?? []).filter((wo) => isOnSchedule(wo, days))

  // eszköz-sorok: csak azok az eszközök, amelyeknek van rács-ba eső munkalapja
  const assetRows = [...new Map(
    scheduled.map((wo) => [wo.assetId, { id: wo.assetId, name: wo.assetName, code: wo.assetCode }]),
  ).values()].sort((a, b) => a.code.localeCompare(b.code))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Ütemterv</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          {SCHEDULE_WINDOW_DAYS} nap · az ütemezett és folyamatban lévő munkalapok eszközönként
        </p>
      </div>

      <QueryGate isPending={workOrders.isPending} isError={workOrders.isError}
        onRetry={() => void workOrders.refetch()} resource="ütemterv">
        {assetRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface-1 px-4 py-12 text-center text-[12.5px] text-ink-muted">
            Nincs ütemezett munkalap a következő {SCHEDULE_WINDOW_DAYS} napban.
          </div>
        ) : (
          <>
            {/* S1-minta: a széles rács saját, fókuszálható görgethető régió */}
            <div
              role="region"
              aria-label={`Karbantartási ütemterv-rács, ${SCHEDULE_WINDOW_DAYS} nap`}
              tabIndex={0}
              className="overflow-x-auto rounded-2xl border border-line bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              <div className="min-w-[980px]">
                <div
                  className="grid border-b border-line bg-surface-2/60"
                  style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}
                >
                  <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                    Eszköz
                  </div>
                  {days.map((d) => (
                    <div
                      key={d}
                      className={`border-l border-line px-1 py-2 text-center ${
                        d === today ? 'bg-world-soft' : isWeekend(d) ? 'bg-surface-2' : ''
                      }`}
                    >
                      <div className={`font-mono text-[10px] ${d === today ? 'font-semibold text-world-soft-fg' : 'text-ink-muted'}`}>
                        {formatGridDay(d)}
                      </div>
                    </div>
                  ))}
                </div>

                {assetRows.map((asset) => (
                  <div
                    key={asset.id}
                    className="grid border-b border-line last:border-b-0"
                    style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}
                  >
                    <div className="min-w-0 px-3 py-2">
                      <div className="truncate text-[11.5px] font-semibold text-ink">{asset.name}</div>
                      <div className="font-mono text-[10px] text-ink-muted">{asset.code}</div>
                    </div>
                    {days.map((d) => {
                      const cell = scheduled.filter((wo) => wo.assetId === asset.id && wo.scheduledAt === d)
                      return (
                        <div
                          key={d}
                          className={`min-h-[44px] space-y-0.5 border-l border-line p-0.5 ${
                            d === today ? 'bg-world-soft/40' : isWeekend(d) ? 'bg-surface-2/60' : ''
                          }`}
                        >
                          {cell.map((wo) => {
                            const tone = STATUS_TONES[WO_TYPE_META[wo.type].tone]
                            return (
                              <button
                                key={wo.id}
                                onClick={() => setSelectedId(wo.id)}
                                aria-label={`${wo.title} — ${asset.name}, ${formatDate(d)}, ${WO_STATUS_LABELS[wo.status]}`}
                                className={`block w-full truncate rounded px-1 py-0.5 text-left text-[9.5px] leading-tight ${tone.bg} ${tone.fg} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring`}
                              >
                                <span className="font-semibold">{WO_TYPE_META[wo.type].label}</span>{' '}
                                {wo.title}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Jelmagyarázat: szín + látható szöveg (nem csak szín) */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
              {(Object.keys(WO_TYPE_META) as WorkOrderType[]).map((t) => {
                const tone = STATUS_TONES[WO_TYPE_META[t].tone]
                return (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${tone.dot}`} />
                    {WO_TYPE_META[t].label}
                  </span>
                )
              })}
            </div>

            {/* M3-lecke: sr-only lista-alternatíva a vizuális rácshoz */}
            <ul className="sr-only" aria-label="Ütemezett munkalapok listája">
              {scheduled.map((wo) => (
                <li key={wo.id}>
                  {formatDate(wo.scheduledAt)}: {wo.title} — {wo.assetName},{' '}
                  {WO_TYPE_META[wo.type].label}, {WO_STATUS_LABELS[wo.status]}
                  {wo.assigneeName ? `, felelős: ${wo.assigneeName}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </QueryGate>

      <WorkOrderDetailSlideOver workOrderId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
