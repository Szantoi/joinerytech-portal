import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { controllingApiHandlers, resetControllingDb, getControllingDb } from '../../mocks'
import { AdjustmentsScreen } from '../AdjustmentsScreen'
import { createControllingWrapper } from './controllingTestUtils'

/**
 * Mutáció-folyam: új utókalkulációs korrekció rögzítése (validáció +
 * sikeres beküldés + toast + lista-frissülés) és soft-delete.
 */

const server = setupServer(...controllingApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetControllingDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function openForm() {
  render(<AdjustmentsScreen />, { wrapper: createControllingWrapper() })
  fireEvent.click(await screen.findByRole('button', { name: 'Új korrekció' }))
  return within(await screen.findByRole('dialog'))
}

describe('utókalkuláció — korrekció-rögzítés folyam', () => {
  it('hiányos űrlapnál a beküldés magyarázottan tiltott (aria-disabled)', async () => {
    const dialog = await openForm()
    const submit = dialog.getByRole('button', { name: 'Korrekció rögzítése' })
    // projekt-hatály az alapértelmezés, projekt nélkül → tiltott
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(dialog.getByRole('tooltip')).toHaveTextContent('Válassz projektet.')
  })

  it('kitöltött űrlap beküldése: 201 + toast + a lista frissül', async () => {
    const dialog = await openForm()

    // portfólió-hatály → nem kell projekt
    fireEvent.change(dialog.getByLabelText(/Hatály/), { target: { value: 'portfolio' } })
    fireEvent.change(dialog.getByLabelText(/Költség-kategória/), { target: { value: 'rezsi' } })
    fireEvent.change(dialog.getByLabelText(/Összeg/), { target: { value: '25000' } })
    fireEvent.change(dialog.getByLabelText(/Indok/), { target: { value: 'Teszt — fűtés-korrekció' } })

    const submit = dialog.getByRole('button', { name: 'Korrekció rögzítése' })
    expect(submit).not.toHaveAttribute('aria-disabled')
    fireEvent.click(submit)

    // toast + az új tétel megjelenik a listában (kettős render → findAll)
    expect(await screen.findByText(/Korrekció rögzítve: CADJ-004/)).toBeInTheDocument()
    expect((await screen.findAllByText('Teszt — fűtés-korrekció')).length).toBeGreaterThan(0)

    // a store-ban portfólió-hatállyal, projekt nélkül landolt
    const stored = getControllingDb().adjustments.find((a) => a.id === 'CADJ-004')!
    expect(stored.scope).toBe('portfolio')
    expect(stored.projectId).toBeNull()
    expect(stored.amount).toBe(25_000)
  })

  it('törlés: a tétel eltűnik a listából (soft-delete) + toast', async () => {
    render(<AdjustmentsScreen />, { wrapper: createControllingWrapper() })
    const deleteButtons = await screen.findAllByRole('button', {
      name: /Korrekció törlése: Garanciális utómunka/,
    })
    fireEvent.click(deleteButtons[0])

    expect(await screen.findByText('Korrekció törölve')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(/Garanciális utómunka/)).not.toBeInTheDocument(),
    )
    // soft-delete: a store-ban megmarad, csak jelölve
    expect(getControllingDb().adjustments.find((a) => a.id === 'CADJ-002')!.isDeleted).toBe(true)
  })
})
