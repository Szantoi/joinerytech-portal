/**
 * StatusPill — generikus státusz-pill a 7 tónusú STATUS_TONES skálával.
 *
 * Spec: DESIGN_SYSTEM_SPEC_V1.md 2.5 fejezet.
 *  - A label mindig látható szövegként renderelt (dot/ikon-only tilos).
 *  - A dot dekoratív (`aria-hidden`); `terminal` tónusnál üreges (forma-jelzés).
 *  - Nem interaktív elem — kattinthatóvá `<button>`-ba csomagolva tehető.
 *
 * Tónus-feloldás (prioritás-sorrendben):
 *  1. `tone`          — közvetlen tónus
 *  2. `fsm` + `status` — modul-FSM készletből (theme/fsmTones.ts)
 *  3. `status`        — legacy státusz-kulcs (theme/statusTones.ts térképe)
 *  Ismeretlen kulcs → `neutral` + dev-warning.
 */

import { STATUS_TONES, resolveLegacyTone, type Tone } from '../../theme/statusTones'
import { resolveFsmTone, type FsmSet } from '../../theme/fsmTones'

// Kompat re-export: a korábbi `import { STATUS_TONES } from './StatusPill'` továbbra is működik
export { STATUS_TONES }
export type { Tone }

type PillSize = 'sm' | 'md'

const SIZE_CLASSES: Record<PillSize, string> = {
  sm: 'px-1.5 h-5 text-[10px]',
  md: 'px-2 py-0.5 text-[11px]',
}

interface StatusPillProps {
  /** Lokalizált, mindig látható státusznév. */
  label: string
  /** Közvetlen tónus — ha megadott, ez nyer. */
  tone?: Tone
  /** FSM státusz-készlet azonosító (a `status`-szal együtt használandó). */
  fsm?: FsmSet
  /** Státusz-kulcs: FSM-kulcs (`fsm` mellett) vagy legacy kulcs. */
  status?: string
  size?: PillSize
}

export function StatusPill({ label, tone, fsm, status, size = 'md' }: StatusPillProps) {
  const resolved: Tone =
    tone ??
    (fsm && status !== undefined
      ? resolveFsmTone(fsm, status)
      : resolveLegacyTone(status ?? 'neutral'))
  const t = STATUS_TONES[resolved]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${SIZE_CLASSES[size]} ${t.bg} ${t.fg}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  )
}
