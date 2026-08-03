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

/**
 * A publikus belépési pontok **csomagonként**, a `package.json` `exports`-ából.
 *
 * Korábban ez egy beégetett `{mocks, wizard}` halmaz volt — az uniója helyes, de
 * per-csomag VAK: 2026-08-03-án mérve a `./wizard`-ot 12 csomagból egyedül a
 * `module-ehs` exportálja, a `portal-core`/`portal-ui` pedig CSAK `.`-ot. Az őr
 * tehát átengedte volna a `@spaceos/portal-ui/mocks`-ot és a
 * `@spaceos/module-crm/wizard`-ot is. Emellett a beégetett lista egy MÁSODIK
 * IGAZSÁG a manifest mellett: egy új publikus alút felvétele után hamis riasztást
 * adott volna. Ezért a manifest az egyetlen forrás.
 */
function readPublicEntrypoints(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const dir of readdirSync(path.join(ROOT, 'packages'))) {
    let manifest: { name?: string; exports?: Record<string, unknown> }
    try {
      manifest = JSON.parse(readFileSync(path.join(ROOT, 'packages', dir, 'package.json'), 'utf8'))
    } catch {
      continue // nem csomag-mappa (vagy olvashatatlan) — a lenti fedettségi teszt kifogja
    }
    if (!manifest.name) continue
    const subpaths = new Set<string>()
    // A `.` (gyökér) mindig publikus; minket az alutak érdekelnek.
    for (const key of Object.keys(manifest.exports ?? { '.': {} })) {
      if (key.startsWith('./')) subpaths.add(key.slice(2))
    }
    map.set(manifest.name, subpaths)
  }
  return map
}

const PUBLIC_ENTRYPOINTS = readPublicEntrypoints()

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

  // 1. Csomag-alias: csak az ADOTT csomag publikus belépési pontjai engedettek.
  const alias = /^(@(?:spaceos|joinerytech)\/[^/]+)(?:\/(.*))?$/.exec(spec)
  if (alias) {
    const [, name, sub] = alias
    const publicSubpaths = PUBLIC_ENTRYPOINTS.get(name)
    // Nem workspace-csomag → külső függőség, nem a mi határunk (ilyen ma nincs;
    // ezt a lenti fedettségi teszt méri, nehogy egy átnevezés némán elnémítsa az őrt).
    if (!publicSubpaths) return null
    if (!sub || publicSubpaths.has(sub) || publicSubpaths.has('*')) return null
    const entrypoints = ['gyökér', ...[...publicSubpaths].sort().map((s) => `/${s}`)].join(', ')
    return `csomag-belsőbe importál: '${spec}' (a ${name} publikus belépési pontjai: ${entrypoints})`
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

  // ── A publikus belépési pontok forrása ───────────────────────────────────
  // Ha a manifest-olvasás üres térképet adna (átnevezett mappa, elrontott JSON),
  // az őr MINDEN csomag-aliast némán átengedne. A zöld tehát csak akkor jelent
  // valamit, ha előbb bizonyítjuk, hogy a térkép betöltött.

  it('a publikus belépési pontok a manifestekből töltődtek (különben az őr néma)', () => {
    const onDisk = readdirSync(path.join(ROOT, 'packages')).filter((d) =>
      statSync(path.join(ROOT, 'packages', d)).isDirectory(),
    )
    expect(PUBLIC_ENTRYPOINTS.size).toBe(onDisk.length)
    // A mai fa mért alakja: a /wizard EGYETLEN csomagé — pont ezt nem látta a
    // korábbi, beégetett halmaz.
    expect([...PUBLIC_ENTRYPOINTS].filter(([, s]) => s.has('wizard')).map(([n]) => n)).toEqual([
      '@spaceos/module-ehs',
    ])
  })

  it('elkapja az alutat olyan csomagon, amelyik NEM exportálja (a beégetett halmaz vak pontja)', () => {
    // A portal-ui csak `.`-ot exportál — de a régi {mocks, wizard} halmaz átengedte.
    expect(boundaryViolation('src/App.tsx', '@spaceos/portal-ui/mocks')).toMatch(/csomag-belsőbe/)
    // A /wizard csak a module-ehs-é; a többi csomagon határsértés.
    expect(boundaryViolation('src/App.tsx', '@spaceos/module-crm/wizard')).toMatch(/csomag-belsőbe/)
    // A hibaüzenet az ADOTT csomag valódi belépési pontjait sorolja fel.
    expect(boundaryViolation('src/App.tsx', '@spaceos/portal-ui/mocks')).toContain(
      '@spaceos/portal-ui publikus belépési pontjai: gyökér',
    )
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
