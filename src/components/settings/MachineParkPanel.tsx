import { useEffect } from 'react'
import { Card } from '../ui/Card'
import { StatusPill } from '../ui/StatusPill'
import { PrimaryBtn } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { WORKSTATIONS } from '../../mocks/extra'
import { useApi, API_BASE } from '../../hooks/useApi'
import type { Workstation } from '../../types'

interface ApiWorkstation {
  id: string
  name: string
  status: string
  facilityId: string
}

interface ApiWorkstationsPage {
  items: ApiWorkstation[]
  totalCount: number
}

const WS_STATUS_MAP: Record<string, string> = {
  Active:      'ok',
  Running:     'ok',
  Idle:        'ok',
  Maintenance: 'low',
  Offline:     'critical',
  Disabled:    'critical',
  Fault:       'critical',
}

function apiWsToFe(w: ApiWorkstation): Workstation {
  return {
    name:        w.name,
    type:        '—',
    category:    'cnc',
    status:      WS_STATUS_MAP[w.status] ?? 'ok',
    capacity:    0,
    lastService: '—',
    operators:   [],
  }
}

export function MachineParkPanel() {
  const { data: apiPage, refetch } = useApi<ApiWorkstationsPage>(
    `${API_BASE.kernel}/tools/workstations?page=1&pageSize=50`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const workstations: Workstation[] = apiPage?.items?.length
    ? apiPage.items.map(apiWsToFe)
    : WORKSTATIONS

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12.5px] text-stone-500">
          {workstations.length} gép · {workstations.filter((w) => w.status === 'ok').length} aktív
        </div>
        <PrimaryBtn icon="plus">Gép hozzáadása</PrimaryBtn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {workstations.map((w) => {
          const label =
            w.status === 'ok' ? 'Aktív' : w.status === 'low' ? 'Karbantartás' : 'Leállítva'
          const barColor =
            w.status === 'critical' ? 'bg-rose-500' : w.status === 'low' ? 'bg-amber-500' : 'bg-teal-600'

          return (
            <Card key={w.name} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{w.name}</div>
                  <div className="text-[10.5px] text-stone-500">{w.type}</div>
                </div>
                <StatusPill
                  status={w.status === 'ok' ? 'ok' : w.status === 'low' ? 'low' : 'critical'}
                  label={label}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${w.capacity}%` }}
                  />
                </div>
                <span className="text-[10.5px] text-stone-500 tabular-nums">{w.capacity}%</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px]">
                <div>
                  <div className="text-stone-500">Utolsó karb.</div>
                  <div className="font-mono text-stone-700">{w.lastService}</div>
                </div>
                <div>
                  <div className="text-stone-500">Operator</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {w.operators.length === 0 && <span className="text-stone-400">—</span>}
                    {w.operators.map((o) => (
                      <Avatar key={o} id={o} size={16} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-stone-100">
                <button className="text-[10.5px] px-2 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700">
                  Aktív
                </button>
                <button className="text-[10.5px] px-2 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700">
                  Karb.
                </button>
                <button className="text-[10.5px] px-2 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700">
                  Leállít
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
