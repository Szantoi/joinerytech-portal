import { useState, useEffect } from 'react'
import { Card, Sparkline, GhostBtn, Icon } from '../components/ui'
import { I18N, SPARKS } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'

interface WasteReport {
  totalWasteAreaCm2: number
  averageWastePerExecution: number
  executionCount: number
}

export function AnalyticsPage() {
  const t = I18N.hu
  const [period, setPeriod] = useState(1)

  const { data: wasteData, refetch: fetchWaste } = useApi<WasteReport>(
    `${API_BASE.cutting}/api/cutting/waste`
  )
  useEffect(() => { fetchWaste() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const wasteValue = wasteData && wasteData.executionCount > 0
    ? `${(wasteData.averageWastePerExecution * 100).toFixed(1)}%`
    : '7.1%'

  const cards = [
    { label: t.ana.waste,    value: wasteValue, delta: -9,  color: '#0d9488', spark: SPARKS.wasteRate },
    { label: t.ana.capacity, value: '82%',   delta:  7,  color: '#0d9488', spark: SPARKS.capacity },
    { label: t.ana.oee,      value: '81%',   delta:  4,  color: '#0d9488', spark: SPARKS.oee },
    { label: t.ana.daily,    value: '284',   unit: t.common.pieces, delta: 12, color: '#b45309', spark: [240, 252, 261, 268, 274, 279, 284] },
  ]

  const machineRows = [
    { name: 'Holzma HPP380 · Bükk 18mm',  pct: 6.4 },
    { name: 'Holzma HPP380 · MDF 19mm',   pct: 5.2 },
    { name: 'Biesse Selco · Tölgy 40mm',  pct: 8.2 },
    { name: 'Biesse Selco · Tölgy 22mm',  pct: 7.8 },
    { name: 'Holzma HPP380 · MDF 16mm',   pct: 5.9 },
  ]

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
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
        <div className="flex-1" />
        <GhostBtn icon="download">CSV</GhostBtn>
        <GhostBtn icon="download">PDF</GhostBtn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{c.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] font-semibold tabular-nums text-stone-900">{c.value}</span>
              {c.unit && <span className="text-[12px] text-stone-500">{c.unit}</span>}
            </div>
            <div className={`text-[11px] mt-0.5 inline-flex items-center gap-0.5 ${c.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              <Icon name={c.delta >= 0 ? 'up' : 'down'} size={11} />
              {Math.abs(c.delta)}%
            </div>
            <div className="mt-3">
              <Sparkline data={c.spark} width={220} height={48} stroke={c.color} fill={c.color} strokeWidth={1.8} responsive />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="text-[12.5px] font-semibold text-stone-900 mb-1">Gép-szintű hulladék arány (utolsó 30 nap)</div>
        <div className="text-[11.5px] text-stone-500 mb-4">Anyag és gép kombinációjára lebontva</div>
        <div className="space-y-2.5">
          {machineRows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px] gap-3 items-center">
              <div className="flex items-center gap-3">
                <div className="text-[12px] font-mono text-stone-700 w-[260px] shrink-0 truncate">{row.name}</div>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${row.pct * 8}%` }} />
                </div>
              </div>
              <div className="text-[12px] tabular-nums text-stone-700 text-right">{row.pct}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
