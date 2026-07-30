/**
 * `PriceListDetailSlideOver` — a rules-of-hooks crash regressziós őre.
 *
 * A hiba: a komponens `if (!pl) return null`-t tett HAT hook (4 useState +
 * useEffect + useMutation) ELŐTT. A szülő mindig mountolja a panelt
 * (`open={!!selectedId}`, `listId={selectedId ?? ''}`), így üres listId-nél a
 * `pl` null és a korai return üt (2 hook), az első árlista-kattintáskor viszont
 * a `pl` betölt, a return kimarad, és a hook-szám 2-ről 8-ra ugrik → a React
 * kifekteti az egész oldalt ("rendered more hooks than during the previous
 * render"). A route (/supplier/portal) élő és belépés mögötti — nem gatelt.
 *
 * A crash a `listId` ''→id átmenetéhez kötött, amit MSW nélkül a `allItems`
 * propon át állítunk elő (`pl = data ?? allItems.find(...)`).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceListDetailSlideOver } from '../SupplierPortalPage'

const LIST = {
  id: 'pl-1',
  listNumber: 'ÁR-2026-001',
  supplierId: 'sup-1',
  supplierName: 'Kronospan',
  validFrom: '2026-01-01',
  validTo: null,
  status: 'Draft' as const,
  entries: [
    { id: 'e-1', materialCode: 'OAK-18', materialName: 'Tölgy furnér 18mm', unitPrice: 8500, currency: 'HUF' },
  ],
}

function renderPanel(props: Partial<React.ComponentProps<typeof PriceListDetailSlideOver>>) {
  return render(
    <PriceListDetailSlideOver
      open={false}
      listId=""
      supplierId="sup-1"
      allItems={[LIST]}
      onClose={() => {}}
      onRefetch={() => {}}
      {...props}
    />,
  )
}

describe('PriceListDetailSlideOver — hook-sorrend', () => {
  it('a zárt→nyitott átmenet NEM omlik össze (a korai return minden hook UTÁN áll)', () => {
    // 1. render: zárva, üres listId → pl null → a panel nem renderel tartalmat
    const { rerender } = renderPanel({ open: false, listId: '' })
    expect(screen.queryByText('ÁR-2026-001')).toBeNull()

    // 2. render: kiválasztott lista → pl betölt. A javítás előtt a hook-szám
    //    itt 2-ről 8-ra ugrott és a React kivételt dobott — ezt a rerender
    //    reprodukálja. Javítás után a panel gond nélkül megjelenik.
    expect(() =>
      rerender(
        <PriceListDetailSlideOver
          open
          listId="pl-1"
          supplierId="sup-1"
          allItems={[LIST]}
          onClose={() => {}}
          onRefetch={() => {}}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByText('ÁR-2026-001')).toBeTruthy()
  })

  it('pozitív kontroll: nyitott állapotban a Draft árlista tételei és az aktiváló gomb látszanak', () => {
    renderPanel({ open: true, listId: 'pl-1' })
    // a tétel a táblából
    expect(screen.getByText('Tölgy furnér 18mm')).toBeTruthy()
    // a Draft-only akció elérhető (a hookok lefutottak, a localStatus = 'Draft')
    expect(screen.getByRole('button', { name: /Árlista aktiválása/ })).toBeTruthy()
  })

  it('a lokális státusz a betöltött listát követi (a sync-effekt a korai return előtt fut)', () => {
    // Active lista → nincs Draft-akció, van "aktív árlista" jelzés
    renderPanel({
      open: true,
      listId: 'pl-2',
      allItems: [{ ...LIST, id: 'pl-2', status: 'Active' }],
    })
    expect(screen.queryByRole('button', { name: /Árlista aktiválása/ })).toBeNull()
    expect(screen.getByText(/aktív árlista/)).toBeTruthy()
  })
})
