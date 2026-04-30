import { KpiCard, Card, StatusPill } from '../components/ui'
import { ORDERS, CUTTING_PLANS, I18N, SPARKS } from '../mocks/data'
import { fmtHUF } from '../lib/utils'

export function DashboardPage() {
  const t = I18N.hu

  const activeOrders = ORDERS.filter((o) => o.status === 'running' || o.status === 'released').length
  const activePlans = CUTTING_PLANS.filter((p) => p.status === 'running').length
  const avgUtil = Math.round(CUTTING_PLANS.reduce((s, p) => s + p.util, 0) / CUTTING_PLANS.length)

  return (
    <div className="p-7 space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-stone-900">{t.dash.greeting}</h2>
        <p className="text-[13px] text-stone-500 mt-0.5">{t.dash.sub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title={t.dash.kpi.ordersToday}
          value={String(activeOrders)}
          change={`+12% ${t.dash.vsLastWeek}`}
          changeDirection="up"
          spark={SPARKS.ordersToday}
          breakdowns={[
            { label: 'Futó', value: String(ORDERS.filter((o) => o.status === 'running').length) },
            { label: 'Kiadva', value: String(ORDERS.filter((o) => o.status === 'released').length) },
          ]}
        />
        <KpiCard
          title={t.dash.kpi.inProduction}
          value={String(activePlans)}
          spark={SPARKS.inProduction}
        />
        <KpiCard
          title={t.dash.kpi.capacity}
          value={`${avgUtil}%`}
          spark={SPARKS.capacity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">{t.dash.todayPlan}</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {CUTTING_PLANS.slice(0, 4).map((cp) => (
              <div key={cp.id} className="px-5 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900">{cp.id}</div>
                  <div className="text-[11px] text-stone-500">{cp.material} &middot; {cp.machine}</div>
                </div>
                <div className="text-[11px] text-stone-500">{cp.sheets} {t.dash.sheets}</div>
                <StatusPill status={cp.status} label={t.status[cp.status]} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">{t.dash.recentOrders}</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {ORDERS.slice(0, 5).map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900">{o.id}</div>
                  <div className="text-[11px] text-stone-500">{o.customer}</div>
                </div>
                <div className="text-[12px] font-medium text-stone-700">{fmtHUF(o.total)}</div>
                <StatusPill status={o.status} label={t.status[o.status]} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-[13px] font-semibold text-stone-900 mb-3">{t.dash.machinesActive}</h3>
        <div className="flex gap-3 flex-wrap">
          {CUTTING_PLANS.filter((p) => p.status === 'running').map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[12px] font-medium text-teal-800">{p.machine}</span>
              <span className="text-[11px] text-teal-600">{p.util}%</span>
            </div>
          ))}
          {activePlans === 0 && <span className="text-[12px] text-stone-500">Nincs aktív gép</span>}
        </div>
      </Card>
    </div>
  )
}
