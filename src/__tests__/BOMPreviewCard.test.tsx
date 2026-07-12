import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { BOMPreviewCard } from '../components/BOMPreviewCard'
import type { BOMItem } from '../types/configurator.types'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const mockBOMItems: BOMItem[] = [
  {
    itemType: 'material',
    name: 'Forgácslap 18mm',
    quantity: 1,
    unit: 'db',
    unitPrice: 8500,
    totalPrice: 8500,
    supplier: 'Kronospan Hungary',
    inStock: true
  },
  {
    itemType: 'veneer',
    name: 'Tölgy furnér natúr',
    quantity: 2,
    unit: 'm²',
    unitPrice: 5200,
    totalPrice: 10400,
    supplier: 'Veneer Plus Kft',
    inStock: true
  },
  {
    itemType: 'fitting',
    name: 'Rejtett 3D zsanér',
    quantity: 3,
    unit: 'db',
    unitPrice: 1200,
    totalPrice: 3600,
    supplier: 'Blum Hungary',
    inStock: false
  }
]

describe('BOMPreviewCard', () => {
  it('renders BOM items table correctly', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Bill of Materials Preview')).toBeInTheDocument()
    expect(screen.getByText('Forgácslap 18mm')).toBeInTheDocument()
    expect(screen.getByText('Tölgy furnér natúr')).toBeInTheDocument()
    expect(screen.getByText('Rejtett 3D zsanér')).toBeInTheDocument()
  })

  it('displays item types with correct styling', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    const materialBadge = screen.getByText('material')
    expect(materialBadge).toHaveClass('bg-blue-100', 'text-blue-800')

    const veneerBadge = screen.getByText('veneer')
    expect(veneerBadge).toHaveClass('bg-green-100', 'text-green-800')

    const fittingBadge = screen.getByText('fitting')
    expect(fittingBadge).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('calculates and displays cost summary correctly', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    // Total material cost = 8500 + 10400 + 3600 = 22500
    expect(screen.getByText('Total Material Cost:')).toBeInTheDocument()
    const materialCostValues = screen.getAllByText(/22,500/)
    expect(materialCostValues.length).toBeGreaterThan(0)

    // Estimated labor = 45000 - 22500 = 22500
    expect(screen.getByText('Estimated Labor:')).toBeInTheDocument()

    // Total price
    expect(screen.getByText(/45,000/)).toBeInTheDocument()
  })

  it('displays quantities and units correctly', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    // Check quantities
    expect(screen.getByText('1')).toBeInTheDocument() // chipboard quantity
    expect(screen.getByText('2')).toBeInTheDocument() // veneer quantity
    expect(screen.getByText('3')).toBeInTheDocument() // hinge quantity

    // Check units
    expect(screen.getAllByText('db').length).toBeGreaterThan(0)
    expect(screen.getByText('m²')).toBeInTheDocument()
  })

  it('displays prices in Hungarian locale format', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    // Check formatted prices (Hungarian locale uses space as thousands separator)
    const price8500 = screen.getAllByText(/8,500/)
    expect(price8500.length).toBeGreaterThan(0)

    const price10400 = screen.getAllByText(/10,400/)
    expect(price10400.length).toBeGreaterThan(0)

    const price3600 = screen.getAllByText(/3,600/)
    expect(price3600.length).toBeGreaterThan(0)
  })

  it('handles download PDF button click', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    const downloadButton = screen.getByRole('button', { name: /download pdf/i })
    fireEvent.click(downloadButton)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/api/products/preview/cfg_2026_042/pdf',
      '_blank'
    )

    windowOpenSpy.mockRestore()
  })

  it('handles create work order button click', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={mockBOMItems}
          estimatedPrice={45000}
        />
      </BrowserRouter>
    )

    const createButton = screen.getByRole('button', { name: /create work order/i })
    fireEvent.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/new/cfg_2026_042')
  })

  it('renders with empty BOM items', () => {
    render(
      <BrowserRouter>
        <BOMPreviewCard
          configId="cfg_2026_042"
          bomItems={[]}
          estimatedPrice={0}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Bill of Materials Preview')).toBeInTheDocument()
    expect(screen.getByText('Total Material Cost:')).toBeInTheDocument()
    expect(screen.getByText('Total Estimated Price:')).toBeInTheDocument()
  })
})
