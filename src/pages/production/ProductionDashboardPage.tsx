import { Card } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { SHOPFLOOR_MACHINES, SHOPFLOOR_QUEUE } from '../../mocks/worlds'

interface ProductionDashboardPageProps {
  onScreen?: (key: string) => void
}

interface OrderProgress {
  id: string
  customer: string
  sheets: number
  done: number
  stage: string
}

export function ProductionDashboardPage({ onScreen }: ProductionDashboardPageProps) {
  const machines = SHOPFLOOR_MACHINES
  const running = machines.filter((m) => m.state === 'running').length
  const idle = machines.length - running

  const allTasks = Object.values(SHOPFLOOR_QUEUE).flat()
  const cuttingTasks = allTasks.filter((t) => t.kind === 'cutting')
  const totalSheets = cuttingTasks.reduce((a, t) => a + (t.sheets || 0), 0)
  const completedSheets = cuttingTasks.reduce((a, t) => a + (t.currentSheet || 0), 0)

  const orderProgress: Record<string, OrderProgress> = {}
  for (const t of allTasks) {
    const id = t.order
    if (!orderProgress[id]) {
      orderProgress[id] = { id, customer: t.customer, sheets: 0, done: 0, stage: t.kind }
    }
    orderProgress[id].sheets += t.sheets || 0
    orderProgress[id].done += t.currentSheet || 0
    if (t.runtime > 0) orderProgress[id].stage = t.kind
  }
  const activeOrders = Object.values(orderProgress)
    .filter((o) => o.sheets > 0)
    .slice(0, 5)

  return (
    <div className="px-7 py-6 space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Napi terv</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            {cuttingTasks.length}
            <span className="text-[14px] text-stone-400 font-normal ml-1">vágóterv</span>
          </div>
          <div className="text-[10.5px] text-stone-500 mt-1">
            {totalSheets} tábla összesen · {completedSheets} kész
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Aktív gépek</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            {running}
            <span className="text-[14px] text-stone-400 font-normal ml-1">/ {machines.length}</span>
          </div>
          <div className="text-[10.5px] mt-1">
            <span className="text-emerald-700">{running} fut</span>
            <span className="text-stone-400 mx-1">·</span>
            <span className="text-stone-500">{idle} szabad</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Hulladék</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            4.2
            <span className="text-[16px] text-stone-400 ml-0.5">%</span>
          </div>
          <div className="text-[10.5px] text-emerald-700 mt-1 inline-flex items-center gap-1">
            <span>↓ 0.4pp</span>
            <span className="text-stone-400">előző hét</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">OEE</div>
          <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">
            87
            <span className="text-[16px] text-stone-400 ml-0.5">%</span>
          </div>
          <div className="text-[10.5px] text-emerald-700 mt-1 inline-flex items-center gap-1">
            <span>↑ 3pp</span>
            <span className="text-stone-400">előző hét</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Machine load */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-stone-900">Gép terhelés</div>
              <div className="text-[11px] text-stone-500">Élő állapot — minden műhely</div>
            </div>
            <button
              onClick={() => onScreen?.('cutting')}
              className="text-[11.5px] text-teal-700 font-medium hover:underline"
            >
              Szabászat →
            </button>
          </div>
          {machines.map((m) => {
            const queue = SHOPFLOOR_QUEUE[m.id] ?? []
            const active = queue.find((q) => (q.runtime || 0) > 0)
            return (
              <div
                key={m.id}
                className="px-5 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.state === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-stone-900 truncate">{m.name}</div>
                      <div className="text-[10.5px] text-stone-500">
                        {m.kind} · {m.facility}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {m.state === 'running' && active ? (
                      <>
                        <div className="text-[11.5px] font-mono text-stone-700">{active.id}</div>
                        <div className="text-[10.5px] text-stone-500">{active.customer}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-[11.5px] text-stone-500">⚪ szabad</div>
                        <div className="text-[10.5px] text-stone-400">{queue.length} feladat vár</div>
                      </>
                    )}
                  </div>
                </div>
                {m.state === 'running' && active && active.sheets > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${((active.currentSheet || 0) / active.sheets) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10.5px] font-mono text-stone-500 tabular-nums">
                      {active.currentSheet || 0}/{active.sheets}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
          {activeOrders.map((o) => {
            const pct = o.sheets > 0 ? (o.done / o.sheets) * 100 : 0
            return (
              <div key={o.id} className="px-5 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-stone-900 truncate">{o.id}</div>
                    <div className="text-[10.5px] text-stone-500 truncate">{o.customer}</div>
                  </div>
                  <span className="px-2 h-6 inline-flex items-center rounded-full text-[10px] font-medium bg-teal-50 text-teal-700">
                    {o.stage === 'cutting' ? 'Szabászat' : o.stage === 'edgeband' ? 'Élzárás' : 'CNC'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] font-mono text-stone-700 tabular-nums w-14 text-right">
                    {o.done}/{o.sheets}
                  </div>
                </div>
              </div>
            )
          })}
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
