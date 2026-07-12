import { useState, useEffect } from 'react'
import { KpiCard, Card, StatusPill, Icon } from '../components/ui'
import { MiniKanbanStrip } from '../components/layout/MiniKanbanStrip'
import { I18N } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'
import type { Order, OrderStatus } from '../types'

interface DashboardStats {
  tenantCount: number
  facilityCount: number
  workStationCount: number
  activeWorkStationCount: number
  flowEpicCount: number
  auditEventCount: number
}

interface ApiDoorOrder {
  id: string
  projectId: string
  projectName: string
  status: string
  itemCount: number
  deliveryDate: string | null
  createdAt: string
}

interface ApiOrdersPage {
  items: ApiDoorOrder[]
  totalCount: number
}

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  Draft:             'draft',
  Submitted:         'calc',
  Calculating:       'calc',
  Calculated:        'ready',
  CalculationFailed: 'draft',
  InProduction:      'released',
  Completed:         'released',
  Cancelled:         'draft',
}

function apiOrderToFe(o: ApiDoorOrder): Order {
  return {
    id:       o.projectId || o.id.slice(0, 12).toUpperCase(),
    customer: o.projectName,
    type:     'door' as const,
    date:     o.deliveryDate?.slice(0, 10) ?? '—',
    status:   ORDER_STATUS_MAP[o.status] ?? 'draft',
    total:    0,
    items:    o.itemCount,
  }
}

export function DashboardPage() {
  const t = I18N.hu
  const [period, setPeriod] = useState(0)

  const { data: stats, refetch: fetchStats } = useApi<DashboardStats>(
    `${API_BASE.kernel}/dashboard/stats`
  )
  const { data: apiOrdersPage, refetch: fetchOrders } = useApi<ApiOrdersPage>(
    `${API_BASE.joinery}/api/orders?pageSize=5`
  )
  useEffect(() => { fetchStats(); fetchOrders() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const recentOrders: Order[] = apiOrdersPage?.items?.map(apiOrderToFe) ?? []

  const kpis = [
    {
      key: 'flowEpics',
      label: 'Aktív projektek',
      value: stats ? String(stats.flowEpicCount) : '—',
      unit: 'projekt',
      delta: 0,
      spark: [],
      color: '#0d9488',
      breakdowns: [
        { label: 'Telephely', value: stats ? String(stats.facilityCount) : '—', note: 'db' },
        { label: 'Munkahely', value: stats ? String(stats.workStationCount) : '—', note: 'össz' },
        { label: 'Aktív gép', value: stats ? String(stats.activeWorkStationCount) : '—', note: 'fut' },
      ],
    },
    {
      key: 'inProduction',
      label: t.dash.kpi.inProduction,
      value: '28',
      unit: t.common.orders,
      delta: 12,
      spark: [],
      color: '#0d9488',
      breakdowns: [
        { label: 'Holzma HPP380', value: '12', note: '43%' },
        { label: 'Biesse Selco',  value: '9',  note: '32%' },
        { label: 'Élzáró + CNC',  value: '7',  note: '25%' },
      ],
    },
    {
      key: 'stockAlerts',
      label: t.dash.kpi.stockAlerts,
      value: '3',
      unit: '',
      delta: -25,
      spark: [],
      color: '#b45309',
      breakdowns: [
        { label: 'Tölgy 22mm',   value: '8 / 15',  note: t.status.low },
        { label: 'MDF 19mm',     value: '12 / 25', note: t.status.low },
        { label: 'Vasalat CLIP', value: '4 / 50',  note: t.status.critical },
      ],
    },
    {
      key: 'wasteRate',
      label: t.dash.kpi.wasteRate,
      value: '7.1',
      unit: '%',
      delta: -9,
      spark: [],
      color: '#0d9488',
      breakdowns: [
        { label: 'Bükk 18mm',  value: '6.4%' },
        { label: 'Tölgy 40mm', value: '8.2%' },
        { label: 'MDF 16mm',   value: '5.9%' },
      ],
    },
    {
      key: 'oee',
      label: t.dash.kpi.oee,
      value: '81',
      unit: '%',
      delta: 4,
      spark: [],
      color: '#0d9488',
      breakdowns: [
        { label: 'Rendelkezés', value: '94%' },
        { label: 'Teljesítm.',  value: '89%' },
        { label: 'Minőség',     value: '97%' },
      ],
    },
    {
      key: 'capacity',
      label: t.dash.kpi.capacity,
      value: '82',
      unit: '%',
      delta: 7,
      spark: [],
      color: '#0d9488',
      breakdowns: [
        { label: 'Szabászat', value: '88%' },
        { label: 'Élzárás',   value: '76%' },
        { label: 'CNC',       value: '82%' },
      ],
    },
  ]

  const machines = [
    { name: 'Holzma HPP380', load: 78, plans: 5, current: 'CP-184-A · Bükk 18mm' },
    { name: 'Biesse Selco',  load: 64, plans: 4, current: 'CP-182-A · Tölgy 40mm' },
    { name: 'Élzáró Homag',  load: 42, plans: 3, current: 'CP-183-A · MDF 16mm fehér' },
  ]

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[18px] md:text-[20px] font-semibold text-stone-900 tracking-tight">{t.dash.greeting}</div>
          <div className="text-[12.5px] text-stone-500 mt-0.5">{t.dash.sub}</div>
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
          {[t.common.today, t.common.week, t.common.month].map((label, i) => (
            <button
              key={i}
              onClick={() => setPeriod(i)}
              className={`px-2.5 h-7 rounded-md text-[12px] font-medium transition ${
                period === i ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            unit={k.unit}
            delta={k.delta}
            spark={k.spark}
            sparkColor={k.color}
            breakdowns={k.breakdowns}
          />
        ))}
      </div>

      {/* MiniKanban */}
      <div className="mt-3">
        <MiniKanbanStrip onNav={(_key) => { /* parent handles nav */ }} />
      </div>

      {/* Today's plan + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] font-semibold text-stone-900">{t.dash.todayPlan}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">
                12 {t.dash.cuttingPlans} · 84 {t.dash.sheets} · 3 {t.dash.machinesActive}
              </div>
            </div>
            <button className="text-[11.5px] text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1">
              {t.common.details} <Icon name="chevron" size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {machines.map((m, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                <div className="w-9 h-9 rounded-lg bg-stone-100 grid place-items-center text-stone-600 shrink-0">
                  <Icon name="factory" size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-stone-900">{m.name}</span>
                    <span className="text-[10.5px] text-stone-500 font-mono truncate">{m.current}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: `${m.load}%` }} />
                    </div>
                    <span className="text-[11px] text-stone-500 tabular-nums w-9 text-right">{m.load}%</span>
                    <span className="text-[10.5px] text-stone-400">{m.plans} {t.dash.cuttingPlans}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-stone-900">{t.dash.recentOrders}</div>
            <button className="text-[11.5px] text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1">
              {t.common.details} <Icon name="chevron" size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {recentOrders.map((o) => (
              <div key={o.id} className="w-full text-left py-2 px-2 -mx-2 rounded-md hover:bg-stone-50 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900 truncate">{o.customer}</div>
                  <div className="text-[10.5px] font-mono text-stone-400">{o.id}</div>
                </div>
                <StatusPill status={o.status} label={t.status[o.status]} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
