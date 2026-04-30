import { useState } from 'react'
import { Card, StatusPill } from '../components/ui'
import { OffcutsPanel } from '../components/orders/OffcutsPanel'
import { MovementsPage as MovementsTab } from './warehouse/MovementsPage'
import { MATERIALS, I18N } from '../mocks/data'

type InvTab = 'materials' | 'offcuts' | 'movements'

export function InventoryPage() {
  const t = I18N.hu
  const [tab, setTab] = useState<InvTab>('materials')

  const tabs: Array<{ key: InvTab; label: string; count: number }> = [
    { key: 'materials', label: 'Anyagok',    count: MATERIALS.length },
    { key: 'offcuts',   label: t.inv.offcuts, count: 8 },
    { key: 'movements', label: t.inv.movements, count: 24 },
  ]

  const alertCount = MATERIALS.filter((m) => m.trend !== 'ok').length
  const totalValue = '8.4M Ft'

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
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Anyagok',       value: MATERIALS.length, sub: 'katalógusban' },
              { label: 'Riasztások',    value: alertCount,        sub: 'alacsony / kritikus', tone: 'text-amber-700' },
              { label: 'Becsült érték', value: totalValue,         sub: 'raktáron' },
            ].map((x, i) => (
              <Card key={i} className="p-4">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{x.label}</div>
                <div className={`text-[24px] font-semibold mt-1 tabular-nums ${x.tone ?? 'text-stone-900'}`}>{x.value}</div>
                <div className="text-[11.5px] text-stone-500">{x.sub}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MATERIALS.map((m) => {
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
                    <StatusPill status={m.trend} label={t.status[m.trend]} />
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

      {tab === 'offcuts' && <OffcutsPanel />}

      {tab === 'movements' && <MovementsTab />}
    </div>
  )
}
