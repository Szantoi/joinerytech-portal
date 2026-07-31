/**
 * index.html őr-teszt (F1-A11Y-RESIDUALS).
 *
 * A `lang="en"` 2026-07-14 óta állt magyar UI mellett (F1-REVIEW N2) — a
 * képernyőolvasó angol kiejtéssel olvasta a magyar szöveget. Az attribútum
 * jsdom-tesztből nem látszik (a vitest nem az index.html-t tölti be), ezért
 * a FÁJLT olvassuk: így a visszacsúszás piros tesztet kap.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// A vitest gyökere a portál (vite.config.ts) — az import.meta.url a jsdom
// transzformban nem file-séma, ezért cwd-ről oldunk fel.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

describe('index.html', () => {
  it('a dokumentum nyelve magyar (lang="hu")', () => {
    expect(html).toMatch(/<html lang="hu">/)
    expect(html).not.toMatch(/<html lang="en">/)
  })
})
