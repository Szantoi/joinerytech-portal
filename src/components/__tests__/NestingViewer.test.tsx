import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NestingViewer, type NestingResultDto, mapNestingResponse, type NestingResultResponse } from '../NestingViewer'

describe('NestingViewer', () => {
  const mockNestingData: NestingResultDto = {
    sheets: [
      {
        id: 'sheet-001',
        width: 2800,
        height: 2070,
        wastePercentage: 12.5,
        placedParts: [
          {
            id: 'panel-1',
            x: 0,
            y: 0,
            width: 600,
            height: 800,
            materialType: 'MAT-MELAMINE-001',
            rotated: false,
          },
          {
            id: 'panel-2',
            x: 610,
            y: 0,
            width: 400,
            height: 600,
            materialType: 'MAT-MELAMINE-002',
            rotated: true,
          },
        ],
      },
    ],
    strategy: 'Optimized',
    orderReference: 'JT-2426-0184',
    totalParts: 2,
  }

  it('renders panel grid correctly', () => {
    render(<NestingViewer data={mockNestingData} />)

    // Check that waste percentage is displayed
    expect(screen.getByText(/Hulladék: 12.5%/i)).toBeInTheDocument()

    // Check that strategy is displayed
    expect(screen.getByText(/Stratégia: Optimized/i)).toBeInTheDocument()

    // Check that sheet count is displayed
    expect(screen.getByText(/1 lap/i)).toBeInTheDocument()
  })

  it('displays all panels from API response', () => {
    const { container } = render(<NestingViewer data={mockNestingData} />)

    // Check that SVG elements are rendered (panel rects)
    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()

    // Check that panel labels are rendered as text elements
    const textElements = container.querySelectorAll('text')
    expect(textElements.length).toBeGreaterThanOrEqual(2) // At least 2 panels
  })

  it('displays empty state when no data', () => {
    const emptyData: NestingResultDto = {
      sheets: [],
      strategy: 'None',
    }

    render(<NestingViewer data={emptyData} />)

    expect(screen.getByText('Nincs nesting adat')).toBeInTheDocument()
  })

  it('handles multiple sheets navigation', () => {
    const multiSheetData: NestingResultDto = {
      sheets: [
        {
          id: 'sheet-001',
          width: 2800,
          height: 2070,
          wastePercentage: 12.5,
          placedParts: [],
        },
        {
          id: 'sheet-002',
          width: 2800,
          height: 2070,
          wastePercentage: 8.3,
          placedParts: [],
        },
      ],
      strategy: 'Optimized',
    }

    render(<NestingViewer data={multiSheetData} />)

    // Check that sheet navigation is displayed
    expect(screen.getByText(/2 lap/i)).toBeInTheDocument()
    expect(screen.getByText(/Lap 1 \/ 2/i)).toBeInTheDocument()
  })
})

describe('mapNestingResponse', () => {
  it('correctly maps backend DTO to frontend format', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'abc-123',
      OrderReference: 'JT-2426-0184',
      TotalParts: 2,
      Groups: [
        {
          MaterialType: 'MAT-001',
          ThicknessMm: 18,
          Lines: [
            {
              PartName: 'Part-1',
              WidthMm: 600,
              HeightMm: 800,
              Quantity: 1,
            },
          ],
        },
      ],
      PanelAssignments: [
        {
          PanelStockId: 'panel-stock-1',
          MaterialType: 'MAT-001',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          WasteAreaMm2: 350000,
          UtilizationPercent: 87.5,
          PlacedParts: [
            {
              PartName: 'Part-1',
              X: 0,
              Y: 0,
              WidthMm: 600,
              HeightMm: 800,
              IsRotated: false,
            },
          ],
        },
      ],
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.sheets).toHaveLength(1)
    expect(result.sheets[0].id).toBe('panel-stock-1')
    expect(result.sheets[0].width).toBe(2800)
    expect(result.sheets[0].height).toBe(2070)
    expect(result.sheets[0].wastePercentage).toBe(12.5) // 100 - 87.5
    expect(result.sheets[0].placedParts).toHaveLength(1)
    expect(result.sheets[0].placedParts[0].id).toBe('Part-1')
    expect(result.orderReference).toBe('JT-2426-0184')
    expect(result.totalParts).toBe(2)
  })

  it('handles empty PanelAssignments', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'abc-123',
      OrderReference: 'JT-2426-0184',
      TotalParts: 0,
      Groups: [],
      PanelAssignments: null,
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.sheets).toHaveLength(0)
    expect(result.strategy).toBe('Unknown')
    expect(result.orderReference).toBe('JT-2426-0184')
  })
})
