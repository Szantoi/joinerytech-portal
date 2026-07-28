import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlideOver } from '../SlideOver'

/** Harness with a real trigger so focus return can be asserted. */
function Harness({ footer }: { footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Megnyitás</button>
      <SlideOver open={open} onClose={() => setOpen(false)} title="Teszt panel" subtitle="Alcím" footer={footer}>
        <button>Első</button>
        <button>Második</button>
      </SlideOver>
    </>
  )
}

describe('SlideOver', () => {
  it('renders nothing when closed', () => {
    render(
      <SlideOver open={false} onClose={() => {}} title="Test">
        <div>Content</div>
      </SlideOver>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('exposes dialog semantics: role, aria-modal, accessible name from title', () => {
    render(
      <SlideOver open={true} onClose={() => {}} title="Teszt panel" subtitle="Alcím">
        <div>Tartalom</div>
      </SlideOver>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Teszt panel' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Alcím')
  })

  it('moves focus into the panel on open', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Megnyitás'))
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('traps Tab: cycles from last focusable back to first', async () => {
    const user = userEvent.setup()
    render(<Harness footer={<button>Mentés</button>} />)
    fireEvent.click(screen.getByText('Megnyitás'))

    const dialog = screen.getByRole('dialog')
    const first = screen.getByRole('button', { name: /vissza/i })
    const last = screen.getByRole('button', { name: 'Mentés' })

    last.focus()
    await user.tab()
    expect(document.activeElement).toBe(first)

    // Shift+Tab from the first focusable wraps to the last
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(last)
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('keeps dynamically added controls inside the trap', async () => {
    const user = userEvent.setup()
    function DynamicHarness() {
      const [open, setOpen] = useState(true)
      const [extra, setExtra] = useState(false)
      return (
        <SlideOver open={open} onClose={() => setOpen(false)} title="Panel">
          <button onClick={() => setExtra(true)}>Bővítés</button>
          {extra && <button>Új gomb</button>}
        </SlideOver>
      )
    }
    render(<DynamicHarness />)
    fireEvent.click(screen.getByText('Bővítés'))
    const added = screen.getByRole('button', { name: 'Új gomb' })
    added.focus()
    // The dynamically added button is now the last focusable — Tab wraps to first
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /vissza/i }))
  })

  it('closes on Escape and returns focus to the trigger', () => {
    render(<Harness />)
    const trigger = screen.getByText('Megnyitás')
    trigger.focus() // jsdom does not focus on click — emulate a real activation
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on overlay click', () => {
    const onClose = vi.fn()
    const { container } = render(
      <SlideOver open={true} onClose={onClose} title="Panel">
        <div>x</div>
      </SlideOver>,
    )
    const overlay = container.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes via the X button (aria-label Bezárás) and the mobile Vissza button', () => {
    const onClose = vi.fn()
    render(
      <SlideOver open={true} onClose={onClose} title="Panel">
        <div>x</div>
      </SlideOver>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }))
    fireEvent.click(screen.getByRole('button', { name: /vissza/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('makes the background inert and locks scroll while open, restoring on close', () => {
    render(<Harness />)
    const trigger = screen.getByText('Megnyitás')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
  })

  it('renders footer content', () => {
    render(
      <SlideOver open={true} onClose={() => {}} title="Panel" footer={<button>Mentés</button>}>
        <div>x</div>
      </SlideOver>,
    )
    expect(screen.getByRole('button', { name: 'Mentés' })).toBeTruthy()
  })
})
