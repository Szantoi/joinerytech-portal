import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { GhostBtn } from '../ui/Button'
import { AUDIT_LOG } from '../../mocks/extra'

export function AuditPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12.5px] text-stone-500">
          {AUDIT_LOG.length} esemény · hash chain folyamatos
        </div>
        <div className="flex items-center gap-2">
          <GhostBtn icon="check">Lánc ellenőrzése</GhostBtn>
          <GhostBtn icon="download">CSV</GhostBtn>
        </div>
      </div>
      <Card className="p-0">
        <div className="grid grid-cols-[160px_140px_180px_1fr_120px_60px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
          <div>Idő</div>
          <div>Felhasználó</div>
          <div>Esemény</div>
          <div>Cél</div>
          <div>Hash</div>
          <div className="text-right">OK</div>
        </div>
        {AUDIT_LOG.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-[160px_140px_180px_1fr_120px_60px] gap-3 px-5 py-2.5 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60"
          >
            <div className="text-[11.5px] font-mono text-stone-600">{a.ts}</div>
            <div className="text-[11.5px] text-stone-700">{a.actor}</div>
            <div className="text-[11.5px] font-mono text-stone-700">{a.event}</div>
            <div className="text-[11.5px] font-mono text-stone-500">{a.target}</div>
            <div className="text-[11px] font-mono text-teal-700">{a.hash}</div>
            <div className="text-right">
              {a.verified ? (
                <Icon name="check" size={14} className="inline text-emerald-600" />
              ) : (
                <Icon name="x" size={14} className="inline text-rose-500" />
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
