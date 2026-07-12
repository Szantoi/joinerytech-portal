import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { BOMPreviewCard } from '../BOMPreviewCard'
import type { BOMItem } from '../../types/configurator.types'

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
    totalPrice: 8500
  },
  {
    itemType: 'veneer',
    name: 'Tölgy furnér',
    quantity: 2,
    unit: 'm²',
    unitPrice: 5200,
    totalPrice: 10400
  },
  {
    itemType: 'fitting',
    name: 'Rejtett 3D zsanér',
    quantity: 3,
    unit: 'db',
    unitPrice: 1200,
    totalPrice: 3600
  }
]

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  )
}

describe('BOMPreviewCard', () => {
  it('renders BOM preview title', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Bill of Materials Preview')).toBeTruthy()
  })

  it('displays all BOM items in table', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Forgácslap 18mm')).toBeTruthy()
    expect(screen.getByText('Tölgy furnér')).toBeTruthy()
    expect(screen.getByText('Rejtett 3D zsanér')).toBeTruthy()
  })

  it('shows correct total material cost', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Total Material Cost:')).toBeTruthy()
    const totalMaterialCost = mockBOMItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const costElements = screen.getAllByText(new RegExp(totalMaterialCost.toLocaleString()))
    expect(costElements.length).toBeGreaterThan(0)
  })

  it('shows estimated labor cost', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Estimated Labor:')).toBeTruthy()
    const totalMaterialCost = mockBOMItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const estimatedLabor = 45000 - totalMaterialCost
    const laborElements = screen.getAllByText(new RegExp(estimatedLabor.toLocaleString()))
    expect(laborElements.length).toBeGreaterThan(0)
  })

  it('displays total estimated price', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('45,000 Ft')).toBeTruthy()
  })

  it('has Download PDF button', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Download PDF')).toBeTruthy()
  })

  it('has Create Work Order button', () => {
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    expect(screen.getByText('Create Work Order')).toBeTruthy()
  })

  it('navigates to work order page when Create Work Order clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    const createButton = screen.getByText('Create Work Order')
    await user.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/new/cfg_2026_042')
  })

  it('opens PDF in new window when Download PDF clicked', async () => {
    const user = userEvent.setup()
    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    renderWithRouter(
      <BOMPreviewCard
        configId="cfg_2026_042"
        bomItems={mockBOMItems}
        estimatedPrice={45000}
      />
    )

    const downloadButton = screen.getByText('Download PDF')
    await user.click(downloadButton)

    expect(mockWindowOpen).toHaveBeenCalledWith('/api/products/preview/cfg_2026_042/pdf', '_blank')

    mockWindowOpen.mockRestore()
  })
})
