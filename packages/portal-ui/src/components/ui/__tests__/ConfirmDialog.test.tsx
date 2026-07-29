import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider } from '../ConfirmDialog'
import { useConfirm } from '../confirmContext'

function Harness({ onResult }: { onResult: (result: boolean) => void }) {
  const { ask } = useConfirm()
  return (
    <button
      type="button"
      onClick={async () => {
        onResult(
          await ask({
            title: 'Biztosan törlöd?',
            description: 'A művelet nem vonható vissza.',
            confirmLabel: 'Törlés',
            cancelLabel: 'Mégse',
            tone: 'danger',
          }),
        )
      }}
    >
      Törlés indítása
    </button>
  )
}

function renderHarness() {
  const onResult = vi.fn()
  const user = userEvent.setup()
  render(
    <ConfirmProvider>
      <Harness onResult={onResult} />
    </ConfirmProvider>,
  )
  return { user, onResult, trigger: screen.getByRole('button', { name: 'Törlés indítása' }) }
}

describe('ConfirmProvider / useConfirm', () => {
  it('opens an alertdialog with the localized texts', async () => {
    const { user, trigger } = renderHarness()
    await user.click(trigger)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Biztosan törlöd?' })).toBeTruthy()
    expect(screen.getByText('A művelet nem vonható vissza.')).toBeTruthy()
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('resolves true on confirm and false on cancel', async () => {
    const { user, onResult, trigger } = renderHarness()

    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'Törlés' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('alertdialog')).toBeNull()

    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'Mégse' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('puts the initial focus on cancel, so a stray Enter is not destructive', async () => {
    const { user, trigger } = renderHarness()
    await user.click(trigger)
    await screen.findByRole('alertdialog')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Mégse' }))
  })

  it('cancels on Escape and returns focus to the trigger', async () => {
    const { user, onResult, trigger } = renderHarness()
    await user.click(trigger)
    await screen.findByRole('alertdialog')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('uses the destructive button variant for the danger tone', async () => {
    const { user, trigger } = renderHarness()
    await user.click(trigger)
    const confirm = await screen.findByRole('button', { name: 'Törlés' })
    expect(confirm.getAttribute('class')).toContain('bg-rose-600')
  })

  it('keeps a 44px touch target on both actions', async () => {
    const { user, trigger } = renderHarness()
    await user.click(trigger)
    for (const name of ['Mégse', 'Törlés']) {
      expect((await screen.findByRole('button', { name })).getAttribute('class')).toContain('h-11')
    }
  })

  it('throws a helpful error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Harness onResult={() => {}} />)).toThrow(/ConfirmProvider/)
    spy.mockRestore()
  })
})

/**
 * PLAN-05 F4 — strukturált összefoglaló.
 *
 * A `details` azért ADAT és nem `ReactNode`, hogy az elrendezés és a szemantika
 * a design-systemé maradjon. Ezek a tesztek pont ezt a szerződést kötik ki.
 */
function DetailsHarness() {
  const { ask } = useConfirm()
  return (
    <button
      type="button"
      onClick={() =>
        ask({
          title: 'Köteg kiosztásának megerősítése',
          confirmLabel: 'Kiosztás',
          cancelLabel: 'Mégse',
          details: [
            { label: 'Célgép', value: 'Holzma HPP380', hint: 'Kapacitás: 100 egység' },
            { label: 'Prioritás', value: '8 — magas', tone: 'danger' },
          ],
        })
      }
    >
      Kiosztás indítása
    </button>
  )
}

describe('ConfirmDialog — strukturált összefoglaló', () => {
  async function openDetailsDialog() {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <DetailsHarness />
      </ConfirmProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Kiosztás indítása' }))
    return { user, dialog: await screen.findByRole('alertdialog') }
  }

  it('a címke→érték viszonyt a markup hordozza (dt/dd), nem a tördelés', async () => {
    await openDetailsDialog()

    expect(screen.getByText('Célgép').tagName).toBe('DT')
    expect(screen.getByText('Holzma HPP380').closest('dd')).not.toBeNull()
    expect(screen.getByText('Kapacitás: 100 egység').closest('dd')).not.toBeNull()
  })

  it('a tónusos érték szövegként is olvasható — a szín nem az egyetlen jelzés', async () => {
    await openDetailsDialog()

    // Ha a tónus csak háttérszín lenne, ez a szöveg nem létezne.
    expect(screen.getByText('8 — magas')).toBeTruthy()
  })

  it('az összefoglaló bekerül az aria-describedby-ba', async () => {
    const { dialog } = await openDetailsDialog()

    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const described = describedBy!.split(' ').map((id) => document.getElementById(id))
    expect(described.every(Boolean)).toBe(true)
    // A leírás nélküli hívásnál is van mit felolvasni: maga az összefoglaló.
    expect(described.some((el) => el?.tagName === 'DL')).toBe(true)
  })

  it('details nélkül nem rendel üres listát', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Harness onResult={() => {}} />
      </ConfirmProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Törlés indítása' }))
    await screen.findByRole('alertdialog')

    expect(document.querySelector('dl')).toBeNull()
  })
})
