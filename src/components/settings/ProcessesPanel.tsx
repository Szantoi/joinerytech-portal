import { useState } from 'react'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { SlideOver } from '../ui/SlideOver'
import { FACILITIES } from '../../mocks/extra2'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessStep {
  id: string
  name: string
  type: 'phase' | 'step' | 'branch' | 'parallel' | 'loop' | 'external'
}

interface Process {
  id: string
  name: string
  description: string
  facilityId: string
  steps: ProcessStep[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProcessStats {
  phases: number
  steps: number
  branches: number
  parallels: number
  loops: number
  externals: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROCESSES: Process[] = [
  {
    id: 'proc-001',
    name: 'Ajtógyártás — Standard',
    description: 'Belső ajtók gyártási folyamata szabványos méretekre',
    facilityId: 'fac-vac',
    steps: [
      { id: 's1', name: 'Anyagbeszerzés', type: 'phase' },
      { id: 's2', name: 'Szabászat', type: 'step' },
      { id: 's3', name: 'CNC megmunkálás', type: 'step' },
      { id: 's4', name: 'Festés/Lakk', type: 'branch' },
      { id: 's5', name: 'Összeszerelés', type: 'step' },
      { id: 's6', name: 'Csomagolás', type: 'step' },
      { id: 's7', name: 'Minőségellenőrzés', type: 'loop' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-06-10',
  },
  {
    id: 'proc-002',
    name: 'Ajtógyártás — Egyedi',
    description: 'Egyedi méretű és mintázatú ajtók gyártása',
    facilityId: 'fac-vac',
    steps: [
      { id: 's1', name: 'Tervezés', type: 'phase' },
      { id: 's2', name: 'Anyagbeszerzés', type: 'external' },
      { id: 's3', name: 'Szabászat', type: 'step' },
      { id: 's4', name: 'CNC', type: 'parallel' },
      { id: 's5', name: 'Felületkezelés', type: 'step' },
      { id: 's6', name: 'Összeszerelés', type: 'step' },
    ],
    isActive: true,
    createdAt: '2026-02-20',
    updatedAt: '2026-06-08',
  },
  {
    id: 'proc-003',
    name: 'Tokgyártás',
    description: 'Ajtótokok gyártása különböző falvastagságokra',
    facilityId: 'fac-vac',
    steps: [
      { id: 's1', name: 'Anyag előkészítés', type: 'phase' },
      { id: 's2', name: 'Profilozás', type: 'step' },
      { id: 's3', name: 'Vágás', type: 'step' },
      { id: 's4', name: 'Felületkezelés', type: 'branch' },
    ],
    isActive: true,
    createdAt: '2026-03-01',
    updatedAt: '2026-05-15',
  },
  {
    id: 'proc-004',
    name: 'Raktári készletezés',
    description: 'Alapanyagok és félkész termékek raktári kezelése',
    facilityId: 'fac-szekszard',
    steps: [
      { id: 's1', name: 'Bevételezés', type: 'phase' },
      { id: 's2', name: 'Ellenőrzés', type: 'step' },
      { id: 's3', name: 'Tárolás', type: 'step' },
      { id: 's4', name: 'Kiadás', type: 'step' },
    ],
    isActive: false,
    createdAt: '2026-01-10',
    updatedAt: '2026-04-20',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function processStepStats(proc: Process): ProcessStats {
  return proc.steps.reduce(
    (acc, step) => {
      switch (step.type) {
        case 'phase': acc.phases++; break
        case 'step': acc.steps++; break
        case 'branch': acc.branches++; break
        case 'parallel': acc.parallels++; break
        case 'loop': acc.loops++; break
        case 'external': acc.externals++; break
      }
      return acc
    },
    { phases: 0, steps: 0, branches: 0, parallels: 0, loops: 0, externals: 0 }
  )
}

const STEP_TYPE_STYLES: Record<ProcessStep['type'], { icon: string; bg: string; text: string; label: string }> = {
  phase:    { icon: 'layers', bg: 'bg-teal-50', text: 'text-teal-700', label: 'Fázis' },
  step:     { icon: 'chevron', bg: 'bg-stone-100', text: 'text-stone-700', label: 'Lépés' },
  branch:   { icon: 'route', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Elágazás' },
  parallel: { icon: 'workflow', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Párhuzam' },
  loop:     { icon: 'bolt', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Ciklus' },
  external: { icon: 'external', bg: 'bg-rose-50', text: 'text-rose-700', label: 'Külső' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProcessesPanel() {
  const [processes, setProcesses] = useState<Process[]>(MOCK_PROCESSES)
  const [selectedFacility, setSelectedFacility] = useState<string>('all')
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filteredProcesses = selectedFacility === 'all'
    ? processes
    : processes.filter((p) => p.facilityId === selectedFacility)

  function handleAddProcess(empty = false) {
    const newProcess: Process = {
      id: `proc-${Date.now()}`,
      name: empty ? 'Új üres folyamat' : 'Új folyamat',
      description: empty ? '' : 'Folyamat leírása',
      facilityId: selectedFacility === 'all' ? FACILITIES[0].id : selectedFacility,
      steps: empty ? [] : [
        { id: 's1', name: 'Kezdő fázis', type: 'phase' },
        { id: 's2', name: 'Első lépés', type: 'step' },
      ],
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setProcesses((prev) => [...prev, newProcess])
    setEditingProcess(newProcess)
  }

  function handleDuplicate(proc: Process) {
    const duplicate: Process = {
      ...proc,
      id: `proc-${Date.now()}`,
      name: `${proc.name} (másolat)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setProcesses((prev) => [...prev, duplicate])
  }

  function handleDelete(id: string) {
    setProcesses((prev) => prev.filter((p) => p.id !== id))
    setConfirmDelete(null)
  }

  function handleSaveProcess(updated: Process) {
    setProcesses((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...updated, updatedAt: new Date().toISOString().split('T')[0] } : p))
    )
    setEditingProcess(null)
  }

  return (
    <div className="space-y-4">
      {/* Facility selector tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedFacility('all')}
          className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition ${
            selectedFacility === 'all'
              ? 'bg-teal-50 border-teal-300 text-teal-800'
              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
          }`}
        >
          Összes telephely
        </button>
        {FACILITIES.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFacility(f.id)}
            className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition ${
              selectedFacility === f.id
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            {f.name.split('—')[0].trim()}
          </button>
        ))}
      </div>

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] text-stone-500">
          {filteredProcesses.length} folyamat
          {selectedFacility !== 'all' && ` · ${FACILITIES.find((f) => f.id === selectedFacility)?.name ?? ''}`}
        </div>
        <div className="flex items-center gap-2">
          <GhostBtn icon="plus" onClick={() => handleAddProcess(true)}>
            Üres folyamat
          </GhostBtn>
          <PrimaryBtn icon="plus" onClick={() => handleAddProcess(false)}>
            Új folyamat
          </PrimaryBtn>
        </div>
      </div>

      {/* Process cards grid */}
      {filteredProcesses.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-[13px] text-stone-500">Nincs folyamat ezen a telephelyen</div>
          <div className="text-[11px] text-stone-400 mt-1">Hozzon létre egy újat a gombokkal</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProcesses.map((proc) => {
            const stats = processStepStats(proc)
            const facility = FACILITIES.find((f) => f.id === proc.facilityId)
            return (
              <div
                key={proc.id}
                onClick={() => setEditingProcess(proc)}
                className={`bg-white border border-stone-200/80 rounded-xl p-4 cursor-pointer hover:border-teal-300 transition ${
                  !proc.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[13px] font-semibold text-stone-900 truncate">
                        {proc.name}
                      </div>
                      {!proc.isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-stone-100 text-stone-500 font-medium">
                          Inaktív
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 line-clamp-2">
                      {proc.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(proc) }}
                      title="Duplikálás"
                      className="w-7 h-7 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-500 grid place-items-center transition"
                    >
                      <Icon name="layers" size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(proc.id) }}
                      title="Törlés"
                      className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 grid place-items-center transition"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                </div>

                {/* Stats chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {stats.phases > 0 && (
                    <StatsChip type="phase" count={stats.phases} />
                  )}
                  {stats.steps > 0 && (
                    <StatsChip type="step" count={stats.steps} />
                  )}
                  {stats.branches > 0 && (
                    <StatsChip type="branch" count={stats.branches} />
                  )}
                  {stats.parallels > 0 && (
                    <StatsChip type="parallel" count={stats.parallels} />
                  )}
                  {stats.loops > 0 && (
                    <StatsChip type="loop" count={stats.loops} />
                  )}
                  {stats.externals > 0 && (
                    <StatsChip type="external" count={stats.externals} />
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-500">
                  <div className="flex items-center gap-1">
                    <Icon name="factory" size={11} />
                    <span>{facility?.name.split('—')[0].trim() ?? 'Ismeretlen'}</span>
                  </div>
                  <div>Frissítve: {proc.updatedAt}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="text-[14px] font-semibold text-stone-900 mb-2">Folyamat törlése</div>
            <div className="text-[12px] text-stone-600 mb-4">
              Biztosan törölni szeretné ezt a folyamatot? Ez a művelet nem vonható vissza.
            </div>
            <div className="flex justify-end gap-2">
              <GhostBtn onClick={() => setConfirmDelete(null)}>Mégse</GhostBtn>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="h-9 px-4 rounded-lg bg-rose-600 text-white text-[12px] font-medium hover:bg-rose-700 transition"
              >
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Editor SlideOver */}
      <SlideOver
        open={!!editingProcess}
        onClose={() => setEditingProcess(null)}
        title={editingProcess?.name ?? 'Folyamat szerkesztése'}
        subtitle={editingProcess?.description}
        width={540}
        footer={
          <>
            <GhostBtn onClick={() => setEditingProcess(null)}>Mégse</GhostBtn>
            <PrimaryBtn
              icon="check"
              onClick={() => editingProcess && handleSaveProcess(editingProcess)}
            >
              Mentés
            </PrimaryBtn>
          </>
        }
      >
        {editingProcess && (
          <ProcessEditor
            process={editingProcess}
            onChange={setEditingProcess}
          />
        )}
      </SlideOver>
    </div>
  )
}

// ─── Stats Chip ───────────────────────────────────────────────────────────────

function StatsChip({ type, count }: { type: ProcessStep['type']; count: number }) {
  const style = STEP_TYPE_STYLES[type]
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${style.bg} ${style.text}`}
    >
      <Icon name={style.icon} size={10} />
      <span>{count} {style.label}</span>
    </div>
  )
}

// ─── Process Editor ───────────────────────────────────────────────────────────

interface ProcessEditorProps {
  process: Process
  onChange: (process: Process) => void
}

function ProcessEditor({ process, onChange }: ProcessEditorProps) {
  return (
    <div className="px-5 py-4 space-y-4">
      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
          Folyamat neve
        </label>
        <input
          type="text"
          value={process.name}
          onChange={(e) => onChange({ ...process, name: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
          Leírás
        </label>
        <textarea
          value={process.description}
          onChange={(e) => onChange({ ...process, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12.5px] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Telephely
          </label>
          <select
            value={process.facilityId}
            onChange={(e) => onChange({ ...process, facilityId: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Állapot
          </label>
          <select
            value={process.isActive ? 'active' : 'inactive'}
            onChange={(e) => onChange({ ...process, isActive: e.target.value === 'active' })}
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="active">Aktív</option>
            <option value="inactive">Inaktív</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">
            Lépések ({process.steps.length})
          </label>
          <button
            onClick={() => {
              const newStep: ProcessStep = {
                id: `s-${Date.now()}`,
                name: 'Új lépés',
                type: 'step',
              }
              onChange({ ...process, steps: [...process.steps, newStep] })
            }}
            className="text-[10.5px] text-teal-700 hover:text-teal-900 font-medium"
          >
            + Lépés hozzáadása
          </button>
        </div>
        <div className="space-y-2">
          {process.steps.map((step, idx) => {
            const style = STEP_TYPE_STYLES[step.type]
            return (
              <div
                key={step.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-stone-200 bg-stone-50/50"
              >
                <div
                  className={`w-6 h-6 rounded-md grid place-items-center text-[10px] font-bold ${style.bg} ${style.text}`}
                >
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => {
                    const updatedSteps = process.steps.map((s) =>
                      s.id === step.id ? { ...s, name: e.target.value } : s
                    )
                    onChange({ ...process, steps: updatedSteps })
                  }}
                  className="flex-1 h-8 px-2 rounded border border-stone-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <select
                  value={step.type}
                  onChange={(e) => {
                    const updatedSteps = process.steps.map((s) =>
                      s.id === step.id ? { ...s, type: e.target.value as ProcessStep['type'] } : s
                    )
                    onChange({ ...process, steps: updatedSteps })
                  }}
                  className="h-8 px-2 rounded border border-stone-200 text-[11px] bg-white focus:outline-none"
                >
                  {Object.entries(STEP_TYPE_STYLES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const updatedSteps = process.steps.filter((s) => s.id !== step.id)
                    onChange({ ...process, steps: updatedSteps })
                  }}
                  className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 grid place-items-center"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            )
          })}
          {process.steps.length === 0 && (
            <div className="text-[11px] text-stone-400 italic text-center py-4">
              Nincs lépés — kattintson a "Lépés hozzáadása" gombra
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
