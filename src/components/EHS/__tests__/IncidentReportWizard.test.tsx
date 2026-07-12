import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentReportWizard } from '../IncidentReportWizard';
import { useIncidentDraftStore } from '../../../stores/incidentDraftStore';

describe('IncidentReportWizard', () => {
  beforeEach(() => {
    // Reset store and start new draft
    useIncidentDraftStore.setState({
      drafts: [],
      currentDraft: null
    });
    useIncidentDraftStore.getState().startNewDraft();
  });

  it('should render wizard when open', () => {
    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Report Incident')).toBeInTheDocument();
    expect(screen.getByText('Step 1/3')).toBeInTheDocument();
  });

  it('should not render wizard when closed', () => {
    const { container } = render(
      <IncidentReportWizard
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show incident type selection in step 1', () => {
    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('What type of incident occurred?')).toBeInTheDocument();
    expect(screen.getByText('Near Miss')).toBeInTheDocument();
    expect(screen.getByText('Injury')).toBeInTheDocument();
    expect(screen.getByText('Property Damage')).toBeInTheDocument();
  });

  it('should enable Next button after selecting incident type', () => {
    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();

    // Select incident type
    const injuryButton = screen.getByText('Injury').closest('button');
    fireEvent.click(injuryButton!);

    expect(nextButton).not.toBeDisabled();
  });

  it('should navigate to step 2 when Next is clicked', () => {
    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Select incident type
    const injuryButton = screen.getByText('Injury').closest('button');
    fireEvent.click(injuryButton!);

    // Click Next
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('Step 2/3')).toBeInTheDocument();
    expect(screen.getByText('Incident Details')).toBeInTheDocument();
  });

  it('should show Back button in step 2', () => {
    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Navigate to step 2
    const injuryButton = screen.getByText('Injury').closest('button');
    fireEvent.click(injuryButton!);
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn();

    render(
      <IncidentReportWizard
        isOpen={true}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
