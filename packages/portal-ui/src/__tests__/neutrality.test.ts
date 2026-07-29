import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'

/**
 * Szótár-őr a `@spaceos/portal-ui` semlegességéhez (PORTALUI-PUBLISH).
 *
 * A csomag kifelé publikálódik (Doorstar), tehát nem hordozhat iparági vagy
 * márka-specifikus szókincset. Eddig ezt **figyelem** tartotta fenn, nem kapu —
 * és a mai nap épp arról szólt, hogy a figyelem kevés: a `Wordmark`/`GrainMark`
 * (szóvédjegy + faerezet-motívum) végig a „semleges" primitív-készletben ült.
 *
 * A backend szótár-őrének portál-oldali párja. Szándékosan a legegyszerűbb
 * alakban: tiltott szólista a forrás felett.
 */

/**
 * A csomag forrásának megkeresése — cwd-FÜGGETLENÜL.
 *
 * Az `import.meta.url` a vitest transform alatt nem `file://` séma, a puszta
 * `process.cwd()` pedig törékeny: a suite futhat a portál gyökeréből ÉS a
 * repo gyökeréből is (`vitest --root src/joinerytech-portal`). Az első
 * változatom csak az elsőt kezelte, és a másodikban **collection-hibával
 * elhasalt** — vagyis az őr pont akkor nem futott, amikor a teljes suite ment.
 *
 * Ezért jelöltekkel dolgozunk, és ha egyik sem létezik, **hangosan** dobunk:
 * egy néma „nem találtam forrást" ugyanaz az üresen zöld kapu lenne.
 */
function locatePackageSrc(): string {
  const candidates = [
    resolve(process.cwd(), 'packages/portal-ui/src'),
    resolve(process.cwd(), 'src/joinerytech-portal/packages/portal-ui/src'),
    resolve(process.cwd(), '../portal-ui/src'),
  ]
  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error(
      `A portal-ui forrása nem található (cwd=${process.cwd()}). Próbált utak:\n` +
        candidates.map((c) => `  - ${c}`).join('\n'),
    )
  }
  return found
}

const PACKAGE_SRC = locatePackageSrc()

/**
 * Iparági/márka-szavak. Mindegyik mellé odaírtam, MIÉRT tilos — ha valaki
 * bővíti a listát, ugyanezt kérjük tőle, különben a lista babona lesz.
 */
const FORBIDDEN: readonly { word: string; why: string }[] = [
  { word: 'joinery', why: 'a JoineryTech márkanév' },
  { word: 'doorstar', why: 'ügyfél-/testvérprojekt neve' },
  { word: 'asztalos', why: 'iparági szerep (faipar)' },
  { word: 'faipar', why: 'iparág' },
  { word: 'szabász', why: 'iparági művelet (cutting)' },
  { word: 'élzár', why: 'iparági művelet (edge banding)' },
  { word: 'korpusz', why: 'bútoripari alkatrész' },
  { word: 'furnér', why: 'faipari anyag' },
  { word: 'bútor', why: 'iparág' },
  { word: 'timber', why: 'faipari anyag' },
  { word: 'veneer', why: 'faipari anyag' },
  { word: 'woodwork', why: 'iparág' },
]

/**
 * Kommentek eltávolítása a vizsgálat elől.
 *
 * A provenancia-kommentek (pl. „a doorstar-instance mintája alapján") LEGITIMEK:
 * nem szivárogtatnak szókincset a publikált felületre — a komponensnevek és a
 * megjelenő szövegek igen. A `//` csak akkor kezdődik kommentnek, ha nem `:`
 * előzi meg, különben az `https://` URL-eket is levágnánk.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

function collectSourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'dist') continue
      collectSourceFiles(full, found)
      continue
    }
    if (/\.tsx?$/.test(entry)) found.push(full)
  }
  return found
}

describe('portal-ui semlegesség (szótár-őr)', () => {
  const files = collectSourceFiles(PACKAGE_SRC)

  it('egyáltalán talál forrásfájlokat (különben az őr üresen zöld lenne)', () => {
    // Enélkül egy elrontott útvonal „minden rendben"-t jelentene — pontosan az
    // az üresen zöld kapu, amiből ma többet is találtunk.
    expect(files.length).toBeGreaterThan(20)
  })

  it('nem tartalmaz iparági vagy márka-szókincset a kommenteken kívül', () => {
    const hits: string[] = []

    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8')).toLowerCase()
      for (const { word, why } of FORBIDDEN) {
        if (code.includes(word)) {
          hits.push(`${file.replace(PACKAGE_SRC, '')}: „${word}" — ${why}`)
        }
      }
    }

    expect(hits).toEqual([])
  })
})
