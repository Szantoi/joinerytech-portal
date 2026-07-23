import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { useState, useRef, useEffect } from 'react';
import { useEhsLocations } from '../../modules/ehs';
import { useToast } from '../ui';
import { fromLocalDateTimeInput, toLocalDateTimeInput } from './incidentWizardDate';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png']);

export function StepDetails() {
  const { currentDraft, updateDraft } = useIncidentDraftStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helyszínek az EHS locations API-ból (a korábbi hardcode-olt mock-lista helyett)
  const locations = useEhsLocations({ activeOnly: true });
  const { addToast } = useToast();
  useEffect(() => {
    if (locations.isError) {
      addToast('A helyszínek betöltése nem sikerült — próbáld újra később', 'error');
    }
  }, [locations.isError, addToast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
        addToast('Csak JPEG vagy PNG formátumú fénykép tölthető fel.', 'error');
        e.currentTarget.value = '';
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        addToast('A fénykép mérete legfeljebb 10 MB lehet.', 'error');
        e.currentTarget.value = '';
        return;
      }
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
        <h3 className="text-lg font-medium text-ink">Az esemény részletei</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Add meg, mikor és hol történt az esemény.
        </p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink">
          Helyszín <span className="text-rose-500">*</span>
        </label>
        <select
          id="location"
          value={currentDraft?.locationId || ''}
          onChange={(e) => updateDraft({ locationId: e.target.value })}
          className="mt-1 block w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-ink shadow-sm focus:border-world-ring focus:ring-world-ring"
          required
          disabled={locations.isPending || locations.isError}
          aria-busy={locations.isPending || undefined}
        >
          <option value="">
            {locations.isPending
              ? 'Helyszínek betöltése…'
              : locations.isError
                ? 'A helyszínek nem érhetők el'
                : 'Válassz helyszínt…'}
          </option>
          {locations.data?.map((loc) => (
            <option key={loc.locationId} value={loc.locationId}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Timestamp */}
      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-ink">
          Dátum és idő
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          value={currentDraft?.timestamp ? toLocalDateTimeInput(currentDraft.timestamp) : ''}
          onChange={(e) => {
            if (e.target.value) updateDraft({ timestamp: fromLocalDateTimeInput(e.target.value) });
          }}
          className="mt-1 block w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-ink shadow-sm focus:border-world-ring focus:ring-world-ring"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink">
          Leírás <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          value={currentDraft?.description || ''}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Írd le részletesen, mi történt…"
          className="mt-1 block w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-ink shadow-sm focus:border-world-ring focus:ring-world-ring"
          required
        />
        <p className="mt-1 text-sm text-ink-muted">
          {currentDraft?.description?.length || 0} karakter
        </p>
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-ink">Fénykép (opcionális)</label>
        <div className="mt-1">
          {photoPreview ? (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="A kiválasztott eseményfotó előnézete"
                className="w-full max-w-sm rounded-lg border border-line"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-lg"
                aria-label="Fénykép eltávolítása"
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
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-surface-2 hover:border-line-strong"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="mb-3 h-8 w-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mb-2 text-sm text-ink-muted">
                    <span className="font-semibold text-ink">Kattints a feltöltéshez</span>, vagy húzd ide a fájlt
                  </p>
                  <p className="text-xs text-ink-muted">PNG vagy JPEG, legfeljebb 10 MB</p>
                </div>
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          A rendszer a fényképet biztonságosan újrakódolja és tömöríti; az EXIF metaadatokat feltöltés előtt eltávolítja.
        </p>
      </div>
    </div>
  );
}
