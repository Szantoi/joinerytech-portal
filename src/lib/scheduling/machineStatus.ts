import type { Tone } from '@spaceos/portal-ui'
import type { Machine } from '../../types/scheduling.types'

/**
 * A gép-állapot megjelenítése EGY helyen (a prioritás-sávozás mintájára).
 *
 * A státusz két külön dolgot hordoz: mit ÍR KI (magyar címke) és mit JELENT
 * (tónus). A kettő szándékosan külön térkép — a tónus a design-system
 * szemantikája, nem a szöveg fordítása. Eddig a `MachineDropZone`-ban élt
 * lokálisan; a kiosztás-megerősítő dialógusnak is kell, és a két felületnek
 * ugyanazt kell mondania ugyanarról a gépről.
 */

const STATUS_LABELS: Record<Machine['status'], string> = {
  Available: 'Szabad',
  Busy: 'Foglalt',
  Maintenance: 'Karbantartás alatt',
}

const STATUS_TONE: Record<Machine['status'], Tone> = {
  Available: 'success',
  Busy: 'warn',
  Maintenance: 'danger',
}

/** Ismeretlen (API-ból jövő új) státuszra a nyers értéket adjuk, nem dobunk. */
export function machineStatusLabel(status: Machine['status']): string {
  return STATUS_LABELS[status] ?? status
}

export function machineStatusTone(status: Machine['status']): Tone {
  return STATUS_TONE[status] ?? 'neutral'
}
