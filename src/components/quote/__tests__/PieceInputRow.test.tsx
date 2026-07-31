/**
 * `PieceInputRow` — a publikus árajánlat-űrlap (/quote-request) tétel-sora.
 *
 * A komponensnek eddig nem volt tesztje. A kiváltó ok a lint-lelet
 * (react-hooks/purity, `Math.random()` renderben): az id-képzés azonos anyagú
 * soroknál DUPLIKÁLT DOM-id-t adott — a böngésző a címkét mindig az ELSŐ
 * találathoz köti, tehát a 2. sor „Anyag" címkéjére kattintva az 1. sor
 * mezője nyílt, és a képernyőolvasó is azt olvasta fel. Üres anyagnál pedig
 * az id renderenként újrasorsolódott. A tesztek a BÖNGÉSZŐ-viselkedést kötik
 * ki (`label.control` — ugyanaz az id-feloldás, amit a kattintás használ).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PieceInputRow } from '../PieceInputRow'
import type { CutPieceInput, Material } from '../../../types/quote'

const MATERIALS: Material[] = [
  { code: 'MDF-18', name: 'MDF', thickness: 18 } as Material,
]

function piece(over: Partial<CutPieceInput> = {}): CutPieceInput {
  return {
    materialCode: 'MDF-18',
    length: 600,
    width: 400,
    quantity: 1,
    edgeBanding: 'None',
    ...over,
  } as CutPieceInput
}

function materialLabels(): HTMLLabelElement[] {
  return screen
    .getAllByText(/^Anyag/)
    .map((el) => el.closest('label'))
    .filter((el): el is HTMLLabelElement => el !== null)
}

describe('PieceInputRow', () => {
  it('azonos anyagú sorok címkéi KÜLÖN mezőkhöz kötnek (nincs duplikált id)', () => {
    render(
      <>
        <PieceInputRow piece={piece()} materials={MATERIALS} onChange={() => {}} onRemove={() => {}} showRemove />
        <PieceInputRow piece={piece()} materials={MATERIALS} onChange={() => {}} onRemove={() => {}} showRemove />
      </>,
    )

    // `label.control` pontosan azt az id-feloldást használja, amit a
    // kattintás és a felolvasás: duplikált id-nél MINDKÉT címke az első
    // mezőt találná meg.
    const controls = materialLabels().map((l) => l.control)
    expect(controls).toHaveLength(2)
    expect(controls[0]).not.toBeNull()
    expect(controls[1]).not.toBeNull()
    expect(controls[0]).not.toBe(controls[1])
  })

  it('a dokumentumban minden id egyedi (az éllezés-mezőké is)', () => {
    const { container } = render(
      <>
        <PieceInputRow piece={piece()} materials={MATERIALS} onChange={() => {}} onRemove={() => {}} showRemove />
        <PieceInputRow piece={piece()} materials={MATERIALS} onChange={() => {}} onRemove={() => {}} showRemove />
      </>,
    )

    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('üres anyagnál az id nem sorsolódik újra render-ek között', () => {
    const empty = piece({ materialCode: '' })
    const { rerender } = render(
      <PieceInputRow piece={empty} materials={MATERIALS} onChange={() => {}} onRemove={() => {}} showRemove={false} />,
    )
    const before = materialLabels()[0].control?.id

    // Bármely mező-változás új renderrel jár — az id-nak túl kell élnie.
    rerender(
      <PieceInputRow
        piece={{ ...empty, length: 601 }}
        materials={MATERIALS}
        onChange={() => {}}
        onRemove={() => {}}
        showRemove={false}
      />,
    )
    const after = materialLabels()[0].control?.id

    expect(before).toBeTruthy()
    expect(after).toBe(before)
  })
})
