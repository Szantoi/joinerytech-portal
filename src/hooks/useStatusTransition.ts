/**
 * useStatusTransition — the shared status-governance hook.
 *
 * Resolves the scattered `// Call FSM transition API when available` TODOs with ONE
 * reusable primitive every module uses. Given an entity's FSM (or its name), the
 * current status, and the API endpoint, it exposes:
 *   - `available`: the transitions THIS user may perform now (FSM ∩ their roles) —
 *     for rendering exactly the right action buttons (no forbidden buttons).
 *   - `transition(to, { reason })`: validates client-side (declared transition +
 *     role + reason) BEFORE calling the API, then performs the mutation. The backend
 *     FSM stays authoritative; this prevents impossible calls and gives instant,
 *     precise feedback ("Indok kötelező", "Ehhez jogosultság kell").
 *
 * Built on the portal's own useMutation + useAuth — no new infrastructure.
 */
import { useCallback, useMemo } from 'react';
import { useMutation } from './useApi';
import { useAuth } from '../auth';
import {
  availableTransitions, checkTransition, type FsmDefinition, type TransitionRule, type TransitionCheck,
} from '../lib/fsm';
import { FSMS } from '../lib/fsmDefinitions';

export interface UseStatusTransitionOptions {
  /** FSM definition, or a registered FSM name (e.g. 'catalog'). */
  fsm: FsmDefinition | string;
  /** The entity's current status. */
  status: string;
  /**
   * Builds the API URL for a transition. Receives the target status so REST-style
   * endpoints (…/status) or action-style (…/approve) both work.
   */
  endpoint: (to: string) => string;
  /** HTTP method for the transition call (default PATCH). */
  method?: 'POST' | 'PATCH' | 'PUT';
}

export interface TransitionResult<T> {
  /** Transitions the current user may perform from the current status. */
  available: TransitionRule[];
  /** Pre-flight check without performing the call (for disabling buttons + tooltips). */
  check: (to: string, reason?: string) => TransitionCheck;
  /** Perform a validated transition. Rejects (throws) on a failed pre-flight check. */
  transition: (to: string, opts?: { reason?: string; extra?: Record<string, unknown> }) => Promise<T>;
  isLoading: boolean;
  error: string | null;
}

function resolveFsm(fsm: FsmDefinition | string): FsmDefinition {
  if (typeof fsm !== 'string') return fsm;
  const def = FSMS[fsm];
  if (!def) throw new Error(`Unknown FSM '${fsm}' — register it in fsmDefinitions.ts`);
  return def;
}

export function useStatusTransition<T = unknown>(opts: UseStatusTransitionOptions): TransitionResult<T> {
  const { roles } = useAuth();
  const { mutate, isLoading, error } = useMutation<T>();
  const fsm = useMemo(() => resolveFsm(opts.fsm), [opts.fsm]);

  const available = useMemo(
    () => availableTransitions(fsm, opts.status, roles),
    [fsm, opts.status, roles],
  );

  const check = useCallback(
    (to: string, reason?: string) => checkTransition(fsm, opts.status, to, { roles, reason }),
    [fsm, opts.status, roles],
  );

  const transition = useCallback(
    async (to: string, o?: { reason?: string; extra?: Record<string, unknown> }): Promise<T> => {
      const pre = checkTransition(fsm, opts.status, to, { roles, reason: o?.reason });
      if (!pre.ok) throw new Error(pre.message);
      return mutate(opts.endpoint(to), {
        method: opts.method ?? 'PATCH',
        body: { status: to, reason: o?.reason, ...(o?.extra ?? {}) },
      });
    },
    [fsm, opts, roles, mutate],
  );

  return { available, check, transition, isLoading, error };
}
