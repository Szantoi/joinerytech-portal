/**
 * EHS FSM-átmenet táblák — a backend domain guardok tükörképe (openapi.yaml).
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre — a backenddel egyezően).
 */

// ── Státusz-készletek (openapi enumok) ──────────────────────────────────────
export type IncidentStatus =
  | 'Reported'
  | 'Investigated'
  | 'CorrectiveActionPlanned'
  | 'Closed'
  | 'Reopened'

export type PpeIssuanceStatus = 'Issued' | 'Acknowledged' | 'Returned' | 'Replaced'

export type SafetyWalkStatus = 'Scheduled' | 'InProgress' | 'ActionRequired' | 'Closed' | 'Cancelled'

// ── Átmenet-szabály: melyik akció melyik állapot(ok)ból indítható ───────────
export interface FsmRule<S extends string> {
  /** Megengedett kiinduló állapotok. */
  from: readonly S[]
  /** Célállapot (a `complete` akciónál a szerver dönt — ld. SafetyWalk). */
  to: S
}

/**
 * Baleset/esemény FSM: Reported → Investigated → CorrectiveActionPlanned → Closed (+Reopened).
 * A `Reopened` állapotból újra vizsgálat indítható (openapi: "additional investigation").
 */
export const INCIDENT_FSM = {
  investigate: { from: ['Reported', 'Reopened'], to: 'Investigated' },
  addCorrectiveAction: { from: ['Investigated'], to: 'CorrectiveActionPlanned' },
  close: { from: ['CorrectiveActionPlanned'], to: 'Closed' },
  reopen: { from: ['Closed'], to: 'Reopened' },
} as const satisfies Record<string, FsmRule<IncidentStatus>>

export type IncidentAction = keyof typeof INCIDENT_FSM

/** EVE/PPE kiadás FSM: Issued → Acknowledged → Returned | Replaced. */
export const PPE_ISSUANCE_FSM = {
  acknowledge: { from: ['Issued'], to: 'Acknowledged' },
  return: { from: ['Acknowledged'], to: 'Returned' },
  replace: { from: ['Acknowledged'], to: 'Replaced' },
} as const satisfies Record<string, FsmRule<PpeIssuanceStatus>>

export type PpeIssuanceAction = keyof typeof PPE_ISSUANCE_FSM

/**
 * Bejárás FSM: Scheduled → InProgress → ActionRequired → Closed (+Cancelled).
 * A `complete` célállapotát a szerver dönti el (van-e intézkedést igénylő megállapítás),
 * a `to` itt a "worst case" ActionRequired. Megállapítás csak InProgress alatt rögzíthető.
 */
export const SAFETY_WALK_FSM = {
  start: { from: ['Scheduled'], to: 'InProgress' },
  complete: { from: ['InProgress'], to: 'ActionRequired' },
  close: { from: ['ActionRequired'], to: 'Closed' },
  cancel: { from: ['Scheduled'], to: 'Cancelled' },
} as const satisfies Record<string, FsmRule<SafetyWalkStatus>>

export type SafetyWalkAction = keyof typeof SAFETY_WALK_FSM

/** Megállapítás-rögzítés guardja (nem átmenet, de állapothoz kötött). */
export const WALK_FINDING_ALLOWED_STATUS: SafetyWalkStatus = 'InProgress'

// ── Guard helperek ──────────────────────────────────────────────────────────

/** Indítható-e az akció az adott állapotból. */
export function canTransition<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
): boolean {
  const rule = fsm[action]
  return rule !== undefined && rule.from.includes(status)
}

/**
 * Tiltott átmenet indoka (Button `disabledReason`-höz), engedélyezettnél undefined.
 * A `statusLabels` a hívó modul lokalizált címkéi — így a services réteg nyelvfüggetlen.
 */
export function transitionBlockReason<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
  statusLabels: Record<S, string>,
): string | undefined {
  if (canTransition(fsm, action, status)) return undefined
  const rule = fsm[action]
  const fromLabels = rule ? rule.from.map((s) => `„${statusLabels[s]}"`).join(' vagy ') : '?'
  return `Csak ${fromLabels} státuszból indítható — jelenlegi: „${statusLabels[status]}".`
}
