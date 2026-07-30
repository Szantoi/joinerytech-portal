/**
 * `EditableCell` — a soron belüli szerkesztés belépője.
 *
 * A zárat a komponens `useEditLock(isEditing ? rowId : null)`-lel kéri, viszont
 * az `acquireLock()`-ot a dupla kattintáskor hívja, AMIKOR az `isEditing` még
 * `false` — ilyenkor a hook `rowId`-ja `null`, az `acquireLock` pedig az első
 * sorában `false`-szal tér vissza. A `setIsEditing(true)` így sosem fut le.
 *
 * A hook saját tesztje (`hooks/__tests__/useEditLock.test.ts`) végig NEM-null
 * `rowId`-val hívja, ezért zöld — a rést csak a fogyasztó felől lehet látni.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditableCell } from '../EditableCell'

beforeEach(() => {
  localStorage.clear()
})

describe('EditableCell — belépés szerkesztő módba', () => {
  it('dupla kattintásra beviteli mezőt nyit', async () => {
    const user = userEvent.setup()
    render(<EditableCell rowId="prod-001-name" value="Tölgy furnér 18mm" onSave={() => {}} />)

    await user.dblClick(screen.getByText('Tölgy furnér 18mm'))

    expect(await screen.findByDisplayValue('Tölgy furnér 18mm')).toBeTruthy()
  })

  it('Enterre menti az új értéket', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditableCell rowId="prod-001-price" value="8500" onSave={onSave} />)

    await user.dblClick(screen.getByText('8500'))
    const input = await screen.findByDisplayValue('8500')
    await user.clear(input)
    await user.type(input, '9000')
    await user.keyboard('{Enter}')

    expect(onSave).toHaveBeenCalledWith('9000')
  })

  it('Escape-re elveti a módosítást', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditableCell rowId="prod-001-stock" value="125" onSave={onSave} />)

    await user.dblClick(screen.getByText('125'))
    const input = await screen.findByDisplayValue('125')
    await user.clear(input)
    await user.type(input, '999')
    await user.keyboard('{Escape}')

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('125')).toBeTruthy()
  })

  it('kívülről frissült értékkel lép szerkesztő módba (a törölt szinkron-effekt premisszája)', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <EditableCell rowId="prod-001-price" value="8500" onSave={() => {}} />,
    )

    // az érték kívülről változik, miközben a cella megjelenítő módban van
    rerender(<EditableCell rowId="prod-001-price" value="9900" onSave={() => {}} />)
    await user.dblClick(screen.getByText('9900'))

    // a beviteli mező a FRISS értéket kapja, nem a kezdeti `useState`-belit
    expect(await screen.findByDisplayValue('9900')).toBeTruthy()
  })

  it('szerkesztés közben zárat tart, utána elengedi', async () => {
    const user = userEvent.setup()
    const readLocks = () =>
      JSON.parse(localStorage.getItem('spaceos_edit_locks') ?? '{}')
    render(<EditableCell rowId="prod-001-name" value="Tölgy" onSave={() => {}} />)

    await user.dblClick(screen.getByText('Tölgy'))
    await screen.findByDisplayValue('Tölgy')
    // a „megvan" ág kell, különben a teszt üresen is zöld: zár nélkül a
    // szerkesztő mód sem nyílik meg, és a kiengedést semmi nem bizonyítja
    expect(readLocks()['prod-001-name']).toBeTruthy()

    await user.keyboard('{Escape}')

    expect(readLocks()['prod-001-name']).toBeUndefined()
  })
})
