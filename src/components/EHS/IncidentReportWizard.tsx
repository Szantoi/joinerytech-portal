import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth';
import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { StepIncidentType } from './StepIncidentType';
import { StepDetails } from './StepDetails';
import { StepReview } from './StepReview';
import { INCIDENT_SUBMIT_ERROR } from './incidentWizardCopy';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface IncidentReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (eventId: string) => void;
}

export function IncidentReportWizard({ isOpen, onClose, onSuccess }: IncidentReportWizardProps) {
  const { currentDraft, updateDraft, submitDraft, clearCurrentDraft } = useIncidentDraftStore();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup on close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      clearCurrentDraft();
      setSubmitError(null);
      onClose();
    }
  }, [clearCurrentDraft, isSubmitting, onClose]);

  // Named modal + Escape + fókuszcsapda; bezáráskor az indítóelem kapja vissza a fókuszt.
  const activeDraftId = currentDraft?.id ?? null;
  useEffect(() => {
    if (!isOpen || !activeDraftId) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      }
      else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [activeDraftId, handleClose, isOpen]);

  // Step navigation
  const goNext = () => {
    if (!currentDraft) return;
    if (currentDraft.step < 3) {
      updateDraft({ step: (currentDraft.step + 1) as 1 | 2 | 3 });
    }
  };

  const goBack = () => {
    if (!currentDraft) return;
    if (currentDraft.step > 1) {
      updateDraft({ step: (currentDraft.step - 1) as 1 | 2 | 3 });
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!currentDraft) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitDraft(user?.profile.sub, onSuccess);
      // Siker: a store már törölte a draftot; a szülő isOpen zárását itt kérjük.
      // (handleClose beküldés közben szándékosan tiltott, ezért nem az zár.)
      onClose();
    } catch {
      setSubmitError(INCIDENT_SUBMIT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step validation
  const isStepValid = (step: number | undefined): boolean => {
    if (!currentDraft) return false;

    switch (step) {
      case 1:
        return currentDraft.incidentType !== null;
      case 2:
        // A backend LocationId NotEmpty — az üres placeholder-érték sem léphet tovább.
        return (
          (currentDraft.locationId ?? '').trim().length > 0 &&
          currentDraft.description.trim().length > 0
        );
      case 3:
        return true; // Review step always valid
      default:
        return false;
    }
  };

  if (!isOpen || !currentDraft) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-report-title"
        tabIndex={-1}
        className={`flex flex-col bg-surface-1 text-ink shadow-xl outline-none ${
          isMobile
            ? 'w-full h-full m-0 rounded-none'
            : 'm-4 max-h-[90vh] w-full max-w-2xl rounded-lg'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-6">
          <div className="flex-1">
            <h2 id="incident-report-title" className="text-xl font-semibold text-ink">
              Esemény bejelentése
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {currentDraft.step}. lépés / 3
            </p>
          </div>
          {isMobile && (
            <button
              onClick={handleClose}
              className="ml-4 rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink"
              disabled={isSubmitting}
              aria-label="Bezárás"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="h-1 w-full bg-surface-2"
          role="progressbar"
          aria-label="Bejelentés kitöltésének állapota"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={currentDraft.step}
        >
          <div
            className="bg-rose-500 h-1 transition-all duration-300"
            style={{ width: `${(currentDraft.step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentDraft.step === 1 && <StepIncidentType />}
          {currentDraft.step === 2 && <StepDetails />}
          {currentDraft.step === 3 && <StepReview />}
        </div>

        {/* Error message */}
        {submitError && (
          <div className="px-6 pb-4">
            <div role="alert" className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
              <p className="text-sm">{submitError}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line p-6">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            disabled={isSubmitting}
          >
            Mégse
          </button>

          <div className="flex gap-3">
            {currentDraft.step > 1 && (
              <button
                onClick={goBack}
                className="rounded-lg px-4 py-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                disabled={isSubmitting}
              >
                Vissza
              </button>
            )}

            <button
              onClick={currentDraft.step === 3 ? handleSubmit : goNext}
              disabled={!isStepValid(currentDraft.step) || isSubmitting}
              className="min-w-[100px] rounded-lg bg-world px-6 py-2 text-world-fg transition-colors hover:bg-world-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Beküldés…
                </span>
              ) : currentDraft.step === 3 ? (
                'Beküldés'
              ) : (
                'Tovább'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
