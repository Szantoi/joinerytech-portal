import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorldShell } from '../WorldShell'

// Auth is globally mocked in test-setup.ts (UserMenu → useAuth).

function renderShell(props: Partial<React.ComponentProps<typeof WorldShell>> = {}) {
  const defaults = {
    worldKey: 'ehs',
    screen: 'dash',
    onScreen: vi.fn(),
    onHome: vi.fn(),
    children: <div>Tartalom</div>,
  }
  const merged = { ...defaults, ...props }
  const utils = render(<WorldShell {...merged} />)
  return { ...merged, ...utils }
}

/** The drawer root: the fixed overlay container that wraps the mobile drawer. */
function drawerRoot(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>('.md\\:hidden.fixed.inset-0.z-50')
  if (!root) throw new Error('drawer root not found')
  return root
}

function openDrawer() {
  const trigger = screen.getByRole('button', { name: 'Menü' })
  trigger.focus() // jsdom does not focus on click — emulate real activation
  fireEvent.click(trigger)
  return trigger
}

describe('WorldShell — mobile drawer dialog semantics (S1)', () => {
  it('is inert while closed, so its controls are unreachable (WCAG 4.1.2)', () => {
    const { container } = renderShell()
    const root = drawerRoot(container)
    expect(root).toHaveAttribute('inert')
    // No dialog is exposed while closed
    expect(screen.queryByRole('dialog')).toBeNull()
    // The drawer's own controls sit inside the inert subtree
    const closeBtn = screen.getByLabelText('Bezárás')
    expect(closeBtn.closest('[inert]')).toBe(root)
  })

  it('exposes role="dialog" + aria-modal + accessible name when open, and lifts inert', () => {
    const { container } = renderShell()
    openDrawer()
    const dialog = screen.getByRole('dialog', { name: 'Menü' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(drawerRoot(container)).not.toHaveAttribute('inert')
  })

  it('moves focus into the drawer on open and makes the background inert', () => {
    const { container } = renderShell()
    openDrawer()
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
    // Siblings of the drawer root (sidebar, main, bottom nav, chat) are inert
    const main = container.querySelector('main')!
    expect(main).toHaveAttribute('inert')
  })

  it('closes on Escape and returns focus to the trigger', () => {
    renderShell()
    const trigger = openDrawer()
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('closes via the Bezárás button', () => {
    const { container } = renderShell()
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(drawerRoot(container)).toHaveAttribute('inert')
  })

  it('navigates via a drawer screen item and closes the drawer', () => {
    const { onScreen } = renderShell()
    openDrawer()
    const dialog = screen.getByRole('dialog')
    const item = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Kockázatok'),
    )!
    fireEvent.click(item)
    expect(onScreen).toHaveBeenCalledWith('risks')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('WorldShell — TopBar labels (M1) and world accent token (S2)', () => {
  it('labels the icon-only bell button and the search input', () => {
    renderShell()
    expect(screen.getByRole('button', { name: 'Értesítések' })).toBeTruthy()
    expect(screen.getByLabelText('Keresés')).toBeTruthy()
  })

  it('uses the tokenized world accent (text-world-soft-fg) instead of raw palette fg', () => {
    const { container } = renderShell()
    const header = container.querySelector('header')!
    // breadcrumb world name + mobile world label are token-driven
    expect(header.querySelectorAll('.text-world-soft-fg').length).toBeGreaterThanOrEqual(2)
    // no raw light-only accent text classes remain in the top bar (S2)
    expect(header.querySelector('[class*="text-red-700"]')).toBeNull()
  })
})
