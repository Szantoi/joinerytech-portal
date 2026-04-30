import { useState } from 'react'
import { Card, Icon, PrimaryBtn } from '../components/ui'
import { QUOTES, CUSTOMERS, QUOTE_TONE } from '../mocks/worlds'
import type { QuoteStatus } from '../types'

type SalesTab = 'pipeline' | 'quotes' | 'customers'

const fmt = (n: number) => (n / 1_000_000).toFixed(1) + 'M'

const FUNNEL = [
  { stage: 'Vázlat',       count: 4, value: 6_200_000,  color: 'bg-stone-300' },
  { stage: 'Kiküldve',     count: 9, value: 18_400_000, color: 'bg-sky-400' },
  { stage: 'Elfogadva',    count: 5, value: 24_900_000, color: 'bg-emerald-500' },
  { stage: 'Gyártásban',   count: 7, value: 31_200_000, color: 'bg-teal-500' },
  { stage: 'Kiszállítva',  count: 3, value: 12_800_000, color: 'bg-stone-700' },
]

const FILTER_KEYS: Array<{ key: 'all' | QuoteStatus; label: string }> = [
  { key: 'all',      label: 'Összes' },
  { key: 'draft',    label: 'Vázlat' },
  { key: 'sent',     label: 'Kiküldve' },
  { key: 'approved', label: 'Elfogadva' },
  { key: 'expired',  label: 'Lejárt' },
]

export function SalesPage() {
  const [tab, setTab] = useState<SalesTab>('pipeline')

  const tabs: Array<{ key: SalesTab; label: string }> = [
    { key: 'pipeline',  label: 'Értékesítés' },
    { key: 'quotes',    label: 'Ajánlatok' },
    { key: 'customers', label: 'Ügyfelek' },
  ]

  return (
    <div className="px-7 py-5 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 h-8 rounded-md text-[12px] font-medium transition ${
                tab === t.key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <PrimaryBtn icon="plus">Új ajánlat</PrimaryBtn>
      </div>

      {tab === 'pipeline'  && <SalesDashboard onTab={setTab} />}
      {tab === 'quotes'    && <SalesQuotes />}
      {tab === 'customers' && <SalesCustomers />}
    </div>
  )
}

function SalesDashboard({ onTab }: { onTab: (t: SalesTab) => void }) {
  const maxCount = Math.max(...FUNNEL.map((f) => f.count))
  const topCustomers = [...CUSTOMERS].sort((a, b) => b.ltv - a.ltv).slice(0, 5)
  const expiring = QUOTES.filter((q) => q.status === 'sent').slice(0, 4)

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Heti bevétel',      v: '8.4M Ft',  d: '+12% előző hét' },
          { l: 'Nyitott ajánlatok', v: '13',        d: '5 lejár 7 napon belül' },
          { l: 'Pipeline érték',    v: '93.5M Ft',  d: '28 ajánlat összesen' },
          { l: 'Konverziós ráta',   v: '62%',       d: 'elfogadás / kiküldés' },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.l}</div>
            <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1">{s.v}</div>
            <div className="text-[10.5px] text-stone-500 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline funnel */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-semibold text-stone-900">Pipeline</div>
            <div className="text-[11px] text-stone-500">Ajánlattól szállításig — aktuális állapot</div>
          </div>
          <button onClick={() => onTab('quotes')} className="text-[11.5px] text-indigo-700 font-medium hover:underline">Ajánlatok →</button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {FUNNEL.map((f) => {
            const w = (f.count / maxCount) * 100
            return (
              <div key={f.stage} className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{f.stage}</div>
                <div className="text-[26px] font-semibold tracking-tight text-stone-900 leading-none">{f.count}</div>
                <div className="text-[11px] text-stone-600 font-mono">{fmt(f.value)} Ft</div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className={`h-full ${f.color}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 relative">
          <svg viewBox="0 0 600 120" className="w-full h-24" preserveAspectRatio="none">
            {FUNNEL.map((f, i) => {
              const x0 = (i / FUNNEL.length) * 600
              const x1 = ((i + 1) / FUNNEL.length) * 600
              const h0 = 100 - (i / FUNNEL.length) * 50
              const h1 = 100 - ((i + 1) / FUNNEL.length) * 50
              const y0 = (120 - h0) / 2
              const y1 = (120 - h1) / 2
              const colors = ['#d6d3d1', '#7dd3fc', '#10b981', '#14b8a6', '#44403c']
              return (
                <path key={i}
                  d={`M ${x0},${y0} L ${x1},${y1} L ${x1},${y1 + h1} L ${x0},${y0 + h0} Z`}
                  fill={colors[i]} opacity="0.85"
                />
              )
            })}
          </svg>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-semibold text-stone-900">Lejáró ajánlatok</div>
              <div className="text-[11px] text-stone-500">Következő 14 nap</div>
            </div>
            <button onClick={() => onTab('quotes')} className="text-[11.5px] text-indigo-700 font-medium hover:underline">Mind →</button>
          </div>
          <div className="space-y-1.5">
            {expiring.map((q) => {
              const tone = QUOTE_TONE[q.status]
              return (
                <div key={q.id} className="grid grid-cols-[1fr_140px_120px_90px] gap-3 px-3 py-2.5 rounded-lg border border-stone-100 hover:bg-stone-50/40 items-center">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-stone-900 truncate">{q.customer}</div>
                    <div className="text-[10.5px] text-stone-500 font-mono">{q.id}</div>
                  </div>
                  <div className="text-[11px] text-stone-600 font-mono">{q.expires}</div>
                  <div className="text-[12px] font-semibold text-stone-900 font-mono text-right">{fmt(q.value)} Ft</div>
                  <span className={`px-2 h-6 inline-flex items-center justify-center rounded-full text-[10px] font-medium ${tone.bg} ${tone.fg}`}>{tone.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[14px] font-semibold text-stone-900 mb-3">Top ügyfelek (LTV)</div>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50/50">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-[10px] font-semibold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-stone-900 truncate">{c.name}</div>
                  <div className="text-[10.5px] text-stone-500">{c.city}</div>
                </div>
                <div className="text-[11.5px] font-semibold text-stone-900 font-mono">{fmt(c.ltv)}M</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SalesQuotes() {
  const [filter, setFilter] = useState<'all' | QuoteStatus>('all')
  const list = filter === 'all' ? QUOTES : QUOTES.filter((q) => q.status === filter)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_KEYS.map((f) => {
          const count = f.key === 'all' ? QUOTES.length : QUOTES.filter((q) => q.status === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition inline-flex items-center gap-1.5 ${
                filter === f.key ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {f.label}
              <span className={`px-1.5 rounded text-[10px] tabular-nums ${filter === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-600'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
              {['Azonosító', 'Ügyfél', 'Dátum', 'Lejár', 'Tételek', 'Felelős', 'Státusz', 'Érték'].map((col, i) => (
                <th key={col} className={`px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium${i === 7 ? ' text-right' : ''}`}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((q) => {
              const tone = QUOTE_TONE[q.status]
              return (
                <tr key={q.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                  <td className="px-5 py-2.5 font-mono text-stone-700">{q.id}</td>
                  <td className="px-5 py-2.5 font-medium text-stone-900">{q.customer}</td>
                  <td className="px-5 py-2.5 text-stone-600 font-mono">{q.date}</td>
                  <td className="px-5 py-2.5 text-stone-600 font-mono">{q.expires}</td>
                  <td className="px-5 py-2.5 text-stone-600">{q.items}</td>
                  <td className="px-5 py-2.5 text-stone-700">{q.owner}</td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${tone.bg} ${tone.fg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold text-stone-900 font-mono">{q.value.toLocaleString('hu-HU')} Ft</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function SalesCustomers() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input placeholder="Ügyfél keresése…" className="w-full h-9 pl-9 pr-3 rounded-lg border border-stone-200 text-[12px] bg-white outline-none focus:border-stone-400" />
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        </div>
        <div className="flex-1" />
        <button className="h-9 px-3 bg-indigo-600 text-white text-[11.5px] font-medium rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5">
          <Icon name="plus" size={12} />Új ügyfél
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CUSTOMERS.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-[12px] font-semibold">
                {c.name.split(' ').slice(0, 2).map((s) => s[0]).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-stone-900 truncate">{c.name}</div>
                <div className="text-[10.5px] text-stone-500">{c.city} · {c.since} óta</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-[11.5px]">
              <div className="flex justify-between"><span className="text-stone-500">Kapcsolattartó</span><span className="font-medium text-stone-900">{c.contact}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">E-mail</span><span className="font-mono text-stone-700 truncate ml-2 max-w-[160px]">{c.email}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Telefon</span><span className="font-mono text-stone-700">{c.phone}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="px-2 py-2 rounded-lg bg-stone-50 text-center">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Nyitott</div>
                <div className="text-[15px] font-semibold text-stone-900">{c.openOrders}</div>
              </div>
              <div className="px-2 py-2 rounded-lg bg-stone-50 text-center">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">LTV</div>
                <div className="text-[15px] font-semibold text-stone-900">{fmt(c.ltv)}M</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
