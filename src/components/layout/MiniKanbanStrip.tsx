import { useEffect } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { STAGES, FLOW_EPICS } from '../../mocks/extra'
import { useApi, API_BASE } from '../../hooks/useApi'
import { useAuth } from '../../auth'

interface ApiFlowEpic {
  id: string
  phase: 'Discovery' | 'Delivery' | 'ClosedDone'
}

interface PagedFlowEpics {
  items: ApiFlowEpic[]
  totalCount: number
}

const PHASE_TO_STAGE: Record<string, string> = {
  Discovery:  'sales',
  Delivery:   'production',
  ClosedDone: 'delivery',
}

interface MiniKanbanStripProps {
  onNav: (key: string) => void
}

export function MiniKanbanStrip({ onNav }: MiniKanbanStripProps) {
  const { facilityId } = useAuth()

  const { data: apiData, refetch } = useApi<PagedFlowEpics>(
    facilityId ? `${API_BASE.kernel}/facilities/${facilityId}/flow-epics?pageSize=200` : null
  )
  useEffect(() => { if (facilityId) refetch() }, [facilityId]) // eslint-disable-line react-hooks/exhaustive-deps

  const epics = apiData?.items ?? null

  const counts = STAGES.map((s) => ({
    ...s,
    count: epics
      ? epics.filter((e) => PHASE_TO_STAGE[e.phase] === s.key).length
      : FLOW_EPICS.filter((e) => e.stage === s.key).length,
  }))

  const total = epics ? epics.length : FLOW_EPICS.length

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[12.5px] font-semibold text-stone-900">Munkafolyamat áttekintés</div>
          <div className="text-[11px] text-stone-500">
            Doorstar StageChain · {total} aktív feladat
          </div>
        </div>
        <button
          onClick={() => onNav('workflow')}
          className="text-[11.5px] text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"
        >
          Megnyitás <Icon name="chevron" size={12} />
        </button>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${counts.length}, minmax(0, 1fr))` }}
      >
        {counts.map((s, i) => (
          <button
            key={s.key}
            onClick={() => onNav('workflow')}
            className="text-left bg-stone-50 hover:bg-teal-50/60 border border-stone-200/60 rounded-lg px-3 py-2.5 transition relative"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium truncate">
                {s.hu}
              </div>
              {s.optional && <span className="text-[8.5px] text-stone-400">opt</span>}
            </div>
            <div className="text-[22px] font-semibold tabular-nums text-stone-900 mt-0.5">{s.count}</div>
            {i < counts.length - 1 && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-stone-300 z-10 hidden lg:block">
                <Icon name="chevron" size={12} />
              </div>
            )}
          </button>
        ))}
      </div>
    </Card>
  )
}
