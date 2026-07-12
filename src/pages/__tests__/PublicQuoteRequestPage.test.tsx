import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicQuoteRequestPage from '../PublicQuoteRequestPage';

// Mock hooks
vi.mock('../../hooks/useMaterialCatalog', () => ({
  useMaterialCatalog: () => ({
    materials: [
      { code: 'PAL-18-WHITE', name: 'PAL Fehér', thickness: 18, category: 'Panel' },
      { code: 'PAL-18-OAK', name: 'PAL Tölgy', thickness: 18, category: 'Panel' },
    ],
    loading: false,
    error: null,
  }),
}));

describe('PublicQuoteRequestPage', () => {
  it('renders the form', () => {
    render(<PublicQuoteRequestPage />);
    expect(screen.getByText('Lapszabászat Árajánlatkérés')).toBeInTheDocument();
    expect(screen.getByText('Kapcsolattartási adatok')).toBeInTheDocument();
    expect(screen.getByText('Igényelt lapszabászatok')).toBeInTheDocument();
  });

  it('renders customer input fields', () => {
    render(<PublicQuoteRequestPage />);
    expect(screen.getByLabelText(/Név/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon/)).toBeInTheDocument();
  });

  it('renders one piece input row by default', () => {
    render(<PublicQuoteRequestPage />);
    const materialSelects = screen.getAllByLabelText(/Anyag/);
    expect(materialSelects).toHaveLength(1);
  });

  it('adds a new piece input row', () => {
    render(<PublicQuoteRequestPage />);
    const addButton = screen.getByText('+ Tétel hozzáadása');

    fireEvent.click(addButton);

    const materialSelects = screen.getAllByLabelText(/Anyag/);
    expect(materialSelects).toHaveLength(2);
  });

  it('removes a piece input row', () => {
    render(<PublicQuoteRequestPage />);

    // Add a second row first
    fireEvent.click(screen.getByText('+ Tétel hozzáadása'));
    expect(screen.getAllByLabelText(/Anyag/)).toHaveLength(2);

    // Remove button should appear
    const removeButtons = screen.getAllByLabelText('Tétel törlése');
    expect(removeButtons).toHaveLength(2);

    // Click remove on the first row
    fireEvent.click(removeButtons[0]);

    expect(screen.getAllByLabelText(/Anyag/)).toHaveLength(1);
  });

  it('validates required name field', async () => {
    render(<PublicQuoteRequestPage />);

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Név megadása kötelező')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<PublicQuoteRequestPage />);

    const nameInput = screen.getByLabelText(/Név/);
    const emailInput = screen.getByLabelText(/Email/);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Érvényes email cím szükséges')).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    render(<PublicQuoteRequestPage />);

    const nameInput = screen.getByLabelText(/Név/);
    const emailInput = screen.getByLabelText(/Email/);
    const phoneInput = screen.getByLabelText(/Telefon/);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Magyar telefonszám formátum: +36301234567')).toBeInTheDocument();
    });
  });

  it('validates piece dimensions', async () => {
    render(<PublicQuoteRequestPage />);

    const nameInput = screen.getByLabelText(/Név/);
    const emailInput = screen.getByLabelText(/Email/);
    const phoneInput = screen.getByLabelText(/Telefon/);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+36301234567' } });

    // Fill in material code first (validation checks this before dimensions)
    const materialSelects = screen.getAllByLabelText(/Anyag/);
    fireEvent.change(materialSelects[0], { target: { value: 'PAL-18-WHITE' } });

    // Set length too small - use getAllByLabelText to handle multiple inputs
    const lengthInputs = screen.getAllByLabelText(/Hossz \(mm\)/);
    fireEvent.change(lengthInputs[0], { target: { value: '5' } });

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Hossz: 10-3000mm')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submits quote request successfully', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ quoteRequestId: 'test-id' }),
      } as Response)
    );
    globalThis.fetch = mockFetch;

    render(<PublicQuoteRequestPage />);

    // Fill in customer info
    fireEvent.change(screen.getByLabelText(/Név/), { target: { value: 'Test Customer' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Telefon/), { target: { value: '+36301234567' } });

    // Fill in piece info - use getAllByLabelText for inputs that may have multiple instances
    const materialSelects = screen.getAllByLabelText(/Anyag/);
    fireEvent.change(materialSelects[0], { target: { value: 'PAL-18-WHITE' } });

    const lengthInputs = screen.getAllByLabelText(/Hossz \(mm\)/);
    fireEvent.change(lengthInputs[0], { target: { value: '1000' } });

    const widthInputs = screen.getAllByLabelText(/Szélesség \(mm\)/);
    fireEvent.change(widthInputs[0], { target: { value: '600' } });

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Árajánlatkérés elküldve!')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText(/Köszönjük! Árajánlatkérését megkaptuk/)).toBeInTheDocument();
  });

  it('shows mock success when API fails', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ message: 'API error' }),
      } as Response)
    );
    globalThis.fetch = mockFetch;

    render(<PublicQuoteRequestPage />);

    // Fill in valid data
    fireEvent.change(screen.getByLabelText(/Név/), { target: { value: 'Test Customer' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Telefon/), { target: { value: '+36301234567' } });

    const materialSelects = screen.getAllByLabelText(/Anyag/);
    fireEvent.change(materialSelects[0], { target: { value: 'PAL-18-WHITE' } });

    const lengthInputs = screen.getAllByLabelText(/Hossz \(mm\)/);
    fireEvent.change(lengthInputs[0], { target: { value: '1000' } });

    const widthInputs = screen.getAllByLabelText(/Szélesség \(mm\)/);
    fireEvent.change(widthInputs[0], { target: { value: '600' } });

    const submitButton = screen.getByText('Árajánlatkérés küldése');
    fireEvent.click(submitButton);

    // Mock fallback should still show success
    await waitFor(() => {
      expect(screen.getByText('Árajánlatkérés elküldve!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('prevents adding more than 50 pieces', () => {
    render(<PublicQuoteRequestPage />);

    const addButton = screen.getByText('+ Tétel hozzáadása');

    // Add pieces until we reach the limit (we start with 1, so add 49 more)
    for (let i = 0; i < 49; i++) {
      fireEvent.click(addButton);
    }

    // Should have 50 pieces (original 1 + 49 added)
    let materialSelects = screen.getAllByLabelText(/Anyag/);
    expect(materialSelects).toHaveLength(50);

    // Button should be disabled when we have 50 pieces
    expect(addButton).toBeDisabled();

    // Try clicking the disabled button - should not add more pieces
    fireEvent.click(addButton);

    // Still should have only 50 pieces
    materialSelects = screen.getAllByLabelText(/Anyag/);
    expect(materialSelects).toHaveLength(50);
  }, 30000); // 30 second timeout for this slow test
});
