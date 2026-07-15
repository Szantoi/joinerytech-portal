import { SlideOver, StatusPill } from '../../components/ui'
import {
  planDueInfo, todayIso, useAsset, useWorkOrders,
} from '../../services/maintenance'
import { QueryGate } from '../ehs/QueryGate'
import {
  ASSET_KIND_META, ASSET_STATUS_META, PLAN_TRIGGER_LABELS, WO_STATUS_LABELS,
  WO_TYPE_META, formatDate, formatHours, formatOperatingHours, planDueLabel,
} from './labels'

/**
 * Eszköz-részletek SlideOver — törzsadatok, SZÁMÍTOTT státusz (a válaszból,
 * sosem kliens-számítás), megelőző tervek esedékesség-badge-ekkel
 * (planDueInfo — backend PreventiveMaintenanceSchedulerService tükör) és
 * munkalap-előzmény státusz-pillekkel.
 */
export function AssetDetailSlideOver({
  assetId, onClose, onOpenWorkOrder,
}: {
  assetId: string | null
  onClose: () => void
  /** Munkalap-sor kattintás — a szülő képernyő nyitja a munkalap-detailt. */
  onOpenWorkOrder?: (id: string) => void
}) {
  const asset = useAsset(assetId)
  const workOrders = useWorkOrders(assetId ? { assetId } : {})
  if (assetId === null) return null

  const a = asset.data
  const today = todayIso()

  return (
    <SlideOver open onClose={onClose} title={a?.name ?? assetId}
      subtitle={a ? `${a.code} · ${ASSET_KIND_META[a.kind].label}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        <QueryGate isPending={asset.isPending} isError={asset.isError}
          onRetry={() => void asset.refetch()} resource="eszköz">
          {a && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={ASSET_STATUS_META[a.status].tone} label={ASSET_STATUS_META[a.status].label} />
                <span className="text-[11.5px] text-ink-muted">{a.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                {[
                  { label: 'Gyártó / modell', val: `${a.vendor ?? '—'}${a.model ? ` ${a.model}` : ''}` },
                  { label: 'Üzemóra', val: formatOperatingHours(a.operatingHours) },
                  { label: 'Nyitott munkalap', val: String(a.openWorkOrders) },
                  { label: 'Esedékes terv', val: String(a.duePlans) },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                    <div className="text-ink">{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Megelőző tervek — esedékesség a calc.ts-ből (szín + szöveg) */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Megelőző tervek ({a.plans.length})
                </div>
                {a.plans.length === 0 ? (
                  <p className="text-[12px] text-ink-muted">Nincs megelőző terv.</p>
                ) : (
                  <ul className="space-y-2">
                    {a.plans.map((p) => {
                      const due = planDueLabel(planDueInfo(p, today, a.operatingHours))
                      return (
                        <li key={p.id} className="rounded-lg border border-line px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[12px] font-medium text-ink">{p.label}</span>
                            <StatusPill size="sm" tone={due.tone} label={due.label} />
                          </div>
                          <div className="mt-0.5 text-[10.5px] text-ink-muted">
                            {p.trigger === 'idokoz'
                              ? `${p.intervalDays} naponta`
                              : `${p.intervalHours} üzemóránként`}
                            {' · '}{PLAN_TRIGGER_LABELS[p.trigger]}
                            {' · '}{formatHours(p.estimatedHours)}
                            {p.assigneeName ? ` · ${p.assigneeName}` : ''}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Munkalap-előzmény */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Munkalapok ({(workOrders.data ?? []).length})
                </div>
                {workOrders.isPending && (
                  <div aria-busy="true" className="h-16 animate-pulse rounded-xl bg-surface-2" />
                )}
                {(workOrders.data ?? []).length === 0 && !workOrders.isPending ? (
                  <p className="text-[12px] text-ink-muted">Nincs munkalap az eszközön.</p>
                ) : (
                  <ul className="space-y-2">
                    {(workOrders.data ?? []).map((wo) => {
                      const row = (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[12px] font-medium text-ink">{wo.title}</span>
                              <StatusPill size="sm" tone={WO_TYPE_META[wo.type].tone} label={WO_TYPE_META[wo.type].label} />
                            </div>
                            <div className="font-mono text-[10.5px] text-ink-muted">
                              {wo.id} · {formatDate(wo.reportedAt)}
                            </div>
                          </div>
                          <StatusPill size="sm" fsm="maintenanceMunkalap" status={wo.status} label={WO_STATUS_LABELS[wo.status]} />
                        </>
                      )
                      return (
                        <li key={wo.id}>
                          {onOpenWorkOrder ? (
                            <button
                              onClick={() => onOpenWorkOrder(wo.id)}
                              aria-label={`Munkalap megnyitása: ${wo.title}`}
                              className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                            >
                              {row}
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                              {row}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </QueryGate>
      </div>
    </SlideOver>
  )
}
