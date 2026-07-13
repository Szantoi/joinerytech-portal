/**
 * useStatusTransition hook tests — the shared governance primitive.
 * Pins: role-filtered available actions, client-side pre-flight (no impossible API
 * calls), and the actual mutation call shape on a valid transition.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Portal convention: mock the auth barrel (roles drive the FSM gating).
const authState = { token: 'mock-token', roles: ['Admin'] as string[] };
vi.mock('../../auth', () => ({
  useAuth: () => authState,
}));

import { useStatusTransition } from '../useStatusTransition';

describe('useStatusTransition', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    authState.roles = ['Admin'];
  });

  it('exposes only the transitions the user may perform (Admin in review: 3)', () => {
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'review', endpoint: to => `/api/catalog/x/status?to=${to}` }));
    expect(result.current.available.map(t => t.to).sort()).toEqual(['active', 'incomplete', 'rejected']);
  });

  it('exposes none of the approver actions to a non-approver', () => {
    authState.roles = ['Joiner'];
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'review', endpoint: () => '/x' }));
    expect(result.current.available).toHaveLength(0);
  });

  it('REFUSES an invalid transition client-side — the API is never called', async () => {
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'draft', endpoint: () => '/api/never' }));
    await expect(result.current.transition('active')).rejects.toThrow('nem engedélyezett');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('REFUSES reject without a reason — the API is never called', async () => {
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'review', endpoint: () => '/api/never' }));
    await expect(result.current.transition('rejected')).rejects.toThrow('Indok');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('performs a valid transition: PATCH with {status, reason} body and auth header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'x', status: 'rejected' }) });
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'review', endpoint: to => `/api/catalog/x/status?to=${to}` }));

    await act(async () => {
      const res = await result.current.transition('rejected', { reason: 'hiányos ár' });
      expect(res).toEqual({ id: 'x', status: 'rejected' });
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/catalog/x/status?to=rejected');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toMatchObject({ status: 'rejected', reason: 'hiányos ár' });
    expect(init.headers['Authorization']).toBe('Bearer mock-token');
  });

  it('check() gives the precise blocking reason for disabled-button tooltips', () => {
    authState.roles = ['Designer'];
    const { result } = renderHook(() =>
      useStatusTransition({ fsm: 'catalog', status: 'review', endpoint: () => '/x' }));
    const c = result.current.check('active');
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.reason).toBe('forbidden_role');
  });
});
