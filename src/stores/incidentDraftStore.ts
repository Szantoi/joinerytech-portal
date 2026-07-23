import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { getPresignedUrl, uploadToS3 } from '../services/ehsPhotoService';

export interface IncidentDraft {
  id: string; // UUID v4 (idempotency)
  reporterId: string | null;
  incidentType: 'near-miss' | 'injury' | 'property' | null;
  locationId: string | null;
  timestamp: string; // ISO8601
  description: string;
  photoFile: File | null;
  photoS3Key: string | null;
  step: 1 | 2 | 3;
  status: 'draft' | 'uploading' | 'submitted' | 'failed';
  retryCount: number;
}

interface IncidentDraftStore {
  drafts: IncidentDraft[];
  currentDraft: IncidentDraft | null;
  startNewDraft: () => void;
  updateDraft: (updates: Partial<IncidentDraft>) => void;
  submitDraft: (
    reporterId?: string | null,
    onSuccess?: (eventId: string) => void,
  ) => Promise<void>;
  retryFailed: (draftId: string) => Promise<void>;
  deleteDraft: (draftId: string) => void;
  clearCurrentDraft: () => void;
}

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isNonEmptyUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value) && value !== EMPTY_UUID;
}

// Helper function to get device ID
function getDeviceId(): string {
  // Try to get from localStorage, or generate new one
  let deviceId = localStorage.getItem('device-id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device-id', deviceId);
  }
  return deviceId;
}

export const useIncidentDraftStore = create<IncidentDraftStore>()(
  persist(
    (set, get) => ({
      drafts: [],
      currentDraft: null,

      startNewDraft: () => {
        const draft: IncidentDraft = {
          id: crypto.randomUUID(),
          reporterId: null,
          incidentType: null,
          locationId: null,
          timestamp: new Date().toISOString(),
          description: '',
          photoFile: null,
          photoS3Key: null,
          step: 1,
          status: 'draft',
          retryCount: 0
        };
        set({
          currentDraft: draft,
          drafts: [...get().drafts, draft]
        });
      },

      updateDraft: (updates) => {
        const current = get().currentDraft;
        if (!current) return;

        const updated = { ...current, ...updates };
        set({
          currentDraft: updated,
          drafts: get().drafts.map(d => d.id === current.id ? updated : d)
        });
      },

      submitDraft: async (reporterId, onSuccess) => {
        const draft = get().currentDraft;
        if (!draft) return;

        const effectiveReporterId = reporterId ?? draft.reporterId;
        if (!isNonEmptyUuid(effectiveReporterId)) {
          throw new Error('A bejelentő azonosítója hiányzik vagy érvénytelen.');
        }

        // A retry pontosan ugyanazzal a bejelentővel és event ID-val folytatódjon.
        get().updateDraft({ reporterId: effectiveReporterId });

        // Update status to uploading
        get().updateDraft({ status: 'uploading' });

        try {
          let s3Key = draft.photoS3Key;

          // 1. Upload photo if exists and not already uploaded
          if (draft.photoFile && !draft.photoS3Key) {
            const presigned = await getPresignedUrl(draft.photoFile);
            await uploadToS3(presigned, draft.photoFile);
            s3Key = presigned.s3Key;

            // Update draft with S3 key
            get().updateDraft({ photoS3Key: s3Key });
          }

          // 2. Submit event
          const response = await fetch('/api/ehs/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: draft.id,
              type: 'INCIDENT_REPORTED',
              payload: {
                reporterId: effectiveReporterId,
                incidentType: draft.incidentType,
                locationId: draft.locationId,
                timestamp: draft.timestamp,
                photoS3Key: s3Key,
                description: draft.description
              },
              meta: {
                deviceId: getDeviceId(),
                clientTimestamp: new Date().toISOString()
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Submit failed: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();

          // Remove from drafts and clear current
          set({
            drafts: get().drafts.filter(d => d.id !== draft.id),
            currentDraft: null
          });

          // Call success callback
          if (onSuccess) {
            onSuccess(result.eventId);
          }
        } catch (error) {
          console.error('Failed to submit incident:', error);

          // Update draft with failed status
          get().updateDraft({
            status: 'failed',
            retryCount: draft.retryCount + 1
          });

          throw error; // Re-throw to let UI handle the error
        }
      },

      retryFailed: async (draftId) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) return;

        set({ currentDraft: draft });
        await get().submitDraft(draft.reporterId);
      },

      deleteDraft: (draftId) => {
        set({
          drafts: get().drafts.filter(d => d.id !== draftId),
          currentDraft: get().currentDraft?.id === draftId ? null : get().currentDraft
        });
      },

      clearCurrentDraft: () => {
        set({ currentDraft: null });
      }
    }),
    {
      name: 'incident-drafts',
      storage: createJSONStorage(() => localforage),
      // Don't persist photoFile (File objects can't be serialized)
      partialize: (state) => ({
        drafts: state.drafts.map(d => ({ ...d, photoFile: null })),
        currentDraft: state.currentDraft ? { ...state.currentDraft, photoFile: null } : null
      })
    }
  )
);
