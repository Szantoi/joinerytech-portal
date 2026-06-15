export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'
export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  assignee: string
  source: string
  commentsCount: number
  subtasksDone: number
  subtasksTotal: number
}

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; bg: string; fg: string; dot: string }> = {
  urgent: { label: 'Sürgős',   bg: 'bg-rose-50',   fg: 'text-rose-700',   dot: 'bg-rose-500' },
  high:   { label: 'Magas',    bg: 'bg-amber-50',  fg: 'text-amber-700',  dot: 'bg-amber-500' },
  normal: { label: 'Közepes',  bg: 'bg-sky-50',    fg: 'text-sky-700',    dot: 'bg-sky-500' },
  low:    { label: 'Alacsony', bg: 'bg-stone-100', fg: 'text-stone-600',  dot: 'bg-stone-400' },
}

export const TASK_STATUS_META: Record<TaskStatus, { label: string; bg: string; fg: string }> = {
  todo:       { label: 'Teendő',      bg: 'bg-stone-100', fg: 'text-stone-600' },
  inprogress: { label: 'Folyamatban', bg: 'bg-blue-50',   fg: 'text-blue-700' },
  review:     { label: 'Átvizsgálás', bg: 'bg-amber-50',  fg: 'text-amber-700' },
  done:       { label: 'Kész',        bg: 'bg-emerald-50',fg: 'text-emerald-700' },
}

export const TASKS: Task[] = [
  {
    id: 'TASK-001', title: 'Doorstar ajánlat finalizálása',
    description: 'Az ajánlat végső értékeinek rögzítése és küldés.',
    priority: 'urgent', status: 'todo', dueDate: '2026-06-17',
    assignee: 'Kovács Péter', source: 'crm',
    subtasksDone: 1, subtasksTotal: 3, commentsCount: 2,
  },
  {
    id: 'TASK-002', title: 'NCR-2026-003 lezárása',
    description: 'Minőségi eltérés lezárása és jóváhagyása.',
    priority: 'high', status: 'inprogress', dueDate: '2026-06-18',
    assignee: 'Szabó Anna', source: 'quality',
    subtasksDone: 2, subtasksTotal: 4, commentsCount: 1,
  },
  {
    id: 'TASK-003', title: 'Karbantartási ütemterv felülvizsgálata',
    description: 'Q3 ütemterv ellenőrzése és szükség esetén módosítása.',
    priority: 'normal', status: 'inprogress', dueDate: '2026-06-20',
    assignee: 'Tóth Kinga', source: 'maintenance',
    subtasksDone: 0, subtasksTotal: 2, commentsCount: 0,
  },
  {
    id: 'TASK-004', title: 'Havi jelenléti riport',
    description: 'Június havi jelenléti összesítő elkészítése.',
    priority: 'normal', status: 'review', dueDate: '2026-06-16',
    assignee: 'Kiss András', source: 'attendance',
    subtasksDone: 3, subtasksTotal: 3, commentsCount: 3,
  },
  {
    id: 'TASK-005', title: 'EHS oktatás megszervezése',
    description: 'Kötelező munkavédelmi oktatás koordinálása.',
    priority: 'high', status: 'review', dueDate: '2026-06-19',
    assignee: 'Kovács Péter', source: 'ehs',
    subtasksDone: 1, subtasksTotal: 2, commentsCount: 1,
  },
  {
    id: 'TASK-006', title: 'Petőfi u. rajz jóváhagyás',
    description: 'Kiviteli rajz jóváhagyásának megszerzése.',
    priority: 'urgent', status: 'todo', dueDate: '2026-06-16',
    assignee: 'Németh Zsófia', source: 'docs',
    subtasksDone: 0, subtasksTotal: 1, commentsCount: 4,
  },
  {
    id: 'TASK-007', title: 'Q2 minőségi audit előkészítés',
    description: 'Q2 audit anyagok összegyűjtése és rendszerezése.',
    priority: 'high', status: 'done', dueDate: '2026-06-15',
    assignee: 'Szabó Anna', source: 'quality',
    subtasksDone: 5, subtasksTotal: 5, commentsCount: 2,
  },
  {
    id: 'TASK-008', title: 'Új szállító onboarding — Falco',
    description: 'Falco Sopron Zrt. onboarding folyamat lezárása.',
    priority: 'low', status: 'done', dueDate: '2026-06-14',
    assignee: 'Tóth Kinga', source: 'masterdata',
    subtasksDone: 2, subtasksTotal: 2, commentsCount: 0,
  },
]
