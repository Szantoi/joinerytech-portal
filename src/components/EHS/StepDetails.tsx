import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { useState, useRef } from 'react';

// Mock locations (TODO: replace with API call when backend is ready)
const LOCATIONS = [
  { id: 'loc-001', name: 'Main Workshop — Hall A' },
  { id: 'loc-002', name: 'Main Workshop — Hall B' },
  { id: 'loc-003', name: 'Main Workshop — Hall C' },
  { id: 'loc-004', name: 'Warehouse' },
  { id: 'loc-005', name: 'Yard' },
  { id: 'loc-006', name: 'Office' }
];

export function StepDetails() {
  const { currentDraft, updateDraft } = useIncidentDraftStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateDraft({ photoFile: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateDraft({ photoFile: null, photoS3Key: null });
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Incident Details</h3>
        <p className="mt-1 text-sm text-gray-600">
          Provide information about when and where the incident occurred
        </p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location <span className="text-rose-500">*</span>
        </label>
        <select
          id="location"
          value={currentDraft?.locationId || ''}
          onChange={(e) => updateDraft({ locationId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2 border"
          required
        >
          <option value="">Select location...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Timestamp */}
      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">
          Date & Time
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          value={currentDraft?.timestamp?.slice(0, 16) || ''}
          onChange={(e) => updateDraft({ timestamp: new Date(e.target.value).toISOString() })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2 border"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          value={currentDraft?.description || ''}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Describe what happened in detail..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2 border"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          {currentDraft?.description?.length || 0} characters
        </p>
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Photo (optional)</label>
        <div className="mt-1">
          {photoPreview ? (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Incident photo preview"
                className="w-full max-w-sm rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-lg"
                aria-label="Remove photo"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (MAX. 10MB)</p>
                </div>
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Photo will be compressed and uploaded securely. EXIF metadata will be removed for privacy.
        </p>
      </div>
    </div>
  );
}
