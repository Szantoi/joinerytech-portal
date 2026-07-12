import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import { TASKS, TASK_PRIORITY_META, TASK_STATUS_META, type Task, type TaskStatus } from '../mocks/tasks'

// ── Helpers ────────────────────────────────────────────────────────────────
function TaskPriorityPill({ priority }: { priority: Task['priority'] }) {
  const m = TASK_PRIORITY_META[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function TaskStatusPill({ status }: { status: TaskStatus }) {
  const m = TASK_STATUS_META[status]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>
      {m.label}
    </span>
  )
}

// ── Task Detail SlideOver ──────────────────────────────────────────────────
function TaskDetailSlideOver({ task, onClose }: { task: Task | null; onClose: () => void }) {
  if (!task) return null
  return (
    <SlideOver open={true} onClose={onClose} title={task.title} subtitle={`${task.id} · ${task.assignee}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskPriorityPill priority={task.priority} />
          <TaskStatusPill status={task.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Határidő</div>
            <div className="text-[12px] font-mono text-stone-800">{task.dueDate}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Forrás</div>
            <div className="text-[12px] text-stone-800">{task.source}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Felelős</div>
            <div className="text-[12px] text-stone-800">{task.assignee}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Hozzászólások</div>
            <div className="text-[12px] text-stone-800">{task.commentsCount} db</div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
            Részfeladatok ({task.subtasksDone}/{task.subtasksTotal})
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full"
              style={{ width: task.subtasksTotal > 0 ? `${(task.subtasksDone / task.subtasksTotal) * 100}%` : '0%' }}
            />
          </div>
          <div className="text-[11px] text-stone-500 mt-1">{task.subtasksDone} / {task.subtasksTotal} teljesítve</div>
        </div>

        {task.description && (
          <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11.5px] text-stone-600">
            {task.description}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── My Tasks List ──────────────────────────────────────────────────────────
function MyTasksList() {
  const [selected, setSelected] = useState<Task | null>(null)
  const activeTasks = TASKS.filter((t) => t.status !== 'done')
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Saját feladatok</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Nyitott feladatok, határidő szerint</p>
      </div>
      <div className="space-y-2">
        {activeTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelected(task)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-violet-200 transition flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <TaskPriorityPill priority={task.priority} />
                <TaskStatusPill status={task.status} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{task.title}</div>
              <div className="text-[11px] text-stone-400 mt-1 font-mono">Határidő: {task.dueDate} · {task.assignee}</div>
            </div>
          </button>
        ))}
      </div>
      <TaskDetailSlideOver task={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Kanban Board ───────────────────────────────────────────────────────────
function KanbanBoard() {
  const [selected, setSelected] = useState<Task | null>(null)
  const columns: Array<{ status: TaskStatus; label: string }> = [
    { status: 'todo',       label: 'Todo' },
    { status: 'inprogress', label: 'In Progress' },
    { status: 'review',     label: 'Review' },
    { status: 'done',       label: 'Done' },
  ]
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kanban tábla</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {columns.map((col) => {
          const colTasks = TASKS.filter((t) => t.status === col.status)
          return (
            <div key={col.status} className="bg-stone-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <TaskStatusPill status={col.status} />
                <span className="text-[11px] text-stone-500">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelected(task)}
                    className="w-full text-left bg-white rounded-lg border border-stone-200 px-3 py-2.5 hover:shadow-sm hover:border-violet-200 transition"
                  >
                    <div className="mb-1.5">
                      <TaskPriorityPill priority={task.priority} />
                    </div>
                    <div className="text-[12px] font-semibold text-stone-900 leading-snug">{task.title}</div>
                    <div className="text-[10.5px] text-stone-400 mt-1">{task.assignee}</div>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{task.dueDate}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <TaskDetailSlideOver task={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Tasks Dashboard ────────────────────────────────────────────────────────
function TasksDashboard() {
  const [selected, setSelected] = useState<Task | null>(null)
  const today = '2026-06-16'

  const lejart     = TASKS.filter((t) => t.dueDate < today && t.status !== 'done').length
  const maEsedek   = TASKS.filter((t) => t.dueDate === today && t.status !== 'done').length
  const folyamatban = TASKS.filter((t) => t.status === 'inprogress').length
  const keszHeten  = TASKS.filter((t) => t.status === 'done').length

  const KpiCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className={`bg-white rounded-2xl border border-stone-200 p-4`}>
      <div className={`text-[22px] font-semibold text-${tone}-700 leading-none`}>{value}</div>
      <div className="text-[12px] font-medium text-stone-700 mt-2">{label}</div>
    </div>
  )

  const recentTasks = TASKS.filter((t) => t.status !== 'done').slice(0, 5)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Feladataim</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Személyes feladatok áttekintése</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Lejárt"             value={lejart}      tone="rose" />
        <KpiCard label="Ma esedékes"        value={maEsedek}    tone="amber" />
        <KpiCard label="Folyamatban"        value={folyamatban} tone="blue" />
        <KpiCard label="Kész ezen a héten"  value={keszHeten}   tone="emerald" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi feladatok</span>
        </div>
        <div className="divide-y divide-stone-50">
          {recentTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelected(task)}
              className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-stone-900 truncate">{task.title}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{task.assignee} · {task.dueDate}</div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <TaskPriorityPill priority={task.priority} />
                <TaskStatusPill status={task.status} />
              </div>
            </button>
          ))}
        </div>
      </Card>
      <TaskDetailSlideOver task={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Tasks World Page ───────────────────────────────────────────────────────
export function TasksWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'mytasks') return <MyTasksList />
    if (currentScreen === 'kanban')  return <KanbanBoard />
    return <TasksDashboard />
  }

  return (
    <WorldShell
      worldKey="tasks"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/tasks/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}
