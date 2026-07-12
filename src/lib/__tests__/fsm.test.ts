/**
 * FSM engine tests — the status-governance logic. Pins the catalog lifecycle rules
 * (ported from the prototype _catFlow) and the role/reason gating.
 */
import { describe, it, expect } from 'vitest';
import { canTransition, checkTransition, availableTransitions, outgoing } from '../fsm';
import { catalogFsm } from '../fsmDefinitions';

describe('catalog FSM transition rules (from prototype _catFlow)', () => {
  it('allows the declared happy-path transitions', () => {
    expect(canTransition(catalogFsm, 'draft', 'review')).toBe(true);
    expect(canTransition(catalogFsm, 'review', 'active')).toBe(true);
    expect(canTransition(catalogFsm, 'active', 'archived')).toBe(true);
    expect(canTransition(catalogFsm, 'archived', 'draft')).toBe(true);
  });

  it('rejects undeclared transitions (no invented statuses, no skipped steps)', () => {
    expect(canTransition(catalogFsm, 'draft', 'active')).toBe(false); // must go via review
    expect(canTransition(catalogFsm, 'active', 'draft')).toBe(false);
    expect(canTransition(catalogFsm, 'review', 'archived')).toBe(false);
  });

  it('treats a no-op (same status) as allowed', () => {
    expect(canTransition(catalogFsm, 'review', 'review')).toBe(true);
  });
});

describe('checkTransition — role + reason gating with typed reasons', () => {
  it('blocks approval for a user without the required role', () => {
    const r = checkTransition(catalogFsm, 'review', 'active', { roles: ['Designer'] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('forbidden_role');
  });

  it('allows approval for an Admin', () => {
    expect(checkTransition(catalogFsm, 'review', 'active', { roles: ['Admin'] }).ok).toBe(true);
  });

  it('requires a reason for reject / incomplete', () => {
    const noReason = checkTransition(catalogFsm, 'review', 'rejected', { roles: ['Admin'] });
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.reason).toBe('reason_required');

    const withReason = checkTransition(catalogFsm, 'review', 'rejected', { roles: ['Admin'], reason: 'hiányos ár' });
    expect(withReason.ok).toBe(true);
  });

  it('flags a not-allowed transition distinctly from a role/reason block', () => {
    const r = checkTransition(catalogFsm, 'draft', 'active', { roles: ['Admin'] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_allowed');
  });
});

describe('availableTransitions — what buttons to render for a user', () => {
  it('shows draft actions to any authenticated user', () => {
    const tos = availableTransitions(catalogFsm, 'draft', ['Joiner']).map(t => t.to);
    expect(tos.sort()).toEqual(['archived', 'review']);
  });

  it('hides approval actions from a non-approver in review', () => {
    // Designer sees none of the review→(active|incomplete|rejected) approver actions
    expect(availableTransitions(catalogFsm, 'review', ['Designer'])).toHaveLength(0);
    // Admin sees all three
    expect(availableTransitions(catalogFsm, 'review', ['Admin'])).toHaveLength(3);
  });

  it('returns [] for a terminal-ish status with no matching role actions', () => {
    // archived → draft is open to anyone, so a Joiner does see it
    expect(availableTransitions(catalogFsm, 'archived', ['Joiner']).map(t => t.to)).toEqual(['draft']);
  });

  it('outgoing returns [] for an unknown status (no crash)', () => {
    expect(outgoing(catalogFsm, 'nonexistent')).toEqual([]);
  });
});
