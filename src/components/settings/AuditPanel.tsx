import { useEffect } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { GhostBtn } from '../ui/Button'
import { AUDIT_LOG } from '../../mocks/extra'
import { useApi, API_BASE } from '../../hooks/useApi'

interface ApiAuditEvent {
  id: string
  eventType: string
  aggregateId: string
  stateHash: string
  occurredAt: string
  actorId: string | null
  sourceIp: string | null
  sourceBrand: string | null
}

interface AuditPage {
  items: ApiAuditEvent[]
  totalCount: number
}

function formatTs(iso: string): string {
  try {
    return iso.slice(0, 19).replace('T', ' ')
  } catch { return iso }
}

export function AuditPanel() {
  const { data: apiPage, refetch } = useApi<AuditPage>(
    `${API_BASE.kernel}/audit-events?pageSize=50`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = apiPage?.items
    ? apiPage.items.map(a => ({
        ts: formatTs(a.occurredAt),
        actor: a.actorId?.slice(0, 8) ?? a.sourceIp ?? '—',
        event: a.eventType,
        target: a.aggregateId.slice(0, 18),
        hash: a.stateHash.slice(0, 12) + '…',
        verified: true,
      }))
    : AUDIT_LOG

  const total = apiPage?.totalCount ?? AUDIT_LOG.length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12.5px] text-stone-500">
          {total} esemény · hash chain folyamatos
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
        {rows.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-[160px_140px_180px_1fr_120px_60px] gap-3 px-5 py-2.5 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60"
          >
            <div className="text-[11.5px] font-mono text-stone-600">{a.ts}</div>
            <div className="text-[11.5px] text-stone-700 truncate">{a.actor}</div>
            <div className="text-[11.5px] font-mono text-stone-700 truncate">{a.event}</div>
            <div className="text-[11.5px] font-mono text-stone-500 truncate">{a.target}</div>
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
