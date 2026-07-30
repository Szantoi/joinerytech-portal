/**
 * A Cmd+D gyorsbillentyűs duplikálás — és amit a lint-hiba takart.
 *
 * A `handleDuplicate` a billentyű-`useEffect` UTÁN van deklarálva, az effekt
 * pedig csak a `selectedRowId`-ra iratkozik fel újra. Így az élő listener annak
 * a rendernek a `handleDuplicate`-jét tartja, amelyikben a kijelölés történt —
 * az pedig a `useProductMutations` `useCallback`-jén át az AKKORI `products`
 * tömbre zár. A kijelölés óta történt bármely változás (törlés, szerkesztés)
 * elvész, mert a Cmd+D egy elavult listát ír vissza (`setProducts` +
 * localStorage).
 *
 * Az első eset ezt a veszteséget méri **törlésen keresztül** (nem a soron
 * belüli szerkesztésen — az külön okból nem működik, ld. EditableCell.test).
 * A második-harmadik pozitív/negatív kontroll: enélkül az első elvileg is zöld
 * lenne.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider } from '@spaceos/portal-ui'
import { CatalogPanel } from '../CatalogPanel'

const STORAGE_KEY = 'spaceos_catalog_products'

function renderPanel() {
  const user = userEvent.setup()
  render(
    <ConfirmProvider>
      <CatalogPanel />
    </ConfirmProvider>,
  )
  return { user }
}

/** A megnevezés szerint megkeresi a termék sorát (a rács-burkoló divet). */
function rowOf(name: string): HTMLElement {
  const cell = screen.getAllByText(name)[0]
  const row = cell.closest('div[class*="grid"]')
  if (!row) throw new Error(`Nem találom a(z) "${name}" sorát`)
  return row as HTMLElement
}

/** Törli a terméket az akció-menüből, megerősítéssel. */
async function deleteProduct(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(within(rowOf(name)).getByRole('button', { name: 'Row actions' }))
  await user.click(screen.getByRole('button', { name: /Delete/ }))
  await user.click(await screen.findByRole('button', { name: 'Törlés' }))
  await waitFor(() => expect(screen.queryByText(name)).toBeNull())
}

/** Dupla kattintással átírja a termék nevét, majd Enterrel ment. */
async function renameTo(
  user: ReturnType<typeof userEvent.setup>,
  from: string,
  to: string,
) {
  await user.dblClick(within(rowOf(from)).getByText(from))
  const input = await screen.findByDisplayValue(from)
  await user.clear(input)
  await user.type(input, to)
  await user.keyboard('{Enter}')
  await screen.findByText(to)
}

beforeEach(() => {
  localStorage.clear()
})

describe('CatalogPanel — Cmd+D duplikálás', () => {
  it('a kijelölés óta mentett szerkesztés NEM vész el a Cmd+D-től', async () => {
    const { user } = renderPanel()

    // 1. kijelölés — innentől a billentyű-effekt csak akkor iratkozik fel
    //    újra, ha a `handleDuplicate` identitása is a deps között van
    await user.click(rowOf('Tölgy furnér 18mm'))

    // 2. szerkesztés VÁLTOZATLAN kijelölés mellett (a products tömb cserélődik;
    //    a dupla kattintás ugyanarra a sorra esik, a selectedRowId nem mozdul)
    await renameTo(user, 'Tölgy furnér 18mm', 'Tölgy furnér 18mm PRÉMIUM')

    // 3. gyorsbillentyű ugyanazon a kijelölésen
    await user.keyboard('{Meta>}d{/Meta}')

    // a duplikátum megjelent, de a szerkesztés nem íródott vissza
    await waitFor(() => expect(screen.getByText('Catalog (6 termék)')).toBeTruthy())
    expect(screen.queryByText('Tölgy furnér 18mm')).toBeNull()

    const stored: Array<{ name: string }> = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    )
    expect(stored.map((p) => p.name)).not.toContain('Tölgy furnér 18mm')
  })

  it('a törölt termék kijelölése megszűnik — a Cmd+D nem száll el utána', async () => {
    // A kivétel egy `document`-szintű keydown-listenerben keletkezik: a
    // képernyőn NEM hagy nyomot, ezért a DOM-ra épített állítás itt üresen
    // zöld lenne. A jsdom viszont `error` eseményként kidobja a window-ra —
    // azt figyeljük.
    const uncaught: string[] = []
    const onError = (e: ErrorEvent) => uncaught.push(e.message)
    window.addEventListener('error', onError)

    try {
      const { user } = renderPanel()

      // a sor-akciók megnyitása magát a sort is kijelöli, majd töröljük
      await deleteProduct(user, 'Dió furnér 18mm')
      await user.keyboard('{Meta>}d{/Meta}')

      await waitFor(() =>
        expect(screen.getByText('Catalog (4 termék)')).toBeTruthy(),
      )
      expect(uncaught).toEqual([])
      expect(screen.queryByText('Dió furnér 18mm')).toBeNull()
    } finally {
      window.removeEventListener('error', onError)
    }
  })

  it('pozitív kontroll: a Cmd+D valóban új sort ad a kijelölt termékből', async () => {
    const { user } = renderPanel()

    await user.click(rowOf('Tölgy furnér 18mm'))
    await user.keyboard('{Meta>}d{/Meta}')

    await waitFor(() => expect(screen.getByText('Catalog (6 termék)')).toBeTruthy())
  })

  it('negatív kontroll: kijelölés nélkül a Cmd+D nem csinál semmit', async () => {
    const { user } = renderPanel()

    await user.keyboard('{Meta>}d{/Meta}')

    expect(screen.getByText('Catalog (5 termék)')).toBeTruthy()
  })
})
