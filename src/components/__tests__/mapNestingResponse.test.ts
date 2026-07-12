import { describe, it, expect } from 'vitest'
import { mapNestingResponse, type NestingResultResponse, type PanelAssignmentResponse, type PlacedPartResponse } from '../NestingViewer'

describe('mapNestingResponse', () => {
  it('maps backend response to frontend display format correctly', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'sheet-123',
      OrderReference: 'ORD-2026-001',
      Groups: [],
      TotalParts: 15,
      PanelAssignments: [
        {
          PanelStockId: 'panel-1',
          MaterialType: 'EG-3303-18',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          PlacedParts: [
            {
              PartName: 'Part-001',
              X: 0,
              Y: 0,
              WidthMm: 400,
              HeightMm: 600,
              IsRotated: false,
            },
            {
              PartName: 'Part-002',
              X: 400,
              Y: 0,
              WidthMm: 300,
              HeightMm: 500,
              IsRotated: true,
            },
          ],
          WasteAreaMm2: 500000,
          UtilizationPercent: 85.5,
        },
      ],
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.sheets).toHaveLength(1)
    expect(result.orderReference).toBe('ORD-2026-001')
    expect(result.totalParts).toBe(15)
    expect(result.strategy).toBe('Default')

    const sheet = result.sheets[0]
    expect(sheet.id).toBe('panel-1')
    expect(sheet.width).toBe(2800)
    expect(sheet.height).toBe(2070)
    expect(sheet.wastePercentage).toBe(14.5) // 100 - 85.5
    expect(sheet.placedParts).toHaveLength(2)

    const part1 = sheet.placedParts[0]
    expect(part1.id).toBe('Part-001')
    expect(part1.x).toBe(0)
    expect(part1.y).toBe(0)
    expect(part1.width).toBe(400)
    expect(part1.height).toBe(600)
    expect(part1.materialType).toBe('EG-3303-18')
    expect(part1.rotated).toBe(false)

    const part2 = sheet.placedParts[1]
    expect(part2.rotated).toBe(true)
  })

  it('handles empty PanelAssignments gracefully', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'sheet-456',
      OrderReference: 'ORD-2026-002',
      Groups: [],
      TotalParts: 0,
      PanelAssignments: null,
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.sheets).toHaveLength(0)
    expect(result.strategy).toBe('Unknown')
    expect(result.orderReference).toBe('ORD-2026-002')
    expect(result.totalParts).toBe(0)
  })

  it('handles multiple panels correctly', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'sheet-789',
      OrderReference: 'ORD-2026-003',
      Groups: [],
      TotalParts: 10,
      PanelAssignments: [
        {
          PanelStockId: 'panel-1',
          MaterialType: 'MDF-019',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          PlacedParts: [],
          WasteAreaMm2: 100000,
          UtilizationPercent: 90.0,
        },
        {
          PanelStockId: 'panel-2',
          MaterialType: 'MDF-019',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          PlacedParts: [],
          WasteAreaMm2: 200000,
          UtilizationPercent: 80.5,
        },
      ],
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.sheets).toHaveLength(2)
    expect(result.sheets[0].wastePercentage).toBe(10.0) // 100 - 90
    expect(result.sheets[1].wastePercentage).toBe(19.5) // 100 - 80.5
  })

  it('sets strategy to Optimized when Groups are present', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'sheet-001',
      OrderReference: 'ORD-2026-004',
      Groups: [
        {
          MaterialType: 'EG-3303-18',
          ThicknessMm: 18,
          Lines: [],
        },
      ],
      TotalParts: 5,
      PanelAssignments: [
        {
          PanelStockId: 'panel-1',
          MaterialType: 'EG-3303-18',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          PlacedParts: [],
          WasteAreaMm2: 50000,
          UtilizationPercent: 95.0,
        },
      ],
    }

    const result = mapNestingResponse(backendResponse)

    expect(result.strategy).toBe('Optimized')
  })

  it('correctly maps materialType from panel to all parts', () => {
    const backendResponse: NestingResultResponse = {
      SheetId: 'sheet-555',
      OrderReference: 'ORD-2026-005',
      Groups: [],
      TotalParts: 3,
      PanelAssignments: [
        {
          PanelStockId: 'panel-1',
          MaterialType: 'EG-1133-18',
          PanelWidthMm: 2800,
          PanelHeightMm: 2070,
          PlacedParts: [
            {
              PartName: 'Part-A',
              X: 0,
              Y: 0,
              WidthMm: 100,
              HeightMm: 200,
              IsRotated: false,
            },
            {
              PartName: 'Part-B',
              X: 100,
              Y: 0,
              WidthMm: 150,
              HeightMm: 250,
              IsRotated: false,
            },
          ],
          WasteAreaMm2: 80000,
          UtilizationPercent: 88.0,
        },
      ],
    }

    const result = mapNestingResponse(backendResponse)

    // All parts should inherit the panel's MaterialType
    result.sheets[0].placedParts.forEach(part => {
      expect(part.materialType).toBe('EG-1133-18')
    })
  })
})
