import { TASK_SLA_SOON_DAYS } from './config'
import { DAY_MS, parseDay } from '../../../services/dateUtils'

/**
 * Feladat-SLA — SZÁMÍTOTT mező (a backend számításának előképe, tesztelhető
 * tiszta függvények — az EHS validity.ts mintája szerint).
 *
 * ok      → a határidőig több mint TASK_SLA_SOON_DAYS nap van
 * soon    → a határidő TASK_SLA_SOON_DAYS napon belül esedékes
 * overdue → a határidő elmúlt (SLA-sértés)
 */

export type TaskSla = 'ok' | 'soon' | 'overdue'

/** Hátralévő egész napok a határidőig (negatív = lejárt), nap végéig számolva. */
export function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const due = parseDay(dueDate) // HELYI idejű nap-parse (NE `new Date(iso)`: UTC-csapda)
  due.setHours(23, 59, 59, 999) // a határidő napja még nem késés
  return Math.floor((due.getTime() - now.getTime()) / DAY_MS)
}

/** A feladat SLA-állapota a határidő alapján. */
export function computeTaskSla(dueDate: string, now: Date = new Date()): TaskSla {
  const days = daysUntilDue(dueDate, now)
  if (days < 0) return 'overdue'
  if (days <= TASK_SLA_SOON_DAYS) return 'soon'
  return 'ok'
}
