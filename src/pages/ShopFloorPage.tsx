import { useState } from 'react'
import { SHOPFLOOR_MACHINES, SHOPFLOOR_QUEUE, SHOPFLOOR_OPERATORS } from '../mocks/worlds'
import type { ShopFloorOperator, ShopFloorTask, Machine } from '../types'

type Stage = 'pin' | 'machine' | 'task'

export function ShopFloorPage() {
  const [stage, setStage] = useState<Stage>('pin')
  const [operator, setOperator] = useState<ShopFloorOperator | null>(null)
  const [machine, setMachine] = useState<Machine | null>(null)

  if (stage === 'pin') {
    return <PinStage onLogin={(op) => { setOperator(op); setStage('machine') }} />
  }

  if (stage === 'machine' && operator) {
    return (
      <MachinePickStage
        operator={operator}
        onPick={(m) => { setMachine(m); setStage('task') }}
        onBack={() => { setOperator(null); setStage('pin') }}
      />
    )
  }

  if (stage === 'task' && operator && machine) {
    return (
      <TaskStage
        operator={operator}
        machine={machine}
        onBack={() => { setMachine(null); setStage('machine') }}
        onLogout={() => { setOperator(null); setMachine(null); setStage('pin') }}
      />
    )
  }

  return null
}

function PinStage({ onLogin }: { onLogin: (op: ShopFloorOperator) => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleDigit(d: string) {
    const next = pin + d
    if (next.length <= 4) {
      setPin(next)
      setError(false)
      if (next.length === 4) {
        const found = SHOPFLOOR_OPERATORS.find((o) => o.pin === next)
        if (found) {
          onLogin(found)
        } else {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 800)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="w-80 text-center">
        <div className="text-white/40 text-[11px] uppercase tracking-[0.3em] font-medium mb-2">JoineryTech</div>
        <h1 className="text-[28px] font-semibold text-white tracking-tight mb-8">Shopfloor</h1>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition ${
                error ? 'border-rose-500 bg-rose-500' :
                i < pin.length ? 'border-teal-400 bg-teal-400' : 'border-white/25'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'C'].map((d) => {
            if (d === '') return <div key="empty" />
            if (d === 'C') {
              return (
                <button
                  key="clear"
                  onClick={() => { setPin(''); setError(false) }}
                  className="h-14 rounded-xl bg-white/5 text-white/60 text-[16px] font-medium hover:bg-white/10 transition"
                >
                  C
                </button>
              )
            }
            return (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-14 rounded-xl bg-white/8 text-white text-[20px] font-medium hover:bg-white/12 active:bg-white/16 transition"
              >
                {d}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 text-rose-400 text-[12px] font-medium">Hibás PIN</div>
        )}

        <div className="mt-8 text-white/25 text-[10px] font-mono">v3.2.1 &middot; Kiosk mód</div>
      </div>
    </div>
  )
}

function MachinePickStage({ operator, onPick, onBack }: { operator: ShopFloorOperator; onPick: (m: Machine) => void; onBack: () => void }) {
  const myMachines = SHOPFLOOR_MACHINES.filter((m) => operator.machines.includes(m.id))

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-white/40 text-[11px] uppercase tracking-wide">Operátor</div>
          <div className="text-white text-[18px] font-semibold">{operator.name}</div>
        </div>
        <button onClick={onBack} className="text-white/50 hover:text-white/80 text-[12px] px-3 py-1.5 border border-white/20 rounded-lg">
          Kijelentkezés
        </button>
      </div>

      <h2 className="text-white/60 text-[13px] font-medium uppercase tracking-wide mb-4">Válassz gépet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myMachines.map((m) => {
          const tasks = SHOPFLOOR_QUEUE[m.id] ?? []
          return (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              className="bg-white/5 border border-white/10 hover:border-teal-500/50 rounded-xl p-5 text-left transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${m.state === 'running' ? 'bg-teal-400 animate-pulse' : 'bg-white/20'}`} />
                <div className="text-white text-[15px] font-semibold">{m.name}</div>
              </div>
              <div className="text-white/50 text-[12px]">{m.kind} &middot; {m.facility}</div>
              <div className="text-white/40 text-[11px] mt-2">{tasks.length} feladat a sorban</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TaskStage({ operator, machine, onBack, onLogout }: {
  operator: ShopFloorOperator
  machine: Machine
  onBack: () => void
  onLogout: () => void
}) {
  const tasks = SHOPFLOOR_QUEUE[machine.id] ?? []
  const [currentIdx, setCurrentIdx] = useState(0)
  const task = tasks[currentIdx] as ShopFloorTask | undefined

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white/50 hover:text-white/80 text-[12px]">&larr; Gépek</button>
          <div className="text-white/20">|</div>
          <div>
            <div className="text-white text-[14px] font-semibold">{machine.name}</div>
            <div className="text-white/40 text-[11px]">{operator.name} &middot; {tasks.length} feladat</div>
          </div>
        </div>
        <button onClick={onLogout} className="text-white/50 hover:text-white/80 text-[12px] px-3 py-1.5 border border-white/20 rounded-lg">
          Kilépés
        </button>
      </header>

      <main className="flex-1 p-6">
        {!task ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[48px] mb-4">&#x2705;</div>
              <div className="text-white text-[18px] font-semibold">Nincs több feladat</div>
              <div className="text-white/50 text-[13px] mt-1">Minden elkészült ezen a gépen</div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-teal-400 text-[11px] uppercase tracking-wide font-medium">
                  {task.kind === 'cutting' ? 'Szabászat' : task.kind === 'edgeband' ? 'Élzárás' : 'CNC'}
                </div>
                <div className="text-white text-[20px] font-semibold mt-1">{task.order}</div>
                <div className="text-white/50 text-[12px]">{task.customer} &middot; {task.id}</div>
              </div>
              <div className="text-right">
                <div className="text-white/40 text-[11px]">Lap</div>
                <div className="text-white text-[24px] font-bold">{task.currentSheet}/{task.sheets}</div>
              </div>
            </div>

            {task.material && (
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-white/40 text-[11px] uppercase tracking-wide mb-1">Anyag</div>
                <div className="text-white text-[14px] font-medium">{task.material}</div>
              </div>
            )}

            {task.util !== undefined && (
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-white/40 text-[11px] uppercase tracking-wide mb-1">Kihasználtság</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${task.util}%` }} />
                  </div>
                  <span className="text-teal-400 text-[14px] font-semibold">{task.util}%</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCurrentIdx((i) => Math.min(i + 1, tasks.length))}
                className="flex-1 h-14 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-semibold transition"
              >
                Kész &rarr;
              </button>
              <button className="h-14 px-6 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 text-[14px] font-semibold hover:bg-rose-600/30 transition">
                Probléma
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-3 border-t border-white/8 flex justify-between text-white/25 text-[10px] font-mono">
        <span>JoineryTech Shopfloor &middot; Kiosk mód</span>
        <span>{currentIdx + 1} / {tasks.length}</span>
      </footer>
    </div>
  )
}
