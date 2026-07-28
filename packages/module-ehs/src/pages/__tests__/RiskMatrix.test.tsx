import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  RISK_LIKELIHOODS,
  RISK_SEVERITIES,
  type RiskAssessmentListItem,
  type RiskMatrixCell,
} from '../../services/riskAssessments'
import { RiskMatrix } from '../RiskMatrix'

function buildCells(): RiskMatrixCell[] {
  return RISK_SEVERITIES.flatMap((severity) =>
    RISK_LIKELIHOODS.map((likelihood) => ({
      severity,
      likelihood,
      count: 0,
      // Tudatosan nem score-alapú: bizonyítja, hogy a UI a DTO sávját használja.
      riskLevel: 'kritikus' as const,
    })),
  )
}

function assessment(
  id: string,
  hazardDescription: string,
  status: RiskAssessmentListItem['status'] = 'piszkozat',
): RiskAssessmentListItem {
  return {
    riskAssessmentId: id,
    hazardDescription,
    locationId: null,
    severity: 'enyhe',
    likelihood: 'valoszinutlen',
    riskScore: 4,
    riskLevel: 'alacsony',
    status,
    assessedAt: '2026-07-20T08:00:00Z',
    reviewDueDate: '2026-08-20T08:00:00Z',
  }
}

describe('RiskMatrix', () => {
  it('szemantikus 5×5 táblát renderel fordított valószínűség- és növekvő súlyosság-tengellyel', () => {
    render(<RiskMatrix cells={buildCells()} assessments={[]} onSelect={vi.fn()} />)

    const table = screen.getByRole('table', { name: /5×5 kockázati mátrix/ })
    expect(screen.getByRole('region', { name: /vízszintesen görgethető/ })).toHaveAttribute('tabindex', '0')
    expect(within(table).getAllByRole('cell')).toHaveLength(25)

    const rowHeaders = within(table).getAllByRole('rowheader')
    expect(rowHeaders.map((header) => header.textContent?.trim())).toEqual([
      '5Szinte biztos',
      '4Valószínű',
      '3Lehetséges',
      '2Valószínűtlen',
      '1Ritka',
    ])

    const columnHeaders = within(table).getAllByRole('columnheader').slice(1)
    expect(columnHeaders.map((header) => header.textContent?.trim())).toEqual([
      '1Elhanyagolható',
      '2Enyhe',
      '3Közepes',
      '4Súlyos',
      '5Katasztrofális',
    ])
  })

  it('mind a 25 DTO-cellát kulccsal rendeli, és a kapott riskLevelt mutatja újraszámítás nélkül', () => {
    render(<RiskMatrix cells={buildCells().reverse()} assessments={[]} onSelect={vi.fn()} />)

    const lowScoreCell = screen.getByRole('cell', {
      name: 'Valószínűség: Ritka (1); Súlyosság: Elhanyagolható (1); Kockázati szint: Kritikus; 0 értékelés',
    })
    expect(within(lowScoreCell).getByText('Kritikus')).toBeInTheDocument()
    expect(lowScoreCell).toHaveClass('bg-rose-50', 'dark:bg-rose-950')
    expect(screen.getAllByText('0', { selector: 'span' })).toHaveLength(25)
  })

  it('több nem archivált rekordgombot kezel egy cellában és az azonosítóval választ', () => {
    const cells = buildCells()
    const target = cells.find(
      (cell) => cell.severity === 'enyhe' && cell.likelihood === 'valoszinutlen',
    )!
    target.count = 2
    const onSelect = vi.fn()
    const assessments = [
      assessment('11111111-1111-4111-8111-111111111111', 'Első veszély'),
      assessment('22222222-2222-4222-8222-222222222222', 'Második veszély', 'jovahagyva'),
      assessment('33333333-3333-4333-8333-333333333333', 'Archivált veszély', 'archivalt'),
    ]

    render(<RiskMatrix cells={cells} assessments={assessments} onSelect={onSelect} />)

    const cell = screen.getByRole('cell', {
      name: /Valószínűség: Valószínűtlen \(2\); Súlyosság: Enyhe \(2\).*2 értékelés/,
    })
    expect(within(cell).getAllByRole('button')).toHaveLength(2)
    expect(within(cell).queryByText('Archivált veszély')).not.toBeInTheDocument()

    fireEvent.click(within(cell).getByRole('button', { name: /Második veszély/ }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222')
  })

  it('külön jelzi a valóban üres és a szűrés miatt chip nélküli cellát', () => {
    const cells = buildCells()
    cells.find((cell) => cell.severity === 'sulyos' && cell.likelihood === 'valoszinu')!.count = 3

    render(<RiskMatrix cells={cells} assessments={[]} onSelect={vi.fn()} />)

    const filteredCell = screen.getByRole('cell', {
      name: /Valószínűség: Valószínű \(4\); Súlyosság: Súlyos \(4\).*3 értékelés/,
    })
    expect(within(filteredCell).getByText('A szűrésben nincs megjeleníthető értékelés.'))
      .toBeInTheDocument()

    const emptyCell = screen.getByRole('cell', {
      name: /Valószínűség: Ritka \(1\); Súlyosság: Enyhe \(2\).*0 értékelés/,
    })
    expect(within(emptyCell).getByText('Nincs értékelés.')).toBeInTheDocument()
  })
})
