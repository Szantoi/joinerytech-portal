import { useState, useEffect } from 'react';
import { useIncidentDraftStore } from '../../stores/incidentDraftStore';
import { StepIncidentType } from './StepIncidentType';
import { StepDetails } from './StepDetails';
import { StepReview } from './StepReview';

export interface IncidentReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (eventId: string) => void;
}

export function IncidentReportWizard({ isOpen, onClose, onSuccess }: IncidentReportWizardProps) {
  const { currentDraft, updateDraft, submitDraft, clearCurrentDraft } = useIncidentDraftStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup on close
  const handleClose = () => {
    if (!isSubmitting) {
      clearCurrentDraft();
      setSubmitError(null);
      onClose();
    }
  };

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
      await submitDraft(onSuccess);
      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
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
        return (
          currentDraft.locationId !== null &&
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl ${
          isMobile
            ? 'w-full h-full m-0 rounded-none'
            : 'w-full max-w-2xl max-h-[90vh] m-4'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              Report Incident
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentDraft.step}/3
            </p>
          </div>
          {isMobile && (
            <button
              onClick={handleClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1">
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
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded">
              <p className="text-sm">{submitError}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {currentDraft.step > 1 && (
              <button
                onClick={goBack}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}

            <button
              onClick={currentDraft.step === 3 ? handleSubmit : goNext}
              disabled={!isStepValid(currentDraft.step) || isSubmitting}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[100px]"
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
                  Submitting...
                </span>
              ) : currentDraft.step === 3 ? (
                'Submit'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
