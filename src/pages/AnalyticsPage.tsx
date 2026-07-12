import { useState, useEffect } from 'react'
import { Card, Sparkline, GhostBtn, Icon } from '../components/ui'
import { I18N } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'

function EndpointPending({ endpoint }: { endpoint: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 flex flex-col items-center gap-2 text-center">
      <div className="text-[13px] font-semibold text-amber-700">Backend endpoint nem elérhető</div>
      <code className="text-[11px] text-amber-600 bg-amber-100 rounded px-2 py-0.5">{endpoint}</code>
      <div className="text-[11px] text-stone-500 mt-1">Az endpoint implementálása után lesz élő adat</div>
    </div>
  )
}

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
    : '—'

  const cards = [
    { label: t.ana.waste,    value: wasteValue, delta: -9,  color: '#0d9488', spark: [] as number[] },
    { label: t.ana.capacity, value: '82%',   delta:  7,  color: '#0d9488', spark: [] as number[] },
    { label: t.ana.oee,      value: '81%',   delta:  4,  color: '#0d9488', spark: [] as number[] },
    { label: t.ana.daily,    value: '284',   unit: t.common.pieces, delta: 12, color: '#b45309', spark: [] as number[] },
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
        <EndpointPending endpoint="GET /cutting/api/cutting/waste/by-machine [?]" />
      </Card>
    </div>
  )
}
