import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, PrimaryBtn, GhostBtn } from '../Button'

describe('Button', () => {
  it('renders a native button with explicit type="button"', () => {
    render(<Button>Mentés</Button>)
    const btn = screen.getByRole('button', { name: 'Mentés' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('handles click', () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Click</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('applies world token classes on the primary variant', () => {
    render(<Button variant="primary">Test</Button>)
    expect(screen.getByRole('button').className).toContain('bg-world')
  })

  it('applies border on the ghost variant', () => {
    render(<Button variant="ghost">Test</Button>)
    expect(screen.getByRole('button').className).toContain('border')
  })

  it('has a visible focus ring class (never bare outline-none)', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button').className).toContain('focus-visible:ring-2')
  })

  it('renders the icon as decorative (aria-hidden)', () => {
    const { container } = render(<Button icon="plus">Add</Button>)
    const iconWrap = container.querySelector('[aria-hidden="true"]')
    expect(iconWrap?.querySelector('svg')).toBeTruthy()
  })

  describe('FSM-forbidden pattern (disabledReason)', () => {
    it('uses aria-disabled instead of the native disabled attribute', () => {
      render(<Button disabledReason="Nincs jogosultság">Lezárás</Button>)
      const btn = screen.getByRole('button', { name: 'Lezárás' })
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(btn).not.toHaveAttribute('disabled')
    })

    it('remains focusable', () => {
      render(<Button disabledReason="Nincs jogosultság">Lezárás</Button>)
      const btn = screen.getByRole('button', { name: 'Lezárás' })
      btn.focus()
      expect(document.activeElement).toBe(btn)
    })

    it('swallows click activation', () => {
      const fn = vi.fn()
      render(
        <Button onClick={fn} disabledReason="Nincs jogosultság">
          Lezárás
        </Button>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Lezárás' }))
      expect(fn).not.toHaveBeenCalled()
    })

    it('exposes the reason as a tooltip via aria-describedby', () => {
      render(<Button disabledReason="Előbb zárd le a QA ellenőrzést">Lezárás</Button>)
      const btn = screen.getByRole('button', { name: 'Lezárás' })
      const tooltipId = btn.getAttribute('aria-describedby')
      expect(tooltipId).toBeTruthy()
      const tooltip = document.getElementById(tooltipId!)
      expect(tooltip).toHaveAttribute('role', 'tooltip')
      expect(tooltip).toHaveTextContent('Előbb zárd le a QA ellenőrzést')
    })
  })
})

describe('legacy wrappers', () => {
  it('PrimaryBtn renders and handles click', () => {
    const fn = vi.fn()
    render(<PrimaryBtn onClick={fn}>Mentés</PrimaryBtn>)
    fireEvent.click(screen.getByRole('button', { name: 'Mentés' }))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('GhostBtn renders with border styling', () => {
    render(<GhostBtn>Mégse</GhostBtn>)
    expect(screen.getByRole('button', { name: 'Mégse' }).className).toContain('border')
  })
})
