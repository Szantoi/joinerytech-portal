import { useState, useEffect } from 'react'
import { Card, Icon, GhostBtn, PrimaryBtn } from '../components/ui'
import { Avatar } from '../components/ui/Avatar'
import type { FlowEpic, FlowPriority, Stage } from '../types'

const STAGES: Stage[] = [
  { key: 'sales',      hu: 'Értékesítés', en: 'Sales' },
  { key: 'survey',     hu: 'Felmérés',    en: 'Survey', optional: true },
  { key: 'production', hu: 'Gyártás',     en: 'Production' },
  { key: 'delivery',   hu: 'Szállítás',   en: 'Delivery' },
  { key: 'install',    hu: 'Beszerelés',  en: 'Install' },
]
import { useApi, API_BASE } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { NewOrderDrawer } from '../components/orders/NewOrderDrawer'

interface ApiFlowEpic {
  id: string
  title: string
  targetFacilityId: string
  phase: 'Discovery' | 'Delivery' | 'ClosedDone'
  isDelegated: boolean
}

interface PagedFlowEpics {
  items: ApiFlowEpic[]
  totalCount: number
}

function apiEpicToFe(e: ApiFlowEpic): FlowEpic {
  const stageMap: Record<string, string> = {
    Discovery: 'sales',
    Delivery:  'production',
    ClosedDone: 'delivery',
  }
  return {
    id: e.id.slice(0, 13).toUpperCase(),
    title: e.title,
    customer: '—',
    type: 'door',
    stage: stageMap[e.phase] ?? 'sales',
    due: '',
    assignee: 'SA',
    priority: 'med',
    delegated: e.isDelegated,
  }
}

const PRIORITY_TONES: Record<FlowPriority, { bg: string; fg: string; label: string }> = {
  high: { bg: 'bg-rose-100', fg: 'text-rose-700', label: 'Magas' },
  med:  { bg: 'bg-amber-100', fg: 'text-amber-700', label: 'Közepes' },
  low:  { bg: 'bg-stone-100', fg: 'text-stone-600', label: 'Alacsony' },
}

const ASSIGNEE_NAMES: Record<string, string> = {
  NJ: 'Nagy János', TK: 'Tóth Kinga', KA: 'Kiss András',
  SA: 'Szabó Anna', HE: 'Horváth Éva',
}

const ASSIGNEES = Object.keys(ASSIGNEE_NAMES)

const TODAY = new Date('2026-04-30')

export function WorkflowPage() {
  const { facilityId } = useAuth()
  const url = facilityId ? `${API_BASE.kernel}/facilities/${facilityId}/flow-epics?pageSize=50` : null
  const { data: apiData, refetch } = useApi<PagedFlowEpics>(url)
  useEffect(() => { if (facilityId) refetch() }, [facilityId]) // eslint-disable-line react-hooks/exhaustive-deps

  const apiEpics = apiData?.items?.map(apiEpicToFe) ?? null
  const [epics, setEpics] = useState<FlowEpic[]>([])
  const [selected, setSelected] = useState<FlowEpic | null>(null)
  const [search, setSearch] = useState('')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false)
  const [epicForOrder, setEpicForOrder] = useState<FlowEpic | null>(null)

  const displayEpics = apiEpics ?? epics
  const setDisplayEpics = apiEpics ? (_fn: (prev: FlowEpic[]) => FlowEpic[]) => {} : setEpics

  const filtered = displayEpics.filter((e) => {
    if (filterAssignee !== 'all' && e.assignee !== filterAssignee) return false
    if (search) {
      const q = search.toLowerCase()
      if (!e.title.toLowerCase().includes(q) && !e.customer.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const onDrop = (stageKey: string) => (ev: React.DragEvent) => {
    ev.preventDefault()
    const id = ev.dataTransfer.getData('text/plain')
    setDisplayEpics((prev) => prev.map((ep) => ep.id === id ? { ...ep, stage: stageKey } : ep))
    setDragOver(null)
  }

  return (
    <div className="px-7 py-5 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[13px] font-semibold text-stone-900 mr-1">Munkafolyamat</span>
        <div className="flex items-center gap-2 px-3 h-9 w-[280px] rounded-lg bg-white border border-stone-200 text-stone-500">
          <Icon name="search" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés feladat / megrendelő..."
            className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-stone-400"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
          <button
            onClick={() => setFilterAssignee('all')}
            className={`px-2.5 h-7 rounded-md text-[12px] font-medium transition ${filterAssignee === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            Mind
          </button>
          {ASSIGNEES.map((k) => (
            <button
              key={k}
              onClick={() => setFilterAssignee(filterAssignee === k ? 'all' : k)}
              className={`w-7 h-7 rounded-md grid place-items-center transition ${filterAssignee === k ? 'ring-2 ring-stone-900 ring-offset-1' : ''}`}
            >
              <Avatar id={k} size={20} />
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <GhostBtn icon="filter">Szűrő</GhostBtn>
        <PrimaryBtn icon="plus">Új feladat</PrimaryBtn>
      </div>

      <div
        className="flex md:grid gap-3 overflow-x-auto md:overflow-visible -mx-7 md:mx-0 px-7 md:px-0 pb-2 md:pb-0"
        style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }}
      >
        {STAGES.map((s) => {
          const colEpics = filtered.filter((e) => e.stage === s.key)
          const isOver = dragOver === s.key
          return (
            <div
              key={s.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s.key) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={onDrop(s.key)}
              className={`shrink-0 w-[260px] md:w-auto rounded-xl border-2 transition ${isOver ? 'border-teal-400 bg-teal-50/40' : 'border-transparent bg-stone-100/60'}`}
            >
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold text-stone-900">{s.hu}</div>
                  {s.optional && (
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-500 font-medium">opt.</span>
                  )}
                </div>
                <span className="text-[11px] tabular-nums text-stone-500 bg-white border border-stone-200 rounded-full px-1.5">{colEpics.length}</span>
              </div>
              <div className="px-2 pb-2 space-y-2 min-h-[200px]">
                {colEpics.map((epic) => (
                  <FlowCard key={epic.id} epic={epic} onOpen={setSelected} />
                ))}
                {colEpics.length === 0 && (
                  <div className="text-[11px] text-stone-400 text-center py-6 border-2 border-dashed border-stone-200 rounded-lg">
                    Helyőrző
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <DetailPanel
        epic={selected}
        onClose={() => setSelected(null)}
        onStartOrder={(epic) => {
          setEpicForOrder(epic)
          setOrderDrawerOpen(true)
        }}
      />

      <NewOrderDrawer
        open={orderDrawerOpen}
        onClose={() => setOrderDrawerOpen(false)}
        flowEpicId={epicForOrder?.id}
        onSuccess={() => {
          setOrderDrawerOpen(false)
        }}
      />
    </div>
  )
}

function FlowCard({ epic, onOpen }: { epic: FlowEpic; onOpen: (e: FlowEpic) => void }) {
  const pri = PRIORITY_TONES[epic.priority]
  const due = new Date(epic.due)
  const days = Math.round((due.getTime() - TODAY.getTime()) / 86400000)
  const dueColor = days < 2 ? 'text-rose-600' : days < 7 ? 'text-amber-600' : 'text-stone-500'
  const dueLabel = days < 0 ? `${-days}n késés` : days === 0 ? 'Ma' : `${days}n múlva`

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', epic.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onOpen(epic)}
      className="bg-white border border-stone-200/80 rounded-lg p-3 cursor-pointer hover:border-stone-300 hover:shadow-sm transition active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-[10.5px] font-mono text-stone-400">{epic.id}</div>
        <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-medium ${pri.bg} ${pri.fg}`}>{pri.label}</span>
      </div>
      <div className="text-[12.5px] font-semibold text-stone-900 leading-snug mb-0.5">{epic.title}</div>
      <div className="text-[11px] text-stone-500 truncate">{epic.customer}</div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar id={epic.assignee} size={22} />
          {epic.delegated && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium border border-violet-100">B2B</span>
          )}
        </div>
        <div className={`text-[10.5px] font-mono ${dueColor}`}>{dueLabel}</div>
      </div>
    </div>
  )
}

function DetailPanel({ epic, onClose, onStartOrder }: { epic: FlowEpic | null; onClose: () => void; onStartOrder: (epic: FlowEpic) => void }) {
  if (!epic) return null
  const stageIdx = STAGES.findIndex((s) => s.key === epic.stage)

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl border-l border-stone-200 overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-3 flex items-start gap-3 z-10">
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-mono text-stone-400">{epic.id}</div>
            <div className="text-[15px] font-semibold text-stone-900 leading-tight">{epic.title}</div>
            <div className="text-[11.5px] text-stone-500 mt-0.5">{epic.customer}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Állapotvonal</div>
            <div className="flex items-center gap-1">
              {STAGES.map((s, i) => {
                const passed = i < stageIdx
                const current = i === stageIdx
                return (
                  <div key={s.key} className="flex items-center gap-1 flex-1">
                    <div className={`flex-1 flex flex-col items-center gap-1 ${current ? 'text-teal-700' : passed ? 'text-stone-700' : 'text-stone-400'}`}>
                      <div className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-semibold border-2 ${
                        current ? 'bg-teal-600 text-white border-teal-600' :
                        passed  ? 'bg-stone-700 text-white border-stone-700' :
                                  'bg-white border-stone-300'
                      }`}>
                        {passed ? <Icon name="check" size={11} /> : i + 1}
                      </div>
                      <div className="text-[10px] font-medium text-center leading-tight">{s.hu}</div>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`h-0.5 w-4 shrink-0 mt-[-12px] ${i < stageIdx ? 'bg-stone-700' : 'bg-stone-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Határidő</div>
              <div className="text-[13px] font-mono text-stone-900 mt-0.5">{epic.due}</div>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Hozzárendelt</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Avatar id={epic.assignee} size={18} />
                <span className="text-[12.5px] text-stone-900">{ASSIGNEE_NAMES[epic.assignee] ?? epic.assignee}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Stage handoff napló</div>
            <div className="space-y-2">
              {STAGES.slice(0, stageIdx + 1).map((s, i) => (
                <div key={s.key} className="flex items-start gap-2 text-[11.5px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-stone-900 font-medium">{s.hu}</span>
                    <span className="text-stone-500"> · {ASSIGNEE_NAMES[epic.assignee] ?? epic.assignee} · </span>
                    <span className="font-mono text-stone-400">2026-04-{20 + i}</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-stone-400">hash:{(0xa3f + i).toString(16)}b2</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Csatolmányok</div>
            <div className="grid grid-cols-3 gap-2">
              {['Rajz.pdf', 'Anyaglista.pdf', 'Foto-3.jpg'].map((f, i) => (
                <div key={i} className="bg-stone-50 border border-stone-200/70 rounded-lg p-2.5 text-center">
                  <div className="text-stone-400 mb-1 flex justify-center"><Icon name="download" size={16} /></div>
                  <div className="text-[10.5px] font-mono text-stone-700 truncate">{f}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
            <PrimaryBtn icon="check">Következő stage</PrimaryBtn>
            <PrimaryBtn icon="plus" onClick={() => onStartOrder(epic)}>Rendelés indítása</PrimaryBtn>
            <GhostBtn icon="external">Átadás partnernek</GhostBtn>
            <GhostBtn icon="settings">Lépés átugrása</GhostBtn>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Snapshot history · Proof chain</div>
            <div className="bg-stone-900 text-stone-100 rounded-lg p-3 font-mono text-[10.5px] leading-relaxed">
              <div className="flex justify-between"><span className="text-stone-400">v3 · prev hash</span><span className="text-teal-300">a3f4b29c</span></div>
              <div className="flex justify-between"><span className="text-stone-400">v2 · prev hash</span><span className="text-teal-300">9e2c8d11</span></div>
              <div className="flex justify-between"><span className="text-stone-400">v1 · root hash</span><span className="text-teal-300">f1d04b87</span></div>
              <div className="mt-2 pt-2 border-t border-stone-700 flex items-center gap-1.5 text-emerald-400">
                <Icon name="check" size={12} /> Lánc érvényes
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
