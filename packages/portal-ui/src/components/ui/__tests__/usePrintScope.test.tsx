import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePrintScope } from '../hooks/usePrintScope'

function Harness() {
  const { scopeRef, print } = usePrintScope<HTMLElement>()
  return (
    <div>
      <section ref={scopeRef} data-testid="region">
        nyomtatandó rész
      </section>
      <p>ez nem nyomtatódik</p>
      <button type="button" onClick={print}>
        Nyomtatás
      </button>
    </div>
  )
}

/** Ref-fel ellátott hook-példány React-eseménykezelő nélkül — a hibaágakhoz. */
function renderAttachedHook() {
  const region = document.createElement('div')
  document.body.appendChild(region)
  const { result } = renderHook(() => usePrintScope<HTMLDivElement>())
  result.current.scopeRef.current = region
  return { result, region }
}

afterEach(() => {
  document.documentElement.removeAttribute('data-print-scope')
  document.body.querySelectorAll('[data-print-region]').forEach((el) => el.remove())
})

describe('usePrintScope', () => {
  it('marks the region and the root while printing, then cleans up', async () => {
    const seen: { scope: string | null; region: string | null } = { scope: null, region: null }
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      // A nyomtatás pillanatában kell állnia a jelölésnek — ekkor él a @media print szabály.
      seen.scope = document.documentElement.getAttribute('data-print-scope')
      seen.region = screen.getByTestId('region').getAttribute('data-print-region')
    })

    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Nyomtatás' }))

    expect(print).toHaveBeenCalledOnce()
    expect(seen.scope).toBe('')
    expect(seen.region).toBe('')
    // Nyomtatás után nem marad jelölés a DOM-ban.
    expect(document.documentElement.hasAttribute('data-print-scope')).toBe(false)
    expect(screen.getByTestId('region').hasAttribute('data-print-region')).toBe(false)
    print.mockRestore()
  })

  it('cleans up even when window.print throws', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      throw new Error('cancelled')
    })
    const { result, region } = renderAttachedHook()

    expect(() => result.current.print()).toThrow('cancelled')
    expect(document.documentElement.hasAttribute('data-print-scope')).toBe(false)
    expect(region.hasAttribute('data-print-region')).toBe(false)
    print.mockRestore()
  })

  it('cleans up when the browser never fires afterprint (cancelled dialog)', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { result, region } = renderAttachedHook()

    result.current.print()
    // Nincs afterprint-esemény — a védőág mégis leszedi a jelölést.
    window.dispatchEvent(new Event('afterprint'))
    expect(document.documentElement.hasAttribute('data-print-scope')).toBe(false)
    expect(region.hasAttribute('data-print-region')).toBe(false)
    print.mockRestore()
  })

  it('does nothing when the ref is not attached', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { result } = renderHook(() => usePrintScope())

    result.current.print()

    expect(print).not.toHaveBeenCalled()
    expect(document.documentElement.hasAttribute('data-print-scope')).toBe(false)
    print.mockRestore()
  })
})
