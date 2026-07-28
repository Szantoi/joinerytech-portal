import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CURRENT_EMPLOYEE_ID, RISK_LIKELIHOODS, RISK_SEVERITIES } from '../../services'
import { RiskAssessmentForm } from '../RiskAssessmentForm'

const LOCATION = {
  locationId: '00000000-0000-4000-8000-0000000a0002',
  name: 'A gyártócsarnok',
}

describe('RiskAssessmentForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 22, 23, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('create módban helyi holnapi minimumot és +30 napos alapértéket használ', () => {
    render(<RiskAssessmentForm mode="create" onSubmit={vi.fn()} />)

    const reviewDate = screen.getByLabelText(/Felülvizsgálat határideje/)
    expect(reviewDate).toHaveAttribute('min', '2026-07-23')
    expect(reviewDate).toHaveValue('2026-08-21')
  })

  it('a kanonikus wire-értékeket teljes magyar emberi címkékkel kínálja', () => {
    render(<RiskAssessmentForm mode="create" onSubmit={vi.fn()} />)

    const severity = screen.getByLabelText(/Súlyosság/) as HTMLSelectElement
    const likelihood = screen.getByLabelText(/Bekövetkezési valószínűség/) as HTMLSelectElement

    expect([...severity.options].slice(1).map(({ value }) => value)).toEqual(RISK_SEVERITIES)
    expect([...severity.options].slice(1).map(({ text }) => text)).toEqual([
      'Elhanyagolható (1)', 'Enyhe (2)', 'Közepes (3)', 'Súlyos (4)',
      'Katasztrofális (5)',
    ])
    expect([...likelihood.options].slice(1).map(({ value }) => value)).toEqual(RISK_LIKELIHOODS)
    expect([...likelihood.options].slice(1).map(({ text }) => text)).toEqual([
      'Ritka (1)', 'Valószínűtlen (2)', 'Lehetséges (3)', 'Valószínű (4)',
      'Szinte biztos (5)',
    ])
  })

  it('create callbacknak pontos payloadot ad, current employee-val és üres locationből null-lal', () => {
    const onSubmit = vi.fn()
    render(<RiskAssessmentForm mode="create" locations={[LOCATION]} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Veszély leírása/), {
      target: { value: '  Csúszásveszély a gépsor mellett  ' },
    })
    fireEvent.change(screen.getByLabelText(/Súlyosság/), { target: { value: 'sulyos' } })
    fireEvent.change(screen.getByLabelText(/Bekövetkezési valószínűség/), {
      target: { value: 'valoszinu' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kockázatértékelés létrehozása' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      hazardDescription: 'Csúszásveszély a gépsor mellett',
      severity: 'sulyos',
      likelihood: 'valoszinu',
      assessedBy: CURRENT_EMPLOYEE_ID,
      reviewDueDate: '2026-08-21T00:00:00.000Z',
      locationId: null,
    })
  })

  it('update módban betölti az értékeket és assessedBy nélküli pontos payloadot ad', () => {
    const onSubmit = vi.fn()
    render(
      <RiskAssessmentForm
        mode="update"
        locations={[LOCATION]}
        initialValues={{
          hazardDescription: 'Forgó alkatrész',
          severity: 'katasztrofalis',
          likelihood: 'ritka',
          reviewDueDate: '2026-10-03T12:45:00+02:00',
          locationId: LOCATION.locationId,
        }}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByLabelText(/Felülvizsgálat határideje/)).toHaveValue('2026-10-03')
    expect(screen.getByLabelText(/Helyszín/)).toHaveValue(LOCATION.locationId)
    fireEvent.click(screen.getByRole('button', { name: 'Módosítások mentése' }))

    expect(onSubmit).toHaveBeenCalledWith({
      hazardDescription: 'Forgó alkatrész',
      severity: 'katasztrofalis',
      likelihood: 'ritka',
      reviewDueDate: '2026-10-03T00:00:00.000Z',
      locationId: LOCATION.locationId,
    })
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('assessedBy')
  })

  it('nem enged whitespace-only veszélyt, és 1000 karakterre korlátozza a mezőt', () => {
    const onSubmit = vi.fn()
    render(<RiskAssessmentForm mode="create" onSubmit={onSubmit} />)

    const hazard = screen.getByLabelText(/Veszély leírása/)
    expect(hazard).toHaveAttribute('maxLength', '1000')
    fireEvent.change(hazard, { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/Súlyosság/), { target: { value: 'enyhe' } })
    fireEvent.change(screen.getByLabelText(/Bekövetkezési valószínűség/), {
      target: { value: 'ritka' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kockázatértékelés létrehozása' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('beküldés alatt minden mezőt és műveletet letilt', () => {
    const onCancel = vi.fn()
    render(
      <RiskAssessmentForm
        mode="create"
        locations={[LOCATION]}
        isSubmitting
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByLabelText(/Veszély leírása/)).toBeDisabled()
    expect(screen.getByLabelText(/Súlyosság/)).toBeDisabled()
    expect(screen.getByLabelText(/Bekövetkezési valószínűség/)).toBeDisabled()
    expect(screen.getByLabelText(/Helyszín/)).toBeDisabled()
    expect(screen.getByLabelText(/Felülvizsgálat határideje/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Kockázatértékelés létrehozása' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mégse' })).toBeDisabled()
  })
})
