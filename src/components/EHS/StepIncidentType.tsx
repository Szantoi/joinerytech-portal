import { useIncidentDraftStore } from '../../stores/incidentDraftStore';

const INCIDENT_TYPES = [
  {
    value: 'near-miss' as const,
    label: 'Near Miss',
    description: 'An event that could have caused injury but did not',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'amber'
  },
  {
    value: 'injury' as const,
    label: 'Injury',
    description: 'Personal injury or health incident',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'rose'
  },
  {
    value: 'property' as const,
    label: 'Property Damage',
    description: 'Damage to equipment or facilities',
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
        <h3 className="text-lg font-medium text-gray-900">What type of incident occurred?</h3>
        <p className="mt-1 text-sm text-gray-600">
          Select the category that best describes the incident
        </p>
      </div>

      <div className="grid gap-3 mt-6">
        {INCIDENT_TYPES.map((type) => {
          const isSelected = currentDraft?.incidentType === type.value;
          const colorClasses = {
            amber: {
              border: 'border-amber-300',
              bg: 'bg-amber-50',
              text: 'text-amber-900',
              icon: 'text-amber-600'
            },
            rose: {
              border: 'border-rose-300',
              bg: 'bg-rose-50',
              text: 'text-rose-900',
              icon: 'text-rose-600'
            },
            sky: {
              border: 'border-sky-300',
              bg: 'bg-sky-50',
              text: 'text-sky-900',
              icon: 'text-sky-600'
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
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={isSelected ? colorClasses.icon : 'text-gray-400'}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isSelected ? colorClasses.text : 'text-gray-900'}`}>
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {type.description}
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
