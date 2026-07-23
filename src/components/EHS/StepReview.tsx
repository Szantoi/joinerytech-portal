import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { useEhsLocations } from '../../modules/ehs';
import { INCIDENT_TYPE_COPY, type WizardIncidentType } from './incidentWizardCopy';
import { formatIncidentDateTime } from './incidentWizardDate';

export function StepReview() {
  const { currentDraft } = useIncidentDraftStore();
  // A StepDetails már betöltötte — itt cache-találat (locations API, nem mock-lista)
  const { data: locationList } = useEhsLocations({ activeOnly: true });

  if (!currentDraft) return null;

  const location = locationList?.find(l => l.locationId === currentDraft.locationId);
  const formattedDate = formatIncidentDateTime(currentDraft.timestamp);
  const incidentType = currentDraft.incidentType as WizardIncidentType | null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-ink">Ellenőrzés és beküldés</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Beküldés előtt ellenőrizd a bejelentés adatait.
        </p>
      </div>

      <dl className="space-y-4 rounded-lg bg-surface-2 p-6">
        {/* Incident Type */}
        <div>
          <dt className="text-sm font-medium text-ink-muted">Esemény típusa</dt>
          <dd className="mt-1 text-base text-ink">
            {incidentType ? INCIDENT_TYPE_COPY[incidentType].label : 'Nincs megadva'}
          </dd>
        </div>

        {/* Location */}
        <div>
          <dt className="text-sm font-medium text-ink-muted">Helyszín</dt>
          <dd className="mt-1 text-base text-ink">
            {location?.name || 'Nincs megadva'}
          </dd>
        </div>

        {/* Date & Time */}
        <div>
          <dt className="text-sm font-medium text-ink-muted">Dátum és idő</dt>
          <dd className="mt-1 text-base text-ink">{formattedDate}</dd>
        </div>

        {/* Description */}
        <div>
          <dt className="text-sm font-medium text-ink-muted">Leírás</dt>
          <dd className="mt-1 whitespace-pre-wrap text-base text-ink">
            {currentDraft.description || 'Nincs megadva leírás'}
          </dd>
        </div>

        {/* Photo */}
        {currentDraft.photoFile && (
          <div>
            <dt className="text-sm font-medium text-ink-muted">Fénykép</dt>
            <dd className="mt-1">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {currentDraft.photoFile.name} ({(currentDraft.photoFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </dd>
          </div>
        )}
      </dl>

      {/* Privacy notice */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
        <div className="flex gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-sky-900 dark:text-sky-100">
            <p className="font-medium">Adatvédelem és biztonság</p>
            <p className="mt-1 text-sky-700 dark:text-sky-300">
              A bejelentést biztonságosan tároljuk, és csak az arra jogosult EHS-munkatársak férhetnek hozzá.
              A fénykép EXIF metaadatait feltöltés előtt eltávolítjuk.
            </p>
          </div>
        </div>
      </div>

      {/* Offline notice */}
      {currentDraft.status === 'failed' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">Offline mód</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                A bejelentést helyben mentettük. Amint a kapcsolat helyreáll, a
                Beküldés gombbal újra megpróbálhatod.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
