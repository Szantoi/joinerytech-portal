import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useFilterState, type FilterConfig } from '../useFilterState'

/**
 * STAB-FE-PROCUREMENT-OOM (második kör) — a hurok-lánc hook-oldali guardjai.
 *
 * A `updateFilter` a `.map()` miatt MINDIG új tömb-identitást állított elő, és
 * feltétel nélkül state-be tette + URL-t írt. Ez a hívó hatását újrafuttatta →
 * a FilterRow emit-effektjével együtt végtelen hurok. A guard: ha a szűrősorok
 * ÉRDEMBEN nem változtak, nincs setState és nincs URL-írás.
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

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/?supplierName__CONTAINS=Alfa']}>{children}</MemoryRouter>
}

describe('useFilterState — nincs felesleges state/URL írás', () => {
  it('az URL-ből visszaállított szűrő megjelenik az aktív szűrők között', () => {
    const { result } = renderHook(() => useFilterState(CONFIG, [], 'test'), { wrapper })
    expect(result.current.activeFilters).toHaveLength(1)
    expect(result.current.activeFilters[0]).toMatchObject({
      field: 'supplierName', operator: 'CONTAINS', value: 'Alfa',
    })
  })

  it('azonos értékkel hívott updateFilter NEM cserél state-identitást (bail-out)', () => {
    const { result } = renderHook(() => useFilterState(CONFIG, [], 'test2'), { wrapper })
    const before = result.current.activeFilters
    const row = before[0]

    act(() => {
      result.current.updateFilter(row.id, { field: row.field, operator: row.operator, value: row.value })
    })
    // A hibás verzióban ez ÚJ tömb lenne -> új render -> a hívó hatása újra fut.
    expect(result.current.activeFilters).toBe(before)
  })

  it('valódi értékváltozásra viszont frissül', () => {
    const { result } = renderHook(() => useFilterState(CONFIG, [], 'test3'), { wrapper })
    const row = result.current.activeFilters[0]

    act(() => {
      result.current.updateFilter(row.id, { field: row.field, operator: row.operator, value: 'Béta' })
    })
    expect(result.current.activeFilters[0].value).toBe('Béta')
  })
})
