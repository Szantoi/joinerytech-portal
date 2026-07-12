import { useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { useApi, API_BASE } from '../../hooks/useApi'

interface ApiCuttingPlan {
  id: string
  name: string
  date: string
  status: string
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

interface ProductionDashboardPageProps {
  onScreen?: (key: string) => void
}

const PLAN_STATUS_MAP: Record<string, string> = {
  Draft: 'draft', Planned: 'planned', Running: 'running', Done: 'done',
}

const ORDER_STATUS_STAGE: Record<string, string> = {
  InProduction: 'cutting', Calculated: 'cutting', Submitted: 'edgeband',
}

export function ProductionDashboardPage({ onScreen }: ProductionDashboardPageProps) {
  const { data: apiPlans, refetch: fetchPlans } = useApi<ApiCuttingPlan[]>(
    `${API_BASE.cutting}/api/cutting/plans`
  )
  const { data: apiOrdersPage, refetch: fetchOrders } = useApi<ApiOrdersPage>(
    `${API_BASE.joinery}/api/orders?pageSize=50`
  )
  useEffect(() => { fetchPlans(); fetchOrders() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const plans = apiPlans ?? []
  const orders = apiOrdersPage?.items ?? []

  const running = plans.filter((p) => PLAN_STATUS_MAP[p.status] === 'running').length
  const totalPlans = plans.length

  const activeOrders = orders
    .filter((o) => ['InProduction', 'Calculated', 'Submitted'].includes(o.status))
    .slice(0, 5)

  return (
    <div className="px-7 py-6 space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Napi terv</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            {totalPlans > 0 ? totalPlans : '—'}
            <span className="text-[14px] text-stone-400 font-normal ml-1">vágóterv</span>
          </div>
          <div className="text-[10.5px] text-stone-500 mt-1">
            {totalPlans > 0 ? `${running} futó · ${totalPlans - running} egyéb` : 'API adat szükséges'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Aktív vágótervek</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            {running > 0 ? running : '—'}
            <span className="text-[14px] text-stone-400 font-normal ml-1">/ {totalPlans || '—'}</span>
          </div>
          <div className="text-[10.5px] mt-1">
            {totalPlans > 0
              ? <><span className="text-emerald-700">{running} fut</span><span className="text-stone-400 mx-1">·</span><span className="text-stone-500">{totalPlans - running} egyéb</span></>
              : <span className="text-stone-400">Nincs API adat</span>
            }
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Hulladék</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            —
            <span className="text-[16px] text-stone-400 ml-0.5">%</span>
          </div>
          <div className="text-[10.5px] text-stone-400 mt-1">
            {/* [?] GET /cutting/api/cutting/waste nem ad gépenként bontást */}
            Összesített adat szükséges
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Aktív rendelések</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            {activeOrders.length > 0 ? activeOrders.length : '—'}
          </div>
          <div className="text-[10.5px] text-stone-500 mt-1">
            {activeOrders.length > 0 ? 'gyártásban' : 'Nincs aktív rendelés'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cutting plan list */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-stone-900">Vágótervek</div>
              <div className="text-[11px] text-stone-500">Élő terv státuszok</div>
            </div>
            <button
              onClick={() => onScreen?.('cutting')}
              className="text-[11.5px] text-teal-700 font-medium hover:underline"
            >
              Szabászat →
            </button>
          </div>
          {plans.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-stone-400">
              {apiPlans === null ? 'Betöltés...' : 'Nincs vágóterv'}
            </div>
          ) : (
            plans.slice(0, 6).map((p) => {
              const status = PLAN_STATUS_MAP[p.status] ?? p.status
              const isRunning = status === 'running'
              return (
                <div key={p.id} className="px-5 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-stone-900 truncate font-mono">
                        {p.name || p.id.slice(0, 12).toUpperCase()}
                      </div>
                      <div className="text-[10.5px] text-stone-500">{p.date}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isRunning ? 'bg-teal-50 text-teal-700' :
                      status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {isRunning ? 'Futó' : status === 'done' ? 'Kész' : status === 'planned' ? 'Tervezett' : 'Vázlat'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </Card>

        {/* Active orders progress */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-stone-900">Aktív megrendelések</div>
              <div className="text-[11px] text-stone-500">Gyártás alatti rendelések haladása</div>
            </div>
            <button
              onClick={() => onScreen?.('workflow')}
              className="text-[11.5px] text-teal-700 font-medium hover:underline"
            >
              Munkafolyamat →
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-stone-400">
              {apiOrdersPage === null ? 'Betöltés...' : 'Nincs aktív rendelés'}
            </div>
          ) : (
            activeOrders.map((o) => {
              const stage = ORDER_STATUS_STAGE[o.status] ?? 'cutting'
              return (
                <div key={o.id} className="px-5 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-stone-900 truncate">{o.projectName}</div>
                      <div className="text-[10.5px] text-stone-500 truncate font-mono">{o.projectId || o.id.slice(0, 12).toUpperCase()}</div>
                    </div>
                    <span className="px-2 h-6 inline-flex items-center rounded-full text-[10px] font-medium bg-teal-50 text-teal-700">
                      {stage === 'cutting' ? 'Szabászat' : stage === 'edgeband' ? 'Élzárás' : 'CNC'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'cutting', label: 'Szabászatba', icon: 'cut', desc: 'Vágótervek + nesting' },
          { key: 'machining', label: 'Megmunkálás', icon: 'layers', desc: 'Élzárás + CNC + QC' },
          { key: 'workflow', label: 'Munkafolyamat', icon: 'workflow', desc: 'Kanban — minden szakasz' },
          { key: 'analytics', label: 'Elemzések', icon: 'analytics', desc: 'Hulladék, OEE, kapacitás' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => onScreen?.(s.key)}
            className="text-left p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50/40 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 grid place-items-center mb-2.5 group-hover:bg-teal-200">
              <Icon name={s.icon} size={17} />
            </div>
            <div className="text-[12.5px] font-semibold text-stone-900">{s.label}</div>
            <div className="text-[10.5px] text-stone-500 mt-0.5">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
