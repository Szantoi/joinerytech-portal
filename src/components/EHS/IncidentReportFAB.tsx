import { useState } from 'react';
import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { IncidentReportWizard } from './IncidentReportWizard';

interface IncidentReportFABProps {
  /** Sikeres beküldés után hívódik (pl. toast + esemény-lista invalidálás). */
  onSuccess?: (eventId: string) => void;
}

export function IncidentReportFAB({ onSuccess }: IncidentReportFABProps) {
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
    setIsWizardOpen(false);
    onSuccess?.(eventId);
  };

  return (
    <>
      {/* Floating Action Button — csak mobilon (spec 3.2): a bottom nav (58px) FÖLÖTT,
          desktopon nem renderel (ott a lista-fejléc primary buttonja a helye).
          Szín: world-akcent (EHS), NEM a danger-tónusú rose. */}
      <button
        onClick={handleOpenWizard}
        className="fixed bottom-[calc(58px+env(safe-area-inset-bottom)+16px)] right-4 z-40 md:hidden w-14 h-14 bg-world hover:bg-world-hover text-world-fg rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Baleset bejelentése"
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
