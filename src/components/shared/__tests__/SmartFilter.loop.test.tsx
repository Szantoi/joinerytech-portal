import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SmartFilter } from '../SmartFilter'
import { FilterRow } from '../FilterRow'
import type { FilterConfig } from '../../../hooks/useFilterState'

/**
 * STAB-FE-PROCUREMENT-OOM regressziós őrei.
 *
 * A hiba: a `SmartFilter` emit-effektje minden renderben újra hívta az
 * `onFilter`-t, mert (a) az `onFilter` a deps-ben volt (inline arrow → új
 * identitás), és (b) egy instabil `data` prop (`data={items || []}`) új
 * `filteredData`-identitást adott. Ha a szülő ezt state-be tette, végtelen
 * passzív-effekt hurok keletkezett: RTL `act()` alatt heap-OOM (~4GB),
 * böngészőben folyamatos CPU-pörgés.
 *
 * ⚠ Ezek a tesztek SZÁNDÉKOSAN nem „hagyják futni" a hurkot (az beragadna a
 * suite-ban timeout nélkül, mert a hurok szinkron act()-flush). Helyette a
 * hurok MECHANIZMUSÁT pinneljük: hányszor hívódik az `onFilter`.
 */

const CONFIG: FilterConfig = {
  fields: [{ id: 'supplierName', label: 'Szállító', type: 'text' }],
  operators: {
    text: ['CONTAINS', '=', '!='],
    multiselect: ['IN', 'NOT IN'],
    daterange: ['BETWEEN', '>', '<'],
    number: ['=', '!=', '>', '<', '>=', '<='],
  },
}

interface Row { id: string; supplierName: string }
const ROWS: Row[] = [{ id: '1', supplierName: 'Alfa Kft.' }]

function Harness({
  onFilter,
  unstableData,
}: {
  onFilter: (rows: Row[]) => void
  /** true: minden renderben ÚJ tömb-identitás (a hibás hívási hely mintája). */
  unstableData: boolean
}) {
  const [tick, setTick] = useState(0)
  const stable = ROWS
  return (
    <MemoryRouter>
      <button onClick={() => setTick((t) => t + 1)}>render #{tick}</button>
      <SmartFilter
        config={CONFIG}
        data={unstableData ? [...ROWS] : stable}
        onFilter={onFilter}
        presetKey="test"
        showPresets={false}
      />
    </MemoryRouter>
  )
}

describe('SmartFilter — nem emittál újra azonos eredményre (anti-hurok)', () => {
  it('instabil `data` identitás mellett is CSAK egyszer hív onFilter-t', () => {
    const onFilter = vi.fn()
    render(<Harness onFilter={onFilter} unstableData />)
    expect(onFilter).toHaveBeenCalledTimes(1)

    // Három szülő-render, mindegyik ÚJ tömb-identitással: a tartalom azonos,
    // tehát nem szabad újra emittálni. A hibás verzióban ez 4 hívás lenne —
    // valódi hívási helyen (setState az onFilter-ben) pedig végtelen hurok.
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /render #/ }))
    }
    expect(onFilter).toHaveBeenCalledTimes(1)
  })

  it('inline-arrow onFilter (új identitás renderenként) sem indít újra-emittálást', () => {
    const spy = vi.fn()
    render(<Harness onFilter={(rows) => spy(rows)} unstableData={false} />)
    expect(spy).toHaveBeenCalledTimes(1)

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /render #/ }))
    }
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('a szűrés eredményének VALÓDI változása viszont emittál', () => {
    const onFilter = vi.fn<(rows: Row[]) => void>()
    const { rerender } = render(
      <MemoryRouter>
        <SmartFilter config={CONFIG} data={ROWS} onFilter={onFilter} presetKey="t2" showPresets={false} />
      </MemoryRouter>,
    )
    expect(onFilter).toHaveBeenCalledTimes(1)

    const more: Row[] = [...ROWS, { id: '2', supplierName: 'Béta Bt.' }]
    rerender(
      <MemoryRouter>
        <SmartFilter config={CONFIG} data={more} onFilter={onFilter} presetKey="t2" showPresets={false} />
      </MemoryRouter>,
    )
    expect(onFilter).toHaveBeenCalledTimes(2)
    expect(onFilter.mock.calls[1][0]).toHaveLength(2)
  })
})

describe('FilterRow — az onChange identitása nem indíthat újra-emittálást', () => {
  it('a szülő újrarenderelése (új inline-arrow onChange) nem hív újra onChange-et', () => {
    const onChange = vi.fn()
    function RowHarness() {
      const [tick, setTick] = useState(0)
      return (
        <>
          <button onClick={() => setTick((t) => t + 1)}>rerender #{tick}</button>
          {/* inline arrow: MINDEN renderben új identitás — pont ez volt a csapda */}
          <FilterRow
            filterId="row-1"
            config={CONFIG}
            field="supplierName"
            operator="CONTAINS"
            value="Alfa"
            onChange={(f, o, v) => onChange(f, o, v)}
            onRemove={() => {}}
          />
        </>
      )
    }
    render(<RowHarness />)
    const first = onChange.mock.calls.length
    expect(first).toBeGreaterThan(0)

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /rerender #/ }))
    }
    // A hibás verzióban minden render újra emittált volna (first + 3).
    expect(onChange).toHaveBeenCalledTimes(first)
  })
})
