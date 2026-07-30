/**
 * `MachineDropZone` — a gép-zóna drag-and-drop célfelülete.
 *
 * A komponensnek eddig nem volt tesztje. A kiváltó ok a lint-lelet: az
 * `isDropTarget` prop a laptól kezdettől megérkezett (húzás folyamatban →
 * true), de a komponens eldobta — húzás közben semmi nem jelezte, hogy a
 * zónák célpontok, csak a közvetlen fölé-húzás. A drop-affordance esete ezt
 * őrzi; a többi a komponens eddig méretlen szerződését rögzíti.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MachineDropZone } from '../MachineDropZone'
import type { Batch, Machine } from '../../../types/scheduling.types'

const MACHINE: Machine = {
  id: 'm-1',
  name: 'CNC-01',
  status: 'Available',
  capacity: 120,
} as Machine

const BATCH: Batch = {
  id: 'b-1',
  name: 'Tölgy frontok',
} as Batch

/** A zóna gyökér-eleme: a gépnév felől keressük, nem class alapján. */
function zoneOf(name: string): HTMLElement {
  const el = screen.getByRole('heading', { name }).closest('div[class*="border-dashed"]')
  if (!el) throw new Error('Nem találom a zónát')
  return el as HTMLElement
}

function renderZone(over: Partial<Parameters<typeof MachineDropZone>[0]> = {}) {
  return render(
    <MachineDropZone
      machine={MACHINE}
      assignedBatches={[]}
      onBatchDrop={() => {}}
      {...over}
    />,
  )
}

describe('MachineDropZone', () => {
  it('húzás közben (isDropTarget) a zóna erős keretet kap — enélkül csak a fölé-húzás jelezte a célpontot', () => {
    renderZone({ isDropTarget: true })
    expect(zoneOf('CNC-01').className).toContain('border-line-strong')
  })

  it('nyugalomban halvány a keret', () => {
    renderZone()
    const cls = zoneOf('CNC-01').className
    expect(cls).not.toContain('border-line-strong')
    expect(cls).toContain('border-line')
  })

  it('drop a köteg- és gép-azonosítóval hívja az onBatchDrop-ot', () => {
    const onBatchDrop = vi.fn()
    renderZone({ onBatchDrop })

    fireEvent.drop(zoneOf('CNC-01'), {
      dataTransfer: {
        getData: () => JSON.stringify({ batchId: BATCH.id }),
      },
    })

    expect(onBatchDrop).toHaveBeenCalledWith('b-1', 'm-1')
  })

  it('érvénytelen drag-adat nem dob és nem hív ki', () => {
    const onBatchDrop = vi.fn()
    renderZone({ onBatchDrop })

    fireEvent.drop(zoneOf('CNC-01'), {
      dataTransfer: { getData: () => 'nem-json' },
    })

    expect(onBatchDrop).not.toHaveBeenCalled()
  })

  it('a gép állapota magyar címkével és tónussal jelenik meg', () => {
    renderZone({ machine: { ...MACHINE, status: 'Maintenance' } as Machine })
    expect(screen.getByText('Karbantartás alatt')).toBeTruthy()
  })

  it('üres zóna a húzás-instrukciót mutatja, kiosztott köteg a nevét', () => {
    const { rerender } = renderZone()
    expect(screen.getByText('Húzd ide a köteget a kiosztáshoz')).toBeTruthy()

    rerender(
      <MachineDropZone machine={MACHINE} assignedBatches={[BATCH]} onBatchDrop={() => {}} />,
    )
    expect(screen.queryByText('Húzd ide a köteget a kiosztáshoz')).toBeNull()
    expect(screen.getByText(/Tölgy frontok/)).toBeTruthy()
  })
})
