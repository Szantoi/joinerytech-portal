import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NestingViewer, type NestingResultDto } from '../NestingViewer'

const mockNestingData: NestingResultDto = {
  strategy: 'Guillotine',
  sheets: [
    {
      id: 'sheet-1',
      width: 2800,
      height: 2070,
      wastePercentage: 12.5,
      placedParts: [
        {
          id: 'Part-001',
          x: 0,
          y: 0,
          width: 400,
          height: 600,
          materialType: 'EG-3303-18',
        },
        {
          id: 'Part-002',
          x: 400,
          y: 0,
          width: 300,
          height: 500,
          materialType: 'EG-1133-18',
        },
      ],
    },
    {
      id: 'sheet-2',
      width: 2800,
      height: 2070,
      wastePercentage: 8.3,
      placedParts: [
        {
          id: 'Part-003',
          x: 0,
          y: 0,
          width: 500,
          height: 700,
          materialType: 'MDF-019',
        },
      ],
    },
  ],
}

describe('NestingViewer', () => {
  it('renders stats badge with waste percentage', () => {
    render(<NestingViewer data={mockNestingData} />)
    expect(screen.getByText('Hulladék: 12.5%')).toBeTruthy()
  })

  it('renders stats badge with strategy', () => {
    render(<NestingViewer data={mockNestingData} />)
    expect(screen.getByText('Stratégia: Guillotine')).toBeTruthy()
  })

  it('renders stats badge with sheets count', () => {
    render(<NestingViewer data={mockNestingData} />)
    expect(screen.getByText('2 lap')).toBeTruthy()
  })

  it('renders SVG canvas with correct dimensions', () => {
    const { container } = render(<NestingViewer data={mockNestingData} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(screen.getByText('2800 × 2070 mm')).toBeTruthy()
  })

  it('applies green color for waste < 10%', () => {
    const lowWasteData: NestingResultDto = {
      ...mockNestingData,
      sheets: [
        {
          ...mockNestingData.sheets[0],
          wastePercentage: 5.0,
        },
      ],
    }
    const { container } = render(<NestingViewer data={lowWasteData} />)
    const wasteBadge = screen.getByText('Hulladék: 5.0%').parentElement
    expect(wasteBadge?.className).toContain('text-emerald-700')
    expect(wasteBadge?.className).toContain('bg-emerald-50')
  })

  it('applies yellow color for waste 10-15%', () => {
    const mediumWasteData: NestingResultDto = {
      ...mockNestingData,
      sheets: [
        {
          ...mockNestingData.sheets[0],
          wastePercentage: 12.0,
        },
      ],
    }
    const { container } = render(<NestingViewer data={mediumWasteData} />)
    const wasteBadge = screen.getByText('Hulladék: 12.0%').parentElement
    expect(wasteBadge?.className).toContain('text-amber-700')
    expect(wasteBadge?.className).toContain('bg-amber-50')
  })

  it('applies red color for waste > 15%', () => {
    const highWasteData: NestingResultDto = {
      ...mockNestingData,
      sheets: [
        {
          ...mockNestingData.sheets[0],
          wastePercentage: 18.0,
        },
      ],
    }
    const { container } = render(<NestingViewer data={highWasteData} />)
    const wasteBadge = screen.getByText('Hulladék: 18.0%').parentElement
    expect(wasteBadge?.className).toContain('text-rose-700')
    expect(wasteBadge?.className).toContain('bg-rose-50')
  })

  it('shows navigation controls when multiple sheets', () => {
    render(<NestingViewer data={mockNestingData} />)
    expect(screen.getByText('Lap 1 / 2')).toBeTruthy()
    // Find chevron buttons
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find(btn => btn.querySelector('.rotate-180'))
    const nextButton = buttons.find(btn => btn.querySelector('svg:not(.rotate-180)'))
    expect(prevButton).toBeTruthy()
    expect(nextButton).toBeTruthy()
  })

  it('hides navigation controls when single sheet', () => {
    const singleSheetData: NestingResultDto = {
      ...mockNestingData,
      sheets: [mockNestingData.sheets[0]],
    }
    render(<NestingViewer data={singleSheetData} />)
    expect(screen.queryByText(/Lap \d+ \//)).toBeNull()
  })

  it('navigates to next sheet on next button click', () => {
    render(<NestingViewer data={mockNestingData} />)
    expect(screen.getByText('Lap 1 / 2')).toBeTruthy()

    // Find and click next button
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find(btn => {
      const btnElement = btn as HTMLButtonElement
      const svg = btn.querySelector('svg:not(.rotate-180)')
      return svg && !btnElement.disabled
    }) as HTMLButtonElement | undefined

    if (nextButton) {
      fireEvent.click(nextButton)
      expect(screen.getByText('Lap 2 / 2')).toBeTruthy()
      expect(screen.getByText('Hulladék: 8.3%')).toBeTruthy()
    }
  })

  it('disables prev button on first sheet', () => {
    render(<NestingViewer data={mockNestingData} />)
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find(btn => btn.querySelector('.rotate-180')) as HTMLButtonElement | undefined
    expect(prevButton?.disabled).toBe(true)
  })

  it('disables next button on last sheet', () => {
    render(<NestingViewer data={mockNestingData} />)

    // Navigate to last sheet
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find(btn => {
      const btnElement = btn as HTMLButtonElement
      return btn.querySelector('svg:not(.rotate-180)') && !btnElement.disabled
    }) as HTMLButtonElement | undefined
    if (nextButton) {
      fireEvent.click(nextButton)
    }

    // Check next button is now disabled
    const buttonsAfter = screen.getAllByRole('button')
    const nextButtonAfter = buttonsAfter.find(btn => {
      const svg = btn.querySelector('svg:not(.rotate-180)')
      return svg && btn.className.includes('place-items-center')
    }) as HTMLButtonElement | undefined
    expect(nextButtonAfter?.disabled).toBe(true)
  })

  it('renders empty state when no data', () => {
    const emptyData: NestingResultDto = {
      strategy: 'Guillotine',
      sheets: [],
    }
    render(<NestingViewer data={emptyData} />)
    expect(screen.getByText('Nincs nesting adat')).toBeTruthy()
  })

  it('shows hover tooltip on part hover', () => {
    const { container } = render(<NestingViewer data={mockNestingData} />)
    const svg = container.querySelector('svg')
    const partGroup = svg?.querySelector('g')

    if (partGroup) {
      fireEvent.mouseEnter(partGroup)
      expect(screen.getByText('Part-001')).toBeTruthy()
      expect(screen.getByText('Méret: 400 × 600 mm')).toBeTruthy()
      expect(screen.getByText(/Egger 3303/)).toBeTruthy()
    }
  })

  it('hides tooltip on part mouse leave', () => {
    const { container } = render(<NestingViewer data={mockNestingData} />)
    const svg = container.querySelector('svg')
    const partGroup = svg?.querySelector('g')

    if (partGroup) {
      fireEvent.mouseEnter(partGroup)
      expect(screen.getByText('Part-001')).toBeTruthy()

      fireEvent.mouseLeave(partGroup)
      // Tooltip should be removed
      const tooltips = container.querySelectorAll('.bg-teal-50')
      expect(tooltips.length).toBe(0)
    }
  })

  it('renders material color from CATALOG_LOOKUP', () => {
    const { container } = render(<NestingViewer data={mockNestingData} />)
    const svg = container.querySelector('svg')
    const rects = svg?.querySelectorAll('rect[fill]')

    // First rect should be the sheet background (#fafaf9)
    // Second rect should be Part-001 with EG-3303-18 color (#dcc4a3)
    if (rects && rects.length > 1) {
      const partRect = rects[1] as SVGRectElement
      expect(partRect.getAttribute('fill')).toBe('#dcc4a3')
    }
  })
})
