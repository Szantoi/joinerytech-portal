/**
 * Config-driven finite-state-machine engine for entity status governance.
 *
 * WHY: the prototype's #1 rule is "soha ne találj ki státuszt" — every entity has a
 * fixed set of statuses and ALLOWED transitions, and code must never invent a status
 * or skip a step. In the portal this was scattered (see the `// Call FSM transition
 * API when available` TODOs in BatchAssignmentBoard). This engine centralizes it:
 * transitions live in DECLARATIVE definitions (fsmDefinitions.ts), not hardcoded in
 * components, and the same definition drives both the UI (which transitions to show)
 * and client-side validation before the API call.
 *
 * Mirrors the fleet's canonical-FSM philosophy (nexus message-model.yaml) on the
 * frontend. The BACKEND FSM stays authoritative — this is defense-in-depth + UX
 * (never offer a button the transition rules forbid).
 */

/** A single allowed transition and the conditions to perform it. */
export interface TransitionRule {
  to: string;
  /** Roles permitted to perform this transition. Empty/undefined = any authenticated user. */
  roles?: string[];
  /** If true, a reason string is required (e.g. reject/incomplete). */
  reasonRequired?: boolean;
  /** Human label for the action button. */
  label?: string;
}

/** A named state machine: the set of statuses and, per status, its outgoing rules. */
export interface FsmDefinition {
  name: string;
  statuses: string[];
  /** from-status -> allowed transition rules */
  transitions: Record<string, TransitionRule[]>;
}

/** All outgoing transition rules from a status (empty if terminal/unknown). */
export function outgoing(fsm: FsmDefinition, from: string): TransitionRule[] {
  return fsm.transitions[from] ?? [];
}

/** Is `from -> to` a declared transition? (A no-op from===to is always allowed.) */
export function canTransition(fsm: FsmDefinition, from: string, to: string): boolean {
  if (from === to) return true;
  return outgoing(fsm, from).some(r => r.to === to);
}

/** The rule for a specific `from -> to`, or null if not declared. */
export function transitionRule(fsm: FsmDefinition, from: string, to: string): TransitionRule | null {
  return outgoing(fsm, from).find(r => r.to === to) ?? null;
}

/** Does the given role set satisfy a rule's role requirement? */
export function roleAllowed(rule: TransitionRule, roles: string[]): boolean {
  if (!rule.roles || rule.roles.length === 0) return true;
  return rule.roles.some(r => roles.includes(r));
}

export type TransitionCheck =
  | { ok: true }
  | { ok: false; reason: 'not_allowed' | 'forbidden_role' | 'reason_required'; message: string };

/**
 * Full pre-flight check for a transition attempt: is it a declared transition,
 * does the user's role permit it, and is a reason supplied when required.
 * Returns a typed result so the caller can show the precise blocking reason
 * (matching the prototype's "LEZÁRT gomb + tooltip a hiányzó feltétellel").
 */
export function checkTransition(
  fsm: FsmDefinition,
  from: string,
  to: string,
  ctx: { roles: string[]; reason?: string },
): TransitionCheck {
  const rule = transitionRule(fsm, from, to);
  if (!rule) {
    return { ok: false, reason: 'not_allowed', message: `'${from}' → '${to}' nem engedélyezett átmenet` };
  }
  if (!roleAllowed(rule, ctx.roles)) {
    return { ok: false, reason: 'forbidden_role', message: `Ehhez jogosultság kell: ${rule.roles?.join(', ')}` };
  }
  if (rule.reasonRequired && !ctx.reason?.trim()) {
    return { ok: false, reason: 'reason_required', message: 'Indok megadása kötelező' };
  }
  return { ok: true };
}

/**
 * The transitions a specific user may perform right now from `from` (for rendering
 * action buttons). Each carries whether a reason is required, so the UI can prompt.
 */
export function availableTransitions(
  fsm: FsmDefinition,
  from: string,
  roles: string[],
): TransitionRule[] {
  return outgoing(fsm, from).filter(r => roleAllowed(r, roles));
}
