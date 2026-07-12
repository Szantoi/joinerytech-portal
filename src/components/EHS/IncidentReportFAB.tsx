import { useState } from 'react';
import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { IncidentReportWizard } from './IncidentReportWizard';

export function IncidentReportFAB() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { startNewDraft, drafts } = useIncidentDraftStore();

  const failedDraftsCount = drafts.filter(d => d.status === 'failed').length;

  const handleOpenWizard = () => {
    startNewDraft();
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
  };

  const handleSuccess = (eventId: string) => {
    console.log('Incident submitted successfully:', eventId);
    // TODO: Show toast notification or success modal
    setIsWizardOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpenWizard}
        className="fixed bottom-6 right-6 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Report incident"
      >
        {failedDraftsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {failedDraftsCount}
          </span>
        )}

        <svg
          className="w-6 h-6 group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </button>

      {/* Wizard Modal */}
      <IncidentReportWizard
        isOpen={isWizardOpen}
        onClose={handleCloseWizard}
        onSuccess={handleSuccess}
      />
    </>
  );
}
