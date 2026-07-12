/**
 * Declarative FSM definitions (the config — not hardcoded in components).
 *
 * Ported faithfully from the prototype's status rules (docs/joinerytech/CLAUDE.md):
 * the catalog/cikkszám lifecycle is the governance-home. Add new entity FSMs here;
 * components consume them via useStatusTransition, never inventing statuses inline.
 *
 * Roles use the portal's actual Keycloak roles (Admin/Designer/Joiner from useAuth).
 * Catalog approval maps the prototype's `catalog.approve` permission to Admin.
 */
import type { FsmDefinition } from './fsm';

/**
 * Catalog item (cikkszám) lifecycle — `catalog[].status`.
 * Prototype `_catFlow`:
 *   draft→[review,archived] · incomplete→[review,archived] ·
 *   review→[active,incomplete,rejected] · rejected→[draft,archived] ·
 *   active→[archived,review] · archived→[draft]
 * active/incomplete/rejected require the approve role; incomplete/rejected need a reason.
 */
export const catalogFsm: FsmDefinition = {
  name: 'catalog',
  statuses: ['draft', 'incomplete', 'review', 'active', 'rejected', 'archived'],
  transitions: {
    draft: [
      { to: 'review', label: 'Beküldés jóváhagyásra' },
      { to: 'archived', label: 'Archiválás' },
    ],
    incomplete: [
      { to: 'review', label: 'Újraküldés' },
      { to: 'archived', label: 'Archiválás' },
    ],
    review: [
      { to: 'active', roles: ['Admin'], label: 'Jóváhagyás' },
      { to: 'incomplete', roles: ['Admin'], reasonRequired: true, label: 'Hiánypótlás kérése' },
      { to: 'rejected', roles: ['Admin'], reasonRequired: true, label: 'Elutasítás' },
    ],
    rejected: [
      { to: 'draft', label: 'Újranyitás piszkozatként' },
      { to: 'archived', label: 'Archiválás' },
    ],
    active: [
      { to: 'review', label: 'Visszaküldés felülvizsgálatra' },
      { to: 'archived', label: 'Archiválás' },
    ],
    archived: [
      { to: 'draft', label: 'Újraaktiválás piszkozatként' },
    ],
  },
};

/**
 * Machine batch (gyártási batch) lifecycle — `MachineBatch['status']`.
 * The manufacturing progression on the shop floor:
 *   unassigned → assigned → running → completed
 * Starting/completing is shop-floor work (Joiner) or Admin; assignment is handled
 * separately (operator + machine + time), so it is not gated by role here.
 */
export const batchFsm: FsmDefinition = {
  name: 'batch',
  statuses: ['unassigned', 'assigned', 'running', 'completed'],
  transitions: {
    unassigned: [{ to: 'assigned', label: 'Hozzárendelés' }],
    assigned: [{ to: 'running', roles: ['Joiner', 'Admin'], label: 'Indítás' }],
    running: [{ to: 'completed', roles: ['Joiner', 'Admin'], label: 'Kész' }],
    completed: [],
  },
};

/**
 * Central registry so a component can look up an FSM by entity kind without
 * importing each definition. Extend as new entities gain governance.
 */
export const FSMS: Record<string, FsmDefinition> = {
  catalog: catalogFsm,
  batch: batchFsm,
};
