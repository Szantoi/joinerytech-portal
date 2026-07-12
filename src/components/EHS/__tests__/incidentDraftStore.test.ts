import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIncidentDraftStore } from '../../../stores/incidentDraftStore';

describe('incidentDraftStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useIncidentDraftStore.setState({
      drafts: [],
      currentDraft: null
    });
  });

  it('should start a new draft', () => {
    const { startNewDraft } = useIncidentDraftStore.getState();

    startNewDraft();

    const { currentDraft, drafts } = useIncidentDraftStore.getState();

    expect(currentDraft).toBeDefined();
    expect(currentDraft?.step).toBe(1);
    expect(currentDraft?.status).toBe('draft');
    expect(currentDraft?.incidentType).toBeNull();
    expect(drafts).toHaveLength(1);
  });

  it('should update draft', () => {
    const { startNewDraft, updateDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({ incidentType: 'injury' });

    const { currentDraft } = useIncidentDraftStore.getState();

    expect(currentDraft?.incidentType).toBe('injury');
  });

  it('should update draft step', () => {
    const { startNewDraft, updateDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({ step: 2 });

    const { currentDraft } = useIncidentDraftStore.getState();

    expect(currentDraft?.step).toBe(2);
  });

  it('should delete draft', () => {
    const { startNewDraft, deleteDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    const { currentDraft } = useIncidentDraftStore.getState();
    const draftId = currentDraft!.id;

    deleteDraft(draftId);

    const state = useIncidentDraftStore.getState();
    expect(state.drafts).toHaveLength(0);
    expect(state.currentDraft).toBeNull();
  });

  it('should clear current draft', () => {
    const { startNewDraft, clearCurrentDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    clearCurrentDraft();

    const { currentDraft, drafts } = useIncidentDraftStore.getState();

    expect(currentDraft).toBeNull();
    expect(drafts).toHaveLength(1); // Draft still in storage
  });

  it('should mark draft as failed on submit error', async () => {
    const { startNewDraft, updateDraft, submitDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({
      incidentType: 'injury',
      locationId: 'loc-001',
      description: 'Test incident'
    });

    // Mock fetch to fail
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as typeof fetch;

    try {
      await submitDraft();
    } catch (error) {
      // Expected to throw
    }

    const { currentDraft } = useIncidentDraftStore.getState();

    expect(currentDraft?.status).toBe('failed');
    expect(currentDraft?.retryCount).toBe(1);
  });
});
