/**
 * A katalógus-törlés megerősítő folyamata (PLAN-05 F3+).
 *
 * A `window.confirm` helyére a portál `useConfirm()`-ja lépett, ezért a
 * viselkedést a dialóguson keresztül mérjük: a törlés CSAK a megerősítés után
 * történik meg, és a `window.confirm` nem hívódik többé.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider } from '@spaceos/portal-ui'
import { CatalogPanel } from '../CatalogPanel'

function renderPanel() {
  const user = userEvent.setup()
  render(
    <ConfirmProvider>
      <CatalogPanel />
    </ConfirmProvider>,
  )
  return { user }
}

/** Megnyitja az első sor akció-menüjét, és rákattint a Delete-re. */
async function startDelete(user: ReturnType<typeof userEvent.setup>) {
  const productName = screen.getAllByText('Tölgy furnér 18mm')[0]
  const row = productName.closest('div[class*="grid"]') ?? document.body
  await user.click(within(row as HTMLElement).getByRole('button', { name: 'Row actions' }))
  await user.click(screen.getByRole('button', { name: /Delete/ }))
}

beforeEach(() => {
  localStorage.clear()
})

describe('CatalogPanel — törlés megerősítéssel', () => {
  it('a portál dialógusát nyitja meg, nem a natív window.confirm-ot', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderPanel()

    await startDelete(user)

    expect(await screen.findByRole('alertdialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Biztosan törlöd a terméket?' })).toBeTruthy()
    expect(nativeConfirm).not.toHaveBeenCalled()
    nativeConfirm.mockRestore()
  })

  it('mégse esetén a termék a katalógusban marad', async () => {
    const { user } = renderPanel()
    const before = screen.getAllByText('Tölgy furnér 18mm').length

    await startDelete(user)
    await user.click(await screen.findByRole('button', { name: 'Mégse' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getAllByText('Tölgy furnér 18mm')).toHaveLength(before)
  })

  it('megerősítés után a termék eltűnik', async () => {
    const { user } = renderPanel()

    await startDelete(user)
    await user.click(await screen.findByRole('button', { name: 'Törlés' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(screen.queryByText('Tölgy furnér 18mm')).toBeNull()
  })
})
