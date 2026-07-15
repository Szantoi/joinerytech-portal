import { http, HttpResponse } from 'msw'
import { MAINTENANCE_API_BASE } from '../../services/maintenance/config'
import type { Asset, AssetKind } from '../../services/maintenance/assets'
import { calcAssetStatus, isPlanDue, planDueInfo, todayIso } from '../../services/maintenance/calc'
import { isWorkOrderOpen } from '../../services/maintenance/fsm'
import { getMaintenanceDb } from './db'
import type { AssetSeed } from './seed'

/**
 * Eszköz handlerek — lista + részlet. A `status`, `openWorkOrders` és
 * `duePlans` mezők KISZOLGÁLÁSKOR számítódnak a services/maintenance/calc
 * tiszta függvényeivel (backend AssetStatusCalculationService +
 * PreventiveMaintenanceSchedulerService tükör) — a kliens sosem számolja újra.
 */

const BASE = `${MAINTENANCE_API_BASE}/assets`

/** Seed-eszköz → API-DTO a számított mezőkkel (a válasz igazságforrása). */
function toAssetDto(asset: AssetSeed): Asset {
  const db = getMaintenanceDb()
  const today = todayIso()
  const duePlans = asset.plans.filter((p) => {
    const info = planDueInfo(p, today, asset.operatingHours)
    return isPlanDue(p, today, asset.operatingHours) || info.dueSoon
  }).length
  return {
    ...asset,
    status: calcAssetStatus(asset, db.workOrders),
    openWorkOrders: db.workOrders.filter(
      (wo) => wo.assetId === asset.id && isWorkOrderOpen(wo.status),
    ).length,
    duePlans,
  }
}

export const assetHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const kind = url.searchParams.get('kind') as AssetKind | null
    const q = url.searchParams.get('q')?.trim().toLowerCase()

    let rows = getMaintenanceDb().assets
    if (kind) rows = rows.filter((a) => a.kind === kind)
    if (q) {
      rows = rows.filter((a) =>
        `${a.name} ${a.code} ${a.vendor ?? ''} ${a.model ?? ''}`.toLowerCase().includes(q),
      )
    }
    // kód szerinti stabil sorrend
    const sorted = [...rows].sort((a, b) => a.code.localeCompare(b.code))
    return HttpResponse.json(sorted.map(toAssetDto))
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const asset = getMaintenanceDb().assets.find((a) => a.id === params.id)
    if (!asset) {
      return HttpResponse.json(
        { error: 'NotFound', message: 'Eszköz nem található' },
        { status: 404 },
      )
    }
    return HttpResponse.json(toAssetDto(asset))
  }),
]
