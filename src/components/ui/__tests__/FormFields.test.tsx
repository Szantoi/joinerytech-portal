import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateField, SelectField, TextAreaField } from '../FormFields'

describe('shared form fields', () => {
  it('associates the select label and preserves an explicit id', () => {
    render(
      <SelectField id="project-scope" label="Hatály" required defaultValue="project">
        <option value="project">Projekt</option>
      </SelectField>,
    )

    const select = screen.getByRole('combobox', { name: 'Hatály' })
    expect(select).toHaveAttribute('id', 'project-scope')
    expect(select).toBeRequired()
  })

  it('supports native textarea props and wrapper styling', () => {
    render(<TextAreaField label="Indok" className="col-span-2" rows={5} placeholder="Részletek" />)

    const textarea = screen.getByRole('textbox', { name: 'Indok' })
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea.parentElement).toHaveClass('col-span-2')
  })

  it('returns the changed date value without leaking a DOM event', () => {
    const onChange = vi.fn()
    render(<DateField label="Határidő" value="2026-07-22" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Határidő'), { target: { value: '2026-07-23' } })
    expect(onChange).toHaveBeenCalledWith('2026-07-23')
  })
})
