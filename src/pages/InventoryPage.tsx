import { useState, useEffect } from 'react'
import { Card, StatusPill } from '../components/ui'
import { OffcutsPanel } from '../components/orders/OffcutsPanel'
import { MovementsPage as MovementsTab } from './warehouse/MovementsPage'
import { I18N } from '../mocks/data'
import { fetchAll, API_BASE } from '../hooks/useApi'
import { useAuth } from '../auth'

type InvTab = 'materials' | 'offcuts' | 'movements'

interface ApiStockItem {
  materialType: string
  fullPanelCount: number
  widthMm: number
  heightMm: number
  offcutCount: number
}

// Known material types seeded in the inventory DB
const KNOWN_MATERIAL_TYPES = [
  'MDF 18mm', 'MDF 16mm', 'HDF 3mm', 'Forgácslap 18mm', 'ABS él 0.8mm', 'HDF', 'MDF',
]

function stockTrend(count: number): 'ok' | 'low' | 'critical' {
  if (count <= 2) return 'critical'
  if (count <= 8) return 'low'
  return 'ok'
}

export function InventoryPage() {
  const t = I18N.hu
  const [tab, setTab] = useState<InvTab>('materials')
  const { token } = useAuth()
  const [apiStocks, setApiStocks] = useState<ApiStockItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    const urls = KNOWN_MATERIAL_TYPES.map(
      mt => `${API_BASE.inventory}/api/inventory/stock?materialType=${encodeURIComponent(mt)}`
    )
    fetchAll<ApiStockItem>(urls, token)
      .then(results => {
        const valid = results.filter((r): r is ApiStockItem => r !== null && r.fullPanelCount !== undefined)
        if (valid.length > 0) setApiStocks(valid)
        setIsLoading(false)
      })
      .catch(e => {
        setError(e?.message ?? 'Ismeretlen hiba')
        setIsLoading(false)
      })
  }, [token])

  // Build display materials from API or mock
  const displayMaterials = apiStocks
    ? apiStocks.map(s => ({
        code: s.materialType.replace(/\s/g, '-').toUpperCase(),
        name: s.materialType,
        onHand: s.fullPanelCount,
        unit: 'lap',
        min: 5,
        price: 8500,
        trend: stockTrend(s.fullPanelCount),
      }))
    : []

  const alertCount = displayMaterials.filter((m) => m.trend !== 'ok').length

  const tabs: Array<{ key: InvTab; label: string; count: number }> = [
    { key: 'materials', label: 'Anyagok',    count: displayMaterials.length },
    { key: 'offcuts',   label: t.inv.offcuts, count: 8 },
    { key: 'movements', label: t.inv.movements, count: 24 },
  ]

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 w-fit mb-4">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 h-8 rounded-md text-[12.5px] font-medium inline-flex items-center gap-1.5 transition ${
              tab === tb.key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tb.label}
            <span className={`text-[10px] tabular-nums ${tab === tb.key ? 'text-white/60' : 'text-stone-400'}`}>
              {tb.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <>
          {isLoading && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-24" />
              ))}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12.5px] text-amber-800">
              Inventory API nem elérhető — {error}
            </div>
          )}
          {!isLoading && !error && displayMaterials.length === 0 && (
            <div className="mb-3 rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-[12.5px] text-stone-600">
              Nincs adat az Inventory API-ból
            </div>
          )}
          {!isLoading && !error && displayMaterials.length > 0 && (
          <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Anyagok',       value: displayMaterials.length, sub: 'katalógusban' },
              { label: 'Riasztások',    value: alertCount,               sub: 'alacsony / kritikus', tone: 'text-amber-700' },
              { label: 'Becsült érték', value: '8.4M Ft',                sub: 'raktáron' },
            ].map((x, i) => (
              <Card key={i} className="p-4">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{x.label}</div>
                <div className={`text-[24px] font-semibold mt-1 tabular-nums ${x.tone ?? 'text-stone-900'}`}>{x.value}</div>
                <div className="text-[11.5px] text-stone-500">{x.sub}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {displayMaterials.map((m) => {
              const pct = Math.min(100, (m.onHand / (m.min * 2)) * 100)
              const toneBar =
                m.trend === 'critical' ? 'bg-rose-500' : m.trend === 'low' ? 'bg-amber-500' : 'bg-teal-600'
              return (
                <Card key={m.code} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-stone-900 truncate">{m.name}</div>
                      <div className="text-[10.5px] font-mono text-stone-400">{m.code}</div>
                    </div>
                    <StatusPill status={m.trend} label={t.status[m.trend as keyof typeof t.status] ?? m.trend} />
                  </div>
                  <div
                    className="aspect-[4/2] bg-stone-100 rounded-lg mb-3 grid place-items-center text-stone-400 text-[10px]"
                    style={{
                      background:
                        'repeating-linear-gradient(45deg,#f5f5f4,#f5f5f4 6px,#e7e5e4 6px,#e7e5e4 7px)',
                    }}
                  >
                    <span className="font-mono">{m.unit}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-semibold tabular-nums text-stone-900">{m.onHand}</span>
                    <span className="text-[11px] text-stone-500">{m.unit} {t.inv.onHand}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${toneBar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10.5px] text-stone-500 tabular-nums">
                      {t.inv.reorder} {m.min}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-stone-500 tabular-nums">
                    {m.price.toLocaleString('hu-HU')} Ft / {m.unit}
                  </div>
                </Card>
              )
            })}
          </div>
          </>
          )}
        </>
      )}

      {tab === 'offcuts' && <OffcutsPanel />}

      {tab === 'movements' && <MovementsTab embedded />}
    </div>
  )
}
