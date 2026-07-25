import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { useRef } from 'react'
import { useInertBackground } from '../hooks/useInertBackground'

/**
 * useInertBackground — data-inert-exempt kivétel (M-S2 fix,
 * WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24).
 *
 * A toast live-regionöknek nyitott dialógus mellett is az accessibility
 * tree-ben kell maradniuk — az exempt-jelölt testvér NEM kaphat inert-et,
 * minden más testvér igen, és cleanupkor csak a hook által tett inert tűnik el.
 */

function Harness({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useInertBackground(ref, active)
  return (
    <div>
      <div data-testid="sibling-normal">háttér-tartalom</div>
      <div data-testid="sibling-toast" data-inert-exempt="">
        toast live-region
      </div>
      {/* React 19: az inert boolean prop — inert={true} teszi ki az attribútumot */}
      <div data-testid="sibling-preinert" inert={true}>
        már eleve inert
      </div>
      <div ref={ref} data-testid="dialog-root">
        dialógus
      </div>
    </div>
  )
}

afterEach(cleanup)

describe('useInertBackground — data-inert-exempt', () => {
  it('a normál testvér inert lesz, az exempt-jelölt NEM', () => {
    const { getByTestId } = render(<Harness active={true} />)
    expect(getByTestId('sibling-normal').hasAttribute('inert')).toBe(true)
    expect(getByTestId('sibling-toast').hasAttribute('inert')).toBe(false)
    expect(getByTestId('dialog-root').hasAttribute('inert')).toBe(false)
  })

  it('cleanup: a hook által tett inert eltűnik, az eleve-inert megmarad', () => {
    const { getByTestId, rerender } = render(<Harness active={true} />)
    expect(getByTestId('sibling-normal').hasAttribute('inert')).toBe(true)

    rerender(<Harness active={false} />)
    expect(getByTestId('sibling-normal').hasAttribute('inert')).toBe(false)
    expect(getByTestId('sibling-preinert').hasAttribute('inert')).toBe(true)
    expect(getByTestId('sibling-toast').hasAttribute('inert')).toBe(false)
  })

  it('inaktívan semmit nem inert-el', () => {
    const { getByTestId } = render(<Harness active={false} />)
    expect(getByTestId('sibling-normal').hasAttribute('inert')).toBe(false)
    expect(getByTestId('sibling-toast').hasAttribute('inert')).toBe(false)
  })
})
