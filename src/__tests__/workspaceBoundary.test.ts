/**
 * Workspace boundary — SZERKEZETI őr (MODULE_PACKAGES_PLAN §4.5/2).
 *
 * Miért kell az eslint-szabály MELLÉ ez is: a `no-restricted-imports`
 * szövegmintákkal dolgozik, ezért két dolgot elvileg sem lát —
 * 2026-07-31-i önteszttel MÉRVE (12 esetből 10 fogott, 2 átment):
 *
 *  1. **dinamikus `import()`** — a szabály csak statikus importot vizsgál,
 *     miközben a portál route-jai pont lazy `import()`-tal töltődnek;
 *  2. **a `../` lánc hossza** — a konfig fixen 4 és 5 szintet nevez meg, így
 *     egy csomag-gyökérből induló 3 szintű `../../../src/...` átcsúszik.
 *
 * Ez a teszt a tényleges FELOLDOTT útból dolgozik, nem szövegmintából: emiatt
 * mindkét vak pontot fedi, és hamis riasztása sincs (a csomagon BELÜLI
 * `../../src/...` legális, egy szövegminta viszont ráugrana).
 *
 * A mérés napján a fán 0 sértés volt — a teszt tehát nem adósságot rögzít,
 * hanem a visszacsúszást fogja meg.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PUBLIC_SUBPATHS = new Set(['mocks', 'wizard'])

/** Statikus (`from '…'`, `import '…'`, `export … from '…'`) ÉS dinamikus import. */
const IMPORT_RE = /(?:\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)['"]([^'"]+)['"]/g

/** A vizsgált fájl melyik rétegben él. */
function layerOf(file: string): { kind: 'app' | 'package' | 'other'; pkg?: string } {
  const pkg = /^packages\/([^/]+)\//.exec(file)
  if (pkg) return { kind: 'package', pkg: pkg[1] }
  if (file.startsWith('src/')) return { kind: 'app' }
  return { kind: 'other' }
}

/**
 * Egyetlen import megítélése. Visszatérés: a szabálysértés leírása, vagy null.
 * Tiszta függvény — így a detektor maga is tesztelhető (pozitív kontroll lent).
 */
export function boundaryViolation(file: string, spec: string): string | null {
  const layer = layerOf(file)
  if (layer.kind === 'other') return null

  // 1. Csomag-alias: csak a publikus belépési pontok engedettek.
  const alias = /^@(?:spaceos|joinerytech)\/([^/]+)(?:\/(.*))?$/.exec(spec)
  if (alias) {
    const sub = alias[2]
    if (!sub || PUBLIC_SUBPATHS.has(sub)) return null
    return `csomag-belsőbe importál: '${spec}' (publikus belépési pont: gyökér, /mocks, /wizard)`
  }
  if (!spec.startsWith('.')) return null

  // 2. Relatív import — a FELOLDOTT út dönt, nem a minta.
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec))

  if (layer.kind === 'app' && resolved.startsWith('packages/')) {
    return `relatív benyúlás a packages/ alá: '${spec}' → ${resolved}`
  }
  if (layer.kind === 'package') {
    if (resolved.startsWith('src/')) {
      return `csomag importál az app src/-éből (fordított rétegzés): '${spec}' → ${resolved}`
    }
    const other = /^packages\/([^/]+)\//.exec(resolved)
    if (other && other[1] !== layer.pkg) {
      return `másik csomag belsejébe importál: '${spec}' → ${resolved}`
    }
  }
  return null
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(path.join(ROOT, dir))) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const rel = `${dir}/${entry}`
    if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel, out)
    else if (/\.tsx?$/.test(entry)) out.push(rel)
  }
  return out
}

describe('workspace boundary — szerkezeti őr', () => {
  const files = [...walk('src'), ...walk('packages')]

  it('a bejáró valóban lát fájlokat (különben a 0 sértés semmit nem bizonyítana)', () => {
    // A „0 találat" csak akkor bizonyíték, ha a mérőeszköz nem üresre néz.
    expect(files.length).toBeGreaterThan(300)
    expect(files.some((f) => f.startsWith('packages/'))).toBe(true)
  })

  it('egyetlen fájl sem sérti a csomag-határokat (statikus ÉS dinamikus importon)', () => {
    const violations: string[] = []
    for (const file of files) {
      const src = readFileSync(path.join(ROOT, file), 'utf8')
      for (const m of src.matchAll(IMPORT_RE)) {
        const problem = boundaryViolation(file, m[1])
        if (problem) violations.push(`${file}: ${problem}`)
      }
    }
    expect(violations).toEqual([])
  })

  // ── A detektor pozitív kontrollja ────────────────────────────────────────
  // Egy 0-t jelentő ellenőrző lehet vak is. Az alábbi esetek pont azok, amiket
  // az eslint-szabály ÁTENGED — ha a detektor rájuk sem harap, a teszt zöldje
  // hamis biztonság lenne.

  it('elkapja a dinamikus importot csomag-belsőre (eslint vak pontja)', () => {
    expect(boundaryViolation('src/App.tsx', '@spaceos/module-crm/src/services/leads'))
      .toMatch(/csomag-belsőbe/)
  })

  it('elkapja a 3 szintű ../ visszanyúlást is (eslint vak pontja)', () => {
    expect(boundaryViolation('packages/module-crm/src/index.ts', '../../../src/hooks/useApi'))
      .toMatch(/fordított rétegzés/)
    expect(boundaryViolation('packages/module-crm/src/pages/X.tsx', '../../../../src/hooks/useApi'))
      .toMatch(/fordított rétegzés/)
  })

  it('elkapja a másik csomag belsejébe nyúlást és az app relatív benyúlását', () => {
    expect(boundaryViolation('packages/module-crm/src/a.ts', '../../module-ehs/src/b'))
      .toMatch(/másik csomag/)
    expect(boundaryViolation('src/pages/X.tsx', '../../packages/module-crm/src/b'))
      .toMatch(/relatív benyúlás/)
  })

  it('NEM riaszt a legális importokra (zaj-kontroll)', () => {
    expect(boundaryViolation('src/App.tsx', '@spaceos/portal-ui')).toBeNull()
    expect(boundaryViolation('src/App.tsx', '@spaceos/module-crm/mocks')).toBeNull()
    expect(boundaryViolation('src/App.tsx', '@spaceos/module-ehs/wizard')).toBeNull()
    expect(boundaryViolation('src/pages/X.tsx', '../hooks/useApi')).toBeNull()
    expect(boundaryViolation('src/App.tsx', 'react')).toBeNull()
    // Csomagon BELÜLI visszalépés: legális — egy szövegminta erre ráugrana.
    expect(boundaryViolation('packages/module-crm/src/pages/X.tsx', '../../src/services/leads')).toBeNull()
    expect(boundaryViolation('packages/module-crm/src/pages/X.tsx', '../services/leads')).toBeNull()
  })
})
