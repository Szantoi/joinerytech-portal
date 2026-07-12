import { useIncidentDraftStore } from '../../stores/incidentDraftStore';

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  'near-miss': 'Near Miss',
  'injury': 'Injury',
  'property': 'Property Damage'
};

// Mock locations (same as StepDetails)
const LOCATIONS = [
  { id: 'loc-001', name: 'Main Workshop — Hall A' },
  { id: 'loc-002', name: 'Main Workshop — Hall B' },
  { id: 'loc-003', name: 'Main Workshop — Hall C' },
  { id: 'loc-004', name: 'Warehouse' },
  { id: 'loc-005', name: 'Yard' },
  { id: 'loc-006', name: 'Office' }
];

export function StepReview() {
  const { currentDraft } = useIncidentDraftStore();

  if (!currentDraft) return null;

  const location = LOCATIONS.find(l => l.id === currentDraft.locationId);
  const formattedDate = new Date(currentDraft.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
        <p className="mt-1 text-sm text-gray-600">
          Please review the incident details before submitting
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Incident Type */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Incident Type</dt>
          <dd className="mt-1 text-base text-gray-900">
            {currentDraft.incidentType ? INCIDENT_TYPE_LABELS[currentDraft.incidentType] : 'Not specified'}
          </dd>
        </div>

        {/* Location */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Location</dt>
          <dd className="mt-1 text-base text-gray-900">
            {location?.name || 'Not specified'}
          </dd>
        </div>

        {/* Date & Time */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
          <dd className="mt-1 text-base text-gray-900">{formattedDate}</dd>
        </div>

        {/* Description */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
            {currentDraft.description || 'No description provided'}
          </dd>
        </div>

        {/* Photo */}
        {currentDraft.photoFile && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Photo</dt>
            <dd className="mt-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {currentDraft.photoFile.name} ({(currentDraft.photoFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </dd>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-sky-900">
            <p className="font-medium">Privacy & Security</p>
            <p className="mt-1 text-sky-700">
              Your report will be stored securely and only accessible to authorized EHS personnel.
              Photo EXIF metadata will be automatically removed to protect your privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Offline notice */}
      {currentDraft.status === 'failed' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-900">
              <p className="font-medium">Offline Mode</p>
              <p className="mt-1 text-amber-700">
                This report was saved locally and will be automatically submitted when you're back online.
                {currentDraft.retryCount > 0 && ` (Retry ${currentDraft.retryCount}/3)`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
