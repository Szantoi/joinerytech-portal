import { useState } from 'react'
import { Card, StatusPill, Icon } from '../components/ui'
import { STAGES, FLOW_EPICS } from '../mocks/extra'
import type { FlowEpic, FlowPriority } from '../types'

const PRIORITY_TONES: Record<FlowPriority, { bg: string; fg: string }> = {
  high: { bg: 'bg-rose-50', fg: 'text-rose-700' },
  med: { bg: 'bg-amber-50', fg: 'text-amber-700' },
  low: { bg: 'bg-stone-100', fg: 'text-stone-600' },
}

const PRIORITY_LABELS: Record<FlowPriority, string> = {
  high: 'Magas',
  med: 'Közepes',
  low: 'Alacsony',
}

export function WorkflowPage() {
  const [selectedEpic, setSelectedEpic] = useState<FlowEpic | null>(null)

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-semibold text-stone-900">Munkafolyamat</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const epics = FLOW_EPICS.filter((e) => e.stage === stage.key)
          return (
            <div key={stage.key} className="min-w-[260px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] font-semibold text-stone-700">{stage.hu}</span>
                <span className="text-[11px] text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">{epics.length}</span>
                {stage.optional && <span className="text-[10px] text-stone-400">(opcionális)</span>}
              </div>
              <div className="space-y-2">
                {epics.map((epic) => (
                  <FlowCard key={epic.id} epic={epic} onClick={() => setSelectedEpic(epic)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedEpic && (
        <DetailPanel epic={selectedEpic} onClose={() => setSelectedEpic(null)} />
      )}
    </div>
  )
}

function FlowCard({ epic, onClick }: { epic: FlowEpic; onClick: () => void }) {
  const tone = PRIORITY_TONES[epic.priority]
  return (
    <Card className="p-3 cursor-pointer hover:border-stone-300" interactive>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[12.5px] font-medium text-stone-900 leading-snug">{epic.title}</div>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
            {PRIORITY_LABELS[epic.priority]}
          </span>
        </div>
        <div className="text-[11px] text-stone-500 mt-1">{epic.customer}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-stone-200 grid place-items-center text-[8px] font-bold text-stone-600">
              {epic.assignee}
            </div>
            <span className="text-[10.5px] text-stone-400 font-mono">{epic.id}</span>
          </div>
          <span className="text-[10.5px] text-stone-500">{epic.due}</span>
        </div>
        {epic.delegated && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600">
            <Icon name="external" size={10} />
            Delegált
          </div>
        )}
      </button>
    </Card>
  )
}

function DetailPanel({ epic, onClose }: { epic: FlowEpic; onClose: () => void }) {
  const tone = PRIORITY_TONES[epic.priority]
  const currentStageIdx = STAGES.findIndex((s) => s.key === epic.stage)

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-stone-900">{epic.title}</h3>
          <p className="text-[12px] text-stone-500 mt-1">{epic.customer} &middot; {epic.id}</p>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
          {PRIORITY_LABELS[epic.priority]}
        </span>
        <StatusPill status={epic.stage === 'production' ? 'running' : 'draft'} label={STAGES.find((s) => s.key === epic.stage)?.hu ?? epic.stage} />
      </div>

      <div className="mt-5">
        <div className="text-[11px] text-stone-500 font-medium mb-2">Állapotvonal</div>
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold ${
                  i <= currentStageIdx ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-400'
                }`}
              >
                {i + 1}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentStageIdx ? 'bg-teal-500' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {STAGES.map((s) => (
            <div key={s.key} className="flex-1 text-center text-[9px] text-stone-400">{s.hu}</div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
        <div><span className="text-stone-500">Határidő: </span><span className="font-medium">{epic.due}</span></div>
        <div><span className="text-stone-500">Felelős: </span><span className="font-medium">{epic.assignee}</span></div>
        <div><span className="text-stone-500">Típus: </span><span className="font-medium">{epic.type}</span></div>
        <div><span className="text-stone-500">Delegált: </span><span className="font-medium">{epic.delegated ? 'Igen' : 'Nem'}</span></div>
      </div>
    </Card>
  )
}
