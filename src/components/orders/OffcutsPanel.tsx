import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { StatusPill } from '../ui/StatusPill'
import { GhostBtn } from '../ui/Button'

const OFFCUTS = [
  { id: 'OC-007', mat: 'Tölgy 22mm', dims: '320×280 mm', src: 'CP-182-B', date: '2026-04-24', status: 'sérült', who: 'Tóth K.' },
  { id: 'OC-006', mat: 'Bükk 18mm', dims: '1200×380 mm', src: 'CP-184-A', date: '2026-04-27', status: 'raktár', who: 'Nagy J.' },
  { id: 'OC-005', mat: 'MDF 19mm', dims: '640×480 mm', src: 'CP-182-A', date: '2026-04-26', status: 'raktár', who: 'Tóth K.' },
  { id: 'OC-004', mat: 'Tölgy 40mm', dims: '800×220 mm', src: 'CP-182-A', date: '2026-04-26', status: 'felhasználható', who: 'Tóth K.' },
  { id: 'OC-003', mat: 'Bükk 18mm', dims: '400×600 mm', src: 'CP-180-A', date: '2026-04-25', status: 'felhasználható', who: 'Nagy J.' },
  { id: 'OC-002', mat: 'Bükk 18mm', dims: '1200×380 mm', src: 'CP-184-A', date: '2026-04-27', status: 'raktár', who: 'Nagy J.' },
  { id: 'OC-001', mat: 'Tölgy 22mm', dims: '400×600 mm', src: 'CP-182-A', date: '2026-04-26', status: 'raktár', who: 'Tóth K.' },
]

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  raktár: { bg: 'bg-sky-50', fg: 'text-sky-700' },
  felhasználható: { bg: 'bg-teal-50', fg: 'text-teal-700' },
  sérült: { bg: 'bg-rose-50', fg: 'text-rose-700' },
}

export function OffcutsPanel() {
  const byStatus = {
    raktár: OFFCUTS.filter((o) => o.status === 'raktár').length,
    felhasználható: OFFCUTS.filter((o) => o.status === 'felhasználható').length,
    sérült: OFFCUTS.filter((o) => o.status === 'sérült').length,
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Raktárban', value: byStatus.raktár, tone: 'text-sky-700' },
          { label: 'Felhasználható', value: byStatus.felhasználható, tone: 'text-teal-700' },
          { label: 'Sérült', value: byStatus.sérült, tone: 'text-rose-700' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.label}</div>
            <div className={`text-[28px] font-semibold mt-1 tabular-nums ${s.tone}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-stone-900">
            Maradék táblák nyilvántartása{' '}
            <span className="text-stone-400 font-normal tabular-nums">({OFFCUTS.length})</span>
          </div>
          <GhostBtn icon="download">Exportálás</GhostBtn>
        </div>
        <div className="grid grid-cols-[80px_1fr_140px_120px_100px_120px_100px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
          <div>ID</div>
          <div>Anyag</div>
          <div>Méret</div>
          <div>Forrás</div>
          <div>Dátum</div>
          <div>Felelős</div>
          <div>Státusz</div>
        </div>
        {OFFCUTS.map((o) => {
          const tone = STATUS_TONE[o.status] ?? { bg: 'bg-stone-100', fg: 'text-stone-700' }
          return (
            <div
              key={o.id}
              className="grid grid-cols-[80px_1fr_140px_120px_100px_120px_100px] gap-3 px-5 py-2.5 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/40 text-[12px]"
            >
              <div className="font-mono text-stone-500 text-[11px]">{o.id}</div>
              <div className="text-stone-900 font-medium truncate">{o.mat}</div>
              <div className="font-mono text-[11px] text-stone-600">{o.dims}</div>
              <div className="font-mono text-[11px] text-teal-700">{o.src}</div>
              <div className="text-stone-500 text-[11px]">{o.date}</div>
              <div className="text-stone-700">{o.who}</div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium ${tone.bg} ${tone.fg}`}
                >
                  <Icon name={o.status === 'sérült' ? 'alert' : 'check'} size={10} />
                  {o.status}
                </span>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
