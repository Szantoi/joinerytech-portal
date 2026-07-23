import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { INCIDENT_TYPE_COPY } from './incidentWizardCopy';

const INCIDENT_TYPES = [
  {
    value: 'near-miss' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'amber'
  },
  {
    value: 'injury' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'rose'
  },
  {
    value: 'property' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'sky'
  }
];

export function StepIncidentType() {
  const { currentDraft, updateDraft } = useIncidentDraftStore();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-ink">Milyen esemény történt?</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Válaszd ki az eseményt legjobban leíró kategóriát.
        </p>
      </div>

      <div className="grid gap-3 mt-6">
        {INCIDENT_TYPES.map((type) => {
          const isSelected = currentDraft?.incidentType === type.value;
          const colorClasses = {
            amber: {
              border: 'border-amber-300 dark:border-amber-700',
              bg: 'bg-amber-50 dark:bg-amber-950',
              text: 'text-amber-900 dark:text-amber-200',
              icon: 'text-amber-600 dark:text-amber-300'
            },
            rose: {
              border: 'border-rose-300 dark:border-rose-700',
              bg: 'bg-rose-50 dark:bg-rose-950',
              text: 'text-rose-900 dark:text-rose-200',
              icon: 'text-rose-600 dark:text-rose-300'
            },
            sky: {
              border: 'border-sky-300 dark:border-sky-700',
              bg: 'bg-sky-50 dark:bg-sky-950',
              text: 'text-sky-900 dark:text-sky-200',
              icon: 'text-sky-600 dark:text-sky-300'
            }
          }[type.color] as {
            border: string;
            bg: string;
            text: string;
            icon: string;
          };

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => updateDraft({ incidentType: type.value })}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? `${colorClasses.border} ${colorClasses.bg} shadow-sm`
                    : 'border-line hover:border-line-strong hover:bg-surface-2'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={isSelected ? colorClasses.icon : 'text-ink-muted'}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isSelected ? colorClasses.text : 'text-ink'}`}>
                    {INCIDENT_TYPE_COPY[type.value].label}
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">
                    {INCIDENT_TYPE_COPY[type.value].description}
                  </div>
                </div>
                {isSelected && (
                  <svg className={`w-5 h-5 ${colorClasses.icon} flex-shrink-0`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
