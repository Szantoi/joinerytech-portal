import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIncidentDraftStore } from '../../../stores/incidentDraftStore';

const REPORTER_ID = '11111111-1111-4111-8111-111111111111';
const DEVICE_ID = '22222222-2222-4222-8222-222222222222';

describe('incidentDraftStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useIncidentDraftStore.setState({
      drafts: [],
      currentDraft: null
    });
    localStorage.setItem('device-id', DEVICE_ID);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should start a new draft', () => {
    const { startNewDraft } = useIncidentDraftStore.getState();

    startNewDraft();

    const { currentDraft, drafts } = useIncidentDraftStore.getState();

    expect(currentDraft).toBeDefined();
    expect(currentDraft?.step).toBe(1);
    expect(currentDraft?.status).toBe('draft');
    expect(currentDraft?.reporterId).toBeNull();
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

  it('az event ID-t és a hitelesített bejelentőt küldi a szerződés szerint', async () => {
    const { startNewDraft, updateDraft, submitDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({
      incidentType: 'injury',
      locationId: '33333333-3333-4333-8333-333333333333',
      description: 'Teszt baleset'
    });
    const draft = useIncidentDraftStore.getState().currentDraft!;
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ eventId: draft.id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }));
    vi.stubGlobal('fetch', fetchMock);

    await submitDraft(REPORTER_ID);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.eventId).toBe(draft.id);
    expect(body.payload.reporterId).toBe(REPORTER_ID);
    expect({
      ...body,
      eventId: '<draft-id>',
      payload: { ...body.payload, timestamp: '<draft-timestamp>' },
      meta: { ...body.meta, clientTimestamp: '<client-timestamp>' }
    }).toMatchInlineSnapshot(`
      {
        "eventId": "<draft-id>",
        "meta": {
          "clientTimestamp": "<client-timestamp>",
          "deviceId": "22222222-2222-4222-8222-222222222222",
        },
        "payload": {
          "description": "Teszt baleset",
          "incidentType": "injury",
          "locationId": "33333333-3333-4333-8333-333333333333",
          "photoS3Key": null,
          "reporterId": "11111111-1111-4111-8111-111111111111",
          "timestamp": "<draft-timestamp>",
        },
        "type": "INCIDENT_REPORTED",
      }
    `);
  });

  it.each([undefined, 'nem-uuid', '00000000-0000-0000-0000-000000000000'])(
    'hiányzó vagy érvénytelen reporter esetén nem indít hálózati kérést: %s',
    async (reporterId) => {
      const { startNewDraft, submitDraft } = useIncidentDraftStore.getState();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      startNewDraft();

      await expect(submitDraft(reporterId)).rejects.toThrow(
        'A bejelentő azonosítója hiányzik vagy érvénytelen.'
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(useIncidentDraftStore.getState().currentDraft?.status).toBe('draft');
    }
  );

  it('retry során ugyanazt az event ID-t és perzisztált reportert használja', async () => {
    const { startNewDraft, updateDraft, submitDraft, retryFailed } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({
      incidentType: 'near-miss',
      locationId: '33333333-3333-4333-8333-333333333333',
      description: 'Majdnem baleset'
    });
    const draftId = useIncidentDraftStore.getState().currentDraft!.id;
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ eventId: draftId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(submitDraft(REPORTER_ID)).rejects.toThrow('Network error');
    expect(useIncidentDraftStore.getState().currentDraft).toMatchObject({
      id: draftId,
      reporterId: REPORTER_ID,
      status: 'failed'
    });

    await retryFailed(draftId);

    const requests = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
    expect(requests.map(({ eventId, payload }) => ({ eventId, reporterId: payload.reporterId })))
      .toEqual([
        { eventId: draftId, reporterId: REPORTER_ID },
        { eventId: draftId, reporterId: REPORTER_ID }
      ]);
    expect(useIncidentDraftStore.getState().drafts).toHaveLength(0);
  });

  it('should mark draft as failed on submit error', async () => {
    const { startNewDraft, updateDraft, submitDraft } = useIncidentDraftStore.getState();

    startNewDraft();
    updateDraft({
      incidentType: 'injury',
      locationId: 'loc-001',
      description: 'Test incident'
    });

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ));

    try {
      await submitDraft(REPORTER_ID);
    } catch {
      // Expected to throw
    }

    const { currentDraft } = useIncidentDraftStore.getState();

    expect(currentDraft?.status).toBe('failed');
    expect(currentDraft?.retryCount).toBe(1);
  });
});
