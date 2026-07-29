import type { Tone } from '@spaceos/portal-ui'

/**
 * A prioritás-sávozás EGY helyen (PLAN-05 F4).
 *
 * Eddig két példányban élt — az `ExecutionGantt` festette a sávokat, az
 * `AssignmentConfirmModal` a megerősítő pillt —, és a kettő némán
 * elcsúszhatott volna egymástól. A sáv-határok termékdöntést hordoznak
 * („mi számít sürgősnek"), ezért nem másolandó.
 */

/** 1-3 alacsony · 4-6 közepes · 7-10 magas. */
export function priorityTone(priority: number): Tone {
  if (priority <= 3) return 'success'
  if (priority <= 6) return 'warn'
  return 'danger'
}

export function priorityLabel(priority: number): string {
  if (priority <= 3) return 'alacsony'
  if (priority <= 6) return 'közepes'
  return 'magas'
}
