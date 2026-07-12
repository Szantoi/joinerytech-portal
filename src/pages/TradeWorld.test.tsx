import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeWorld } from './TradeWorld';

// Mock fetch
globalThis.fetch = vi.fn() as any;

describe('TradeWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard tab by default', () => {
    render(<TradeWorld />);

    // Header
    expect(screen.getByText('Trade World')).toBeInTheDocument();
    expect(screen.getByText('Manage pricing, quotes, and revenue')).toBeInTheDocument();

    // Dashboard tab should be active
    const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardTab).toHaveClass('border-blue-500');

    // Dashboard KPIs should be visible
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Avg Quote Price')).toBeInTheDocument();
    expect(screen.getByText('Total Quotes')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
  });

  it('switches to pricing rules tab', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false
    });

    render(<TradeWorld />);

    // Click Pricing Rules tab
    const pricingTab = screen.getByRole('button', { name: /Pricing Rules/i });
    fireEvent.click(pricingTab);

    // Wait for pricing rules panel to load
    await waitFor(() => {
      expect(screen.getByText('Material Pricing')).toBeInTheDocument();
    });

    // Pricing tab should now be active
    expect(pricingTab).toHaveClass('border-blue-500');

    // Dashboard should not be visible
    expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
  });

  it('fetches and displays pricing rules', async () => {
    // Mock API response (fallback to mock data)
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false
    });

    render(<TradeWorld />);

    // Switch to pricing rules tab
    const pricingTab = screen.getByRole('button', { name: /Pricing Rules/i });
    fireEvent.click(pricingTab);

    // Wait for tables to render
    await waitFor(() => {
      expect(screen.getByText('Material Pricing')).toBeInTheDocument();
      expect(screen.getByText('Complexity Modifiers')).toBeInTheDocument();
    });

    // Check material pricing table headers
    expect(screen.getByText('Material Type')).toBeInTheDocument();
    expect(screen.getByText('Price / m²')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();

    // Check mock data is displayed
    expect(screen.getByText('MDF')).toBeInTheDocument();
    expect(screen.getByText('Plywood')).toBeInTheDocument();
    expect(screen.getByText('Chipboard')).toBeInTheDocument();

    // Check complexity modifiers table
    expect(screen.getByText('Modifier Type')).toBeInTheDocument();
    expect(screen.getByText('Multiplier')).toBeInTheDocument();
    expect(screen.getByText('Curved Edge')).toBeInTheDocument();
    expect(screen.getByText('Complex Shape')).toBeInTheDocument();
  });

  it('edits material price', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false
    });

    render(<TradeWorld />);

    // Switch to pricing rules tab
    const pricingTab = screen.getByRole('button', { name: /Pricing Rules/i });
    fireEvent.click(pricingTab);

    // Wait for tables
    await waitFor(() => {
      expect(screen.getByText('Material Pricing')).toBeInTheDocument();
    });

    // Click Edit button for first material
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Wait for slide-over
    await waitFor(() => {
      expect(screen.getByText('Edit Material Price')).toBeInTheDocument();
    });

    // Change price
    const priceInput = screen.getByLabelText('Price per m²');
    fireEvent.change(priceInput, { target: { value: '9000' } });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    // Slide-over should close
    await waitFor(() => {
      expect(screen.queryByText('Edit Material Price')).not.toBeInTheDocument();
    });
  });
});
