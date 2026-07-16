import { useState } from 'react'
import { Card, QueryGate, StatusPill } from '../../../components/ui'
import {
  isWorkOrderOpen, planDueInfo, todayIso, useAssets, useWorkOrders,
} from '../services'
import {
  ASSET_STATUS_META, PLAN_DUE_SOON_LABEL, WO_PRIORITY_META, WO_PRIORITY_ORDER,
  WO_STATUS_LABELS, WO_TYPE_META, formatDate, planDueLabel,
} from './labels'
import { AssetDetailSlideOver } from './AssetDetailSlideOver'
import { WorkOrderDetailSlideOver } from './WorkOrderDetailSlideOver'

/**
 * Karbantartás áttekintés — KPI-k a query hookokból (eszközök/üzemel, leállás,
 * esedékes megelőző, nyitott munkalap) + esedékes tervek, nem üzemelő eszközök
 * és nyitott munkalapok (prioritás-sorrendben). Minden érték az API-ból
 * számított (az eszköz-státusz a válaszból — sosem kliens-számítás),
 * nincs statikus adat.
 */
export function MaintenanceDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const assets = useAssets()
  const workOrders = useWorkOrders()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null)

  const today = todayIso()
  const assetRows = assets.data ?? []
  const woRows = workOrders.data ?? []

  const operational = assetRows.filter((a) => a.status === 'uzemel')
  const breakdown = assetRows.filter((a) => a.status === 'geptores')
  const underMaintenance = assetRows.filter((a) => a.status === 'karbantartas')
  const notOperational = assetRows.filter(
    (a) => a.status === 'geptores' || a.status === 'karbantartas',
  )

  // esedékes/hamarosan esedékes megelőző tervek (calc-tükör, a config-küszöbökkel)
  const duePlans = assetRows.flatMap((a) =>
    a.plans
      .map((p) => ({ asset: a, plan: p, info: planDueInfo(p, today, a.operatingHours) }))
      .filter(({ info }) => info.due || info.dueSoon),
  )

  const openWos = woRows
    .filter((wo) => isWorkOrderOpen(wo.status))
    .sort((a, b) => WO_PRIORITY_ORDER.indexOf(a.priority) - WO_PRIORITY_ORDER.indexOf(b.priority))
  const criticalCount = openWos.filter((wo) => wo.priority === 'kritikus').length

  const kpis = [
    {
      label: 'Eszközök',
      value: String(assetRows.length),
      sub: `${operational.length} üzemel`,
    },
    {
      label: 'Leállás',
      value: String(breakdown.length),
      sub: underMaintenance.length > 0
        ? `${underMaintenance.length} karbantartás alatt`
        : 'nincs tervezett leállás',
      alert: breakdown.length > 0,
    },
    {
      label: 'Esedékes megelőző',
      value: String(duePlans.length),
      sub: PLAN_DUE_SOON_LABEL,
      alert: duePlans.some(({ info }) => info.due),
    },
    {
      label: 'Nyitott munkalap',
      value: String(openWos.length),
      sub: criticalCount > 0 ? `${criticalCount} kritikus` : 'nincs kritikus',
      alert: criticalCount > 0,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Eszköz-állapot, megelőző karbantartás és munkalapok
        </p>
      </div>

      <QueryGate
        isPending={assets.isPending || workOrders.isPending}
        isError={assets.isError || workOrders.isError}
        resource="karbantartás áttekintés"
        onRetry={() => { void assets.refetch(); void workOrders.refetch() }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{k.label}</div>
              <div className={`mt-1 text-[26px] font-semibold tabular-nums tracking-tight ${k.alert ? 'text-rose-600 dark:text-rose-400' : 'text-ink'}`}>
                {k.value}
              </div>
              <div className="mt-1 text-[10.5px] text-ink-muted">{k.sub}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Esedékes megelőző karbantartás */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Esedékes megelőző karbantartás</h2>
              <button
                onClick={() => onScreen('schedule')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Ütemterv →
              </button>
            </div>
            {duePlans.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs esedékes megelőző terv.</p>
            ) : (
              <ul className="space-y-2.5">
                {duePlans.map(({ asset, plan, info }) => {
                  const due = planDueLabel(info)
                  return (
                    <li key={plan.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedAssetId(asset.id)}
                        className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                      >
                        <div className="truncate text-[12px] font-medium text-ink underline-offset-2 hover:underline">
                          {plan.label}
                        </div>
                        <div className="truncate text-[10.5px] text-ink-muted">{asset.name}</div>
                      </button>
                      <StatusPill size="sm" tone={due.tone} label={due.label} />
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Nem üzemelő eszközök */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Eszköz-állapot</h2>
              <button
                onClick={() => onScreen('assets')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Eszközök →
              </button>
            </div>
            {notOperational.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Minden eszköz üzemel.</p>
            ) : (
              <ul className="space-y-2.5">
                {notOperational.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedAssetId(a.id)}
                      className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                    >
                      <div className="truncate text-[12px] font-medium text-ink underline-offset-2 hover:underline">
                        {a.name}
                      </div>
                      <div className="truncate text-[10.5px] text-ink-muted">{a.location}</div>
                    </button>
                    <StatusPill size="sm" tone={ASSET_STATUS_META[a.status].tone} label={ASSET_STATUS_META[a.status].label} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Nyitott munkalapok prioritás-sorrendben */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-ink">
              Nyitott munkalapok{openWos.length ? ` (${openWos.length})` : ''}
            </h2>
            <button
              onClick={() => onScreen('workorders')}
              className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              Munkalapok →
            </button>
          </div>
          {openWos.length === 0 ? (
            <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs nyitott munkalap.</p>
          ) : (
            <ul>
              {openWos.map((wo) => (
                <li key={wo.id} className="border-b border-line last:border-0">
                  <button
                    onClick={() => setSelectedWoId(wo.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-ink">{wo.title}</span>
                        <StatusPill size="sm" tone={WO_TYPE_META[wo.type].tone} label={WO_TYPE_META[wo.type].label} />
                      </div>
                      <div className="font-mono text-[10.5px] text-ink-muted">
                        {wo.id} · {wo.assetName} · {formatDate(wo.reportedAt)}
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex">
                      <StatusPill size="sm" tone={WO_PRIORITY_META[wo.priority].tone} label={WO_PRIORITY_META[wo.priority].label} />
                    </span>
                    <StatusPill size="sm" fsm="maintenanceMunkalap" status={wo.status} label={WO_STATUS_LABELS[wo.status]} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </QueryGate>

      <AssetDetailSlideOver
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onOpenWorkOrder={(id) => { setSelectedAssetId(null); setSelectedWoId(id) }}
      />
      <WorkOrderDetailSlideOver workOrderId={selectedWoId} onClose={() => setSelectedWoId(null)} />
    </div>
  )
}
