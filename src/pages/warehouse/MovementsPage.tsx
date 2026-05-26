import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'

const MOVEMENTS = [
  { date: '2026-04-27 14:32', type: 'Kivét', src: 'CP-184-A', who: 'Nagy J.', mat: 'Bükk 18mm 2440×1830', qty: -8, unit: 'tábla', note: 'JT-2426-0184 · Bognár' },
  { date: '2026-04-27 11:48', type: 'Maradék', src: 'CP-184-A', who: 'Nagy J.', mat: 'Bükk 18mm 1200×380', qty: +1, unit: 'darab', note: 'OC-002 raktárba' },
  { date: '2026-04-27 09:15', type: 'Bevét', src: 'PO-2426-088', who: 'Raktár', mat: 'MDF 19mm 2440×1830', qty: +50, unit: 'tábla', note: 'Egger szállítás' },
  { date: '2026-04-26 16:48', type: 'Maradék', src: 'CP-182-A', who: 'Tóth K.', mat: 'Tölgy 22mm 400×600', qty: +1, unit: 'darab', note: 'OC-001 raktárba' },
  { date: '2026-04-26 11:02', type: 'Kivét', src: 'CP-182-A', who: 'Tóth K.', mat: 'Tölgy 40mm 2440×1830', qty: -22, unit: 'tábla', note: 'JT-2426-0182 · Doorstar' },
  { date: '2026-04-25 13:20', type: 'Bevét', src: 'PO-2426-091', who: 'Raktár', mat: 'Tölgy 22mm 2440×1830', qty: +30, unit: 'tábla', note: 'Falco szállítás' },
  { date: '2026-04-25 10:14', type: 'Kivét', src: 'CP-181-B', who: 'Kiss A.', mat: 'MDF 19mm 2440×1830', qty: -4, unit: 'tábla', note: 'JT-2426-0181 · Várdai' },
  { date: '2026-04-25 08:55', type: 'Korr.', src: 'Leltár', who: 'Szabó A.', mat: 'Csavar Spax 4×40', qty: -120, unit: 'db', note: 'Heti leltár' },
  { date: '2026-04-24 15:33', type: 'Maradék', src: 'CP-182-B', who: 'Tóth K.', mat: 'Tölgy 22mm 320×280', qty: +1, unit: 'darab', note: 'OC-007 sérült' },
  { date: '2026-04-24 14:00', type: 'Kivét', src: 'EB-180-1', who: 'Kiss A.', mat: 'ABS él 1mm fehér', qty: -120, unit: 'fm', note: 'JT-2426-0180 · élzárás' },
  { date: '2026-04-23 11:22', type: 'Bevét', src: 'PO-2426-087', who: 'Raktár', mat: 'Vasalat Blum CLIP top', qty: +200, unit: 'db', note: 'Blum szállítás' },
  { date: '2026-04-22 16:40', type: 'Kivét', src: 'CP-180-A', who: 'Nagy J.', mat: 'Bükk 18mm 2440×1830', qty: -5, unit: 'tábla', note: 'JT-2426-0180 · Hegyi' },
]

const MOV_TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  Bevét: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Kivét: { bg: 'bg-stone-100', fg: 'text-stone-700', dot: 'bg-stone-400' },
  Maradék: { bg: 'bg-sky-50', fg: 'text-sky-700', dot: 'bg-sky-500' },
  'Korr.': { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500' },
}

type FilterKey = 'all' | 'Bevét' | 'Kivét' | 'Maradék' | 'Korr.'

interface MovementsPageProps {
  embedded?: boolean
}

export function MovementsPage({ embedded = false }: MovementsPageProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [range, setRange] = useState('week')
  const [search, setSearch] = useState('')

  const types: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: 'all', label: 'Összes', count: MOVEMENTS.length },
    { key: 'Bevét', label: 'Bevét', count: MOVEMENTS.filter((m) => m.type === 'Bevét').length },
    { key: 'Kivét', label: 'Kivét', count: MOVEMENTS.filter((m) => m.type === 'Kivét').length },
    { key: 'Maradék', label: 'Maradék', count: MOVEMENTS.filter((m) => m.type === 'Maradék').length },
    { key: 'Korr.', label: 'Korrekció', count: MOVEMENTS.filter((m) => m.type === 'Korr.').length },
  ]

  const filtered = MOVEMENTS.filter((m) => {
    if (filter !== 'all' && m.type !== filter) return false
    if (
      search &&
      !m.mat.toLowerCase().includes(search.toLowerCase()) &&
      !m.src.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const totals = {
    in: MOVEMENTS.filter((m) => m.type === 'Bevét').length,
    out: MOVEMENTS.filter((m) => m.type === 'Kivét').length,
    off: MOVEMENTS.filter((m) => m.type === 'Maradék').length,
    adj: MOVEMENTS.filter((m) => m.type === 'Korr.').length,
  }

  return (
    <div className={embedded ? 'space-y-4' : 'px-7 py-6 space-y-4'}>
      {/* Summary cards — csak standalone módban */}
      {!embedded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Bevétek', value: totals.in, sub: 'e héten', tone: 'text-emerald-700' },
            { label: 'Kivétek', value: totals.out, sub: 'gyártásba', tone: 'text-stone-900' },
            { label: 'Maradékok', value: totals.off, sub: 'raktárba', tone: 'text-sky-700' },
            { label: 'Korrekciók', value: totals.adj, sub: 'leltárból', tone: 'text-amber-700' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.label}</div>
              <div className={`text-[28px] font-semibold tracking-tight mt-1 tabular-nums ${s.tone}`}>{s.value}</div>
              <div className="text-[10.5px] text-stone-500 mt-1">{s.sub}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {types.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition inline-flex items-center gap-1.5 ${
              filter === f.key
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
            }`}
          >
            {f.label}
            <span
              className={`px-1.5 rounded text-[10px] tabular-nums ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
        <span className="flex-1" />
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] bg-white"
        >
          <option value="today">Ma</option>
          <option value="week">Ezen a héten</option>
          <option value="month">Ebben a hónapban</option>
          <option value="all">Mind</option>
        </select>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Anyag/hivatkozás…"
            className="h-8 w-56 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] bg-white"
          />
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        </div>
      </div>

      {/* Movement timeline */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between bg-white">
          <div className="text-[12.5px] font-semibold text-stone-900">Anyagmozgás napló</div>
          <div className="text-[11px] text-stone-500">{filtered.length} / {MOVEMENTS.length} bejegyzés</div>
        </div>
        <div className="grid grid-cols-[140px_120px_minmax(0,1fr)_110px_120px_140px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-200/80 bg-stone-50/50 font-medium">
          <div>Dátum</div>
          <div>Típus</div>
          <div>Anyag</div>
          <div className="text-right">Mennyiség</div>
          <div>Hivatkozás</div>
          <div>Felelős</div>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[12px] text-stone-500">
            Nincs találat a megadott szűrőkre.
          </div>
        )}
        {filtered.map((r, i) => {
          const tone = MOV_TONE[r.type] ?? { bg: 'bg-stone-100', fg: 'text-stone-700', dot: 'bg-stone-400' }
          return (
            <div
              key={i}
              className="grid grid-cols-[140px_120px_minmax(0,1fr)_110px_120px_140px] gap-3 px-5 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/40 items-center text-[12px]"
            >
              <div className="font-mono text-stone-500 text-[11px]">{r.date}</div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${tone.bg} ${tone.fg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                  {r.type}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-stone-900 truncate font-medium">{r.mat}</div>
                <div className="text-[10.5px] text-stone-500 truncate">{r.note}</div>
              </div>
              <div
                className={`text-right font-mono tabular-nums font-semibold ${
                  r.qty > 0 ? 'text-emerald-700' : 'text-stone-700'
                }`}
              >
                {r.qty > 0 ? '+' : ''}
                {r.qty}
                <span className="font-normal text-[10px] text-stone-400 ml-1">{r.unit}</span>
              </div>
              <div className="font-mono text-[11px] text-teal-700 truncate">{r.src}</div>
              <div className="text-stone-600 text-[11.5px] truncate">{r.who}</div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
