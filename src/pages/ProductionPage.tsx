import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, StatusPill, Icon } from '../components/ui'
import { I18N } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'

interface ApiCuttingPlan {
  id: string
  name: string
  date: string
  status: string
  orderReference?: string
  customerName?: string
}

const PLAN_STATUS_MAP: Record<string, string> = {
  Draft:     'draft',
  Planned:   'planned',
  Running:   'running',
  Done:      'done',
}

export function ProductionPage({ initialTab = 'cutting' }: { initialTab?: 'cutting' | 'machining' }) {
  const t = I18N.hu
  const location = useLocation()
  const [tab, setTab] = useState<'cutting' | 'machining'>(initialTab)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null)
  const planRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const { data: apiPlans, refetch: fetchPlans } = useApi<ApiCuttingPlan[]>(
    `${API_BASE.cutting}/api/cutting/plans`
  )
  useEffect(() => { fetchPlans() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle highlightPlanId from navigation state
  useEffect(() => {
    const highlightPlanId = (location.state as { highlightPlanId?: string })?.highlightPlanId
    if (highlightPlanId) {
      setSelectedPlan(highlightPlanId)
      setHighlightedPlan(highlightPlanId)

      // Scroll to the highlighted plan after a short delay to ensure rendering
      setTimeout(() => {
        planRefs.current[highlightPlanId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedPlan(null)
      }, 3000)
    }
  }, [location.state])

  const displayPlans = apiPlans?.map(p => ({
    id: p.id,
    displayId: p.name || p.id.slice(0, 12).toUpperCase(),
    material: p.date,
    sheets: 1,
    util: 0,
    status: PLAN_STATUS_MAP[p.status] ?? 'draft',
    order: p.orderReference || '—',
    customerName: p.customerName || '',
    machine: '—',
    operator: '—',
    isApiPlan: true,
  })) ?? []

  const currentPlanData = selectedPlan
    ? (displayPlans.find(p => p.id === selectedPlan) ?? null)
    : null

  const machiningCols = [
    {
      title: t.prod.edgebanding,
      count: 14,
      items: [
        { name: 'CP-184-A · Bükk', op: 'Nagy J.', state: 'running' as const },
        { name: 'CP-183-A · MDF', op: 'Tóth K.', state: 'done' as const },
        { name: 'CP-182-A · Tölgy', op: 'Kiss A.', state: 'planned' as const },
      ],
    },
    {
      title: t.prod.cnc,
      count: 8,
      items: [
        { name: 'CP-184-A · furatok', op: 'Holzma CNC', state: 'running' as const },
        { name: 'CP-180-A · marás', op: 'Biesse Rover', state: 'done' as const },
        { name: 'CP-182-B · csaplyuk', op: 'Holzma CNC', state: 'planned' as const },
      ],
    },
    {
      title: t.prod.qc,
      count: 5,
      items: [
        { name: 'JT-2426-0180', op: 'Szabó A.', state: 'running' as const },
        { name: 'JT-2426-0179', op: 'Szabó A.', state: 'planned' as const },
        { name: 'JT-2426-0177', op: 'Horváth É.', state: 'done' as const },
      ],
    },
  ]

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 w-fit mb-5">
        {[
          { k: 'cutting' as const, label: t.prod.tabs.cutting },
          { k: 'machining' as const, label: t.prod.tabs.machining },
        ].map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`px-3 h-8 rounded-md text-[12.5px] font-medium transition ${
              tab === x.k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'cutting' && (
        <div className="grid grid-cols-12 gap-3">
          {/* Plan list */}
          <Card className="col-span-4 p-0">
            <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
              <div className="text-[12.5px] font-semibold text-stone-900">{t.prod.cuttingPlans}</div>
              <span className="text-[10.5px] text-stone-500 tabular-nums">{displayPlans.length}</span>
            </div>
            <div className="max-h-[640px] overflow-auto">
              {displayPlans.map((p) => {
                const active = p.id === selectedPlan
                const seed = p.displayId.charCodeAt(p.displayId.length - 1)
                const progress = p.status === 'running' ? 30 + (seed * 7) % 55 : p.status === 'done' ? 100 : 0
                const runtimeMin = p.status === 'running' ? 12 + (seed * 3) % 35 : p.status === 'done' ? 38 + (seed * 2) % 22 : 0
                const proof = p.status === 'done'
                return (
                  <button
                    key={p.id}
                    ref={(el) => { planRefs.current[p.id] = el }}
                    onClick={() => { setSelectedPlan(p.id) }}
                    className={`w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 transition-all ${
                      active ? 'bg-teal-50/60' : 'hover:bg-stone-50'
                    } ${highlightedPlan === p.id ? 'border-l-4 border-l-teal-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11.5px] font-mono text-stone-700">{p.displayId}</span>
                      <span className="inline-flex items-center gap-1.5">
                        {proof && (
                          <span title="Bizonylat csatolva" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <Icon name="check" size={9} />proof
                          </span>
                        )}
                        <StatusPill status={p.status} label={t.status[p.status as keyof typeof t.status] ?? p.status} />
                      </span>
                    </div>
                    <div className="text-[12.5px] font-medium text-stone-900">
                      {p.customerName && p.order !== '—'
                        ? `${p.customerName} · ${p.order}`
                        : p.customerName || p.material || p.order}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-stone-500">
                      {!p.isApiPlan && <><span className="font-mono">{p.sheets} {t.prod.sheet}</span><span>·</span></>}
                      {!p.isApiPlan && <span>{t.prod.utilization} {p.util}%</span>}
                      {p.status === 'running' && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-teal-700">{runtimeMin} perc futás</span>
                        </>
                      )}
                    </div>
                    {p.status === 'running' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full"
                            style={{ width: `${progress}%`, boxShadow: '0 0 6px rgba(13,148,136,.4)' }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums font-mono text-teal-700 w-9 text-right">{progress}%</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Nesting viewer */}
          <Card className="col-span-8 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{t.prod.nesting}</div>
                <div className="text-[15px] font-semibold text-stone-900 mt-0.5">
                  {currentPlanData ? `${currentPlanData.displayId} · ${currentPlanData.material}` : '—'}
                </div>
                <div className="text-[11.5px] text-stone-500 mt-0.5 font-mono">
                  {currentPlanData ? `${currentPlanData.order} · ${currentPlanData.machine} · ${currentPlanData.operator}` : 'Nincs kiválasztott terv'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center h-52 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-400 text-[13px]">
              {currentPlanData ? 'Nesting API nem elérhető' : 'Válasszon vágási tervet a megjelenítéshez'}
            </div>
          </Card>
        </div>
      )}

      {tab === 'machining' && (
        <div className="grid grid-cols-3 gap-3">
          {machiningCols.map((col, i) => (
            <Card key={i} className="p-0">
              <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
                <div className="text-[12.5px] font-semibold text-stone-900">{col.title}</div>
                <span className="text-[10.5px] text-stone-500 tabular-nums">{col.count}</span>
              </div>
              <div className="p-2 space-y-1.5">
                {col.items.map((it, j) => (
                  <div key={j} className="bg-stone-50/60 border border-stone-200/70 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-[12px] font-mono text-stone-700">{it.name}</div>
                      <StatusPill status={it.state} label={t.status[it.state]} />
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-stone-500">
                      <Icon name="user" size={11} />
                      <span>{it.op}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
