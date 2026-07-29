/**
 * keyboard-smoke — browser-szintű a11y regressziós őr (WORLDS-SHELL-FIX).
 *
 * A jsdom-ban NEM fogható hibaosztályokat fedi (nincs layout-motor):
 *  S-1: SlideOver fókuszcsapda desktopon — a display:none mobil „Vissza" gomb
 *       nem lehet fókusz-cél; minden dialógus-vezérlő elérhető Tab-bal,
 *       Escape után a fókusz a triggerre tér vissza (mobilon is).
 *  M-S1: 768px-en nincs dokumentum-szintű vízszintes túlcsordulás.
 *  M-S2: nyitott SlideOver mellett a toast live-region NEM inert.
 *  M-7/M-8/M-10 (WORLDS-PRODUCTION-FIX): quotes h-scroll a tooltipektől,
 *       mobil oszlop-összenyomás, dash-linkek 44px érintési zónája —
 *       mindhárom CSAK valós layouttal mérhető.
 *
 * Futtatás: `npm run test:smoke:keyboard` — a script maga indít vite dev
 * szervert (MSW mock mód) és le is állítja. Konfiguráció env-ből:
 *  SMOKE_PORT (default 5211), CHROME_PATH (default: rendszer-Chrome/Edge).
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

/**
 * A rejtett legacy világok listája a FORRÁSBÓL jön, nem kézi felsorolásból.
 *
 * Miért: a `ROUTES` kézi karbantartása már okozott vak foltot (az új
 * `/w/production/scheduling` route-ot a kapu magától nem kapta meg). Ha valaki
 * bővíti a `HIDDEN_LEGACY_WORLDS`-öt, a kapu ezzel automatikusan követi — és ha
 * a fájl alakja megváltozik, HANGOSAN elhasal, nem csendben lefedetlenül hagy.
 */
function readHiddenLegacyWorlds() {
  const source = readFileSync(new URL('../src/config/worldAccess.ts', import.meta.url), 'utf8')
  const match = /HIDDEN_LEGACY_WORLDS[^=]*=\s*\[([\s\S]*?)\]/.exec(source)
  if (!match) {
    throw new Error('A HIDDEN_LEGACY_WORLDS nem olvasható ki a worldAccess.ts-ből — a kapu vak lenne.')
  }
  const worlds = match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter((entry) => entry && !entry.startsWith('//'))
  if (worlds.length === 0) throw new Error('Üres HIDDEN_LEGACY_WORLDS — gyanús, nem fogadom el.')
  return worlds
}

const HIDDEN_LEGACY_WORLDS = readHiddenLegacyWorlds()

const PORT = Number(process.env.SMOKE_PORT ?? 5211)
const BASE = `http://localhost:${PORT}`
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const failures = []
function check(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* még indul */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`A dev szerver nem állt fel ${timeoutMs} ms alatt: ${url}`)
}

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('Nincs Chrome/Edge — állítsd be a CHROME_PATH env-változót.')
  process.exit(2)
}

console.log(`vite dev indítása a ${PORT} porton…`)
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  shell: true,
  stdio: 'ignore',
  detached: false,
})
const killServer = () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true, stdio: 'ignore' })
  } else {
    server.kill('SIGTERM')
  }
}

let browser
try {
  await waitForServer(BASE)
  browser = await chromium.launch({ executablePath, headless: true })

  // ── S-1: desktop fókuszcsapda ─────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production/cutting`, { waitUntil: 'networkidle' })
    const row = page.getByRole('button', { name: /CPL-/ }).first()
    await row.waitFor({ timeout: 15_000 })
    await row.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor({ timeout: 5_000 })

    const focusInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return Boolean(dialog && dialog.contains(document.activeElement) && document.activeElement !== document.body)
    })
    check('S-1 desktop: megnyitáskor a fókusz a dialóguson belül van', focusInDialog)

    // Tab-séta: max 25 lépésben el kell érni a Bezárás gombot, és minden stop a dialógusban marad.
    let reachedClose = false
    let escaped = false
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      const state = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        const el = document.activeElement
        return {
          inDialog: Boolean(dialog && el && dialog.contains(el)),
          isBody: el === document.body,
          label: el?.getAttribute('aria-label') ?? '',
        }
      })
      if (state.isBody || !state.inDialog) {
        escaped = true
        break
      }
      if (state.label === 'Bezárás') reachedClose = true
    }
    check('S-1 desktop: a Tab a dialógusban marad (nincs body-holtpont)', !escaped)
    check('S-1 desktop: a Bezárás gomb Tab-bal elérhető', reachedClose)

    // M-S2: a toast live-region nyitott dialógus mellett sem inert.
    const toastState = await page.evaluate(() => {
      const toastRoot = document.querySelector('[data-inert-exempt]')
      return {
        exists: Boolean(toastRoot),
        inert: Boolean(toastRoot && (toastRoot.hasAttribute('inert') || toastRoot.closest('[inert]'))),
      }
    })
    check('M-S2: toast-konténer jelen van', toastState.exists)
    check('M-S2: toast-konténer NEM inert nyitott SlideOver mellett', !toastState.inert)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const focusBackOnTrigger = await page.evaluate(() => {
      const el = document.activeElement
      return Boolean(el && el !== document.body && /CPL-/.test(el.textContent ?? ''))
    })
    check('S-1 desktop: Escape után a fókusz a trigger-soron', focusBackOnTrigger)
    await ctx.close()
  }

  // ── S-1 kontroll: mobil fókusz-ciklus változatlanul ép ────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production/cutting`, { waitUntil: 'networkidle' })
    const row = page.getByRole('button', { name: /CPL-/ }).first()
    await row.waitFor({ timeout: 15_000 })
    await row.click()
    await page.getByRole('dialog').waitFor({ timeout: 5_000 })
    const focusInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return Boolean(dialog && dialog.contains(document.activeElement))
    })
    check('S-1 mobil: megnyitáskor a fókusz a dialógusban (Vissza gomb él)', focusInDialog)
    await page.keyboard.press('Escape')
    await ctx.close()
  }

  // ── M-S1: 768px — nincs dokumentum-szintű h-scroll ────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } })
    const page = await ctx.newPage()
    for (const path of ['/w/production', '/w/maintenance', '/w/production/quotes']) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      check(`M-S1: ${path} 768px overflow = 0px`, overflow === 0, `mért: ${overflow}px`)
    }
    await ctx.close()
  }

  // ── M-8: quotes — a disabled-gomb tooltipek nem okoznak h-scrollt ─────────
  // (Ez a hibaosztály jsdom-ban nem mérhető: a tooltip `absolute
  // whitespace-nowrap`, a túllógás csak valós layouttal derül ki.)
  {
    for (const width of [1440, 360]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(`${BASE}/w/production/quotes`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      check(`M-8: quotes ${width}px overflow = 0px`, overflow === 0, `mért: ${overflow}px`)

      // A h-scroll megszüntetése NEM mehet a magyarázat néma levágása árán:
      // minden tooltip-doboznak a viewporton BELÜL kell lennie (balra kilógás
      // nem okoz görgetést, de olvashatatlanná vágná a szöveget).
      const tooltips = await page.evaluate(() => {
        const w = window.innerWidth
        return [...document.querySelectorAll('[role="tooltip"]')].map((el) => {
          const r = el.getBoundingClientRect()
          return { left: Math.round(r.left), right: Math.round(r.right), inside: r.left >= 0 && r.right <= w }
        })
      })
      const outside = tooltips.filter((t) => !t.inside)
      check(
        `M-8: quotes ${width}px — mind a ${tooltips.length} tooltip a viewporton belül`,
        tooltips.length > 0 && outside.length === 0,
        outside.length > 0 ? `kilógó: ${JSON.stringify(outside[0])}` : `${tooltips.length} db`,
      )
      await ctx.close()
    }
  }

  // ── M-7: quotes 360px — az ügyfél/meta oszlop nem préselődik össze ────────
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production/quotes`, { waitUntil: 'networkidle' })
    await page.getByText('Kiss Ágnes').first().waitFor({ timeout: 15_000 })
    const metaWidth = await page.evaluate(() => {
      const name = [...document.querySelectorAll('li div')].find((el) => el.textContent === 'Kiss Ágnes')
      return name?.parentElement ? Math.round(name.parentElement.getBoundingClientRect().width) : -1
    })
    // A review-ben ~40px volt (olvashatatlan). Két soros kártyán a teljes
    // sorszélességet kapja: 360px viewporton ez 250px felett van.
    check('M-7: quotes 360px — ügyfél/meta oszlop ≥ 250px', metaWidth >= 250, `mért: ${metaWidth}px`)
    await ctx.close()
  }

  // ── WORLDS-SHELL-H1: minden route-on pontosan egy, a navval egyező h1 van.
  //    A shell-cím mobilon sr-only (nem display:none), ezért a legacy világok
  //    is címhez jutnak anélkül, hogy a modern képernyők h2-jét duplikálnánk.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    // ELÉRHETŐ világ-route-ok: ezeken tényleg a világ-shell renderel, tehát
    // számonkérhető a h1 + nav + aria-current hármas.
    const ROUTES = [
      '/w/production', '/w/production/cutting', '/w/production/machining',
      '/w/production/scheduling',
      '/w/production/orders', '/w/production/quotes', '/w/production/workflow',
      '/w/production/analytics',
      '/w/crm', '/w/kontrolling', '/w/hr', '/w/maintenance', '/w/quality',
      '/w/ehs', '/w/docs',
      // Modul-alképernyők — a review mutációs próbája bizonyította, hogy a
      // csak-dash lefedés lyukas (LeadsScreen h1-mutáció minden őrön átment):
      '/w/crm/leads', '/w/hr/people', '/w/kontrolling/portfolio',
      '/w/maintenance/assets', '/w/quality/tickets', '/w/ehs/incidents',
      '/w/docs/library',
      // Megvásárolható kompozit + alap-világ: nem rejtett legacy.
      '/w/warehouse', '/w/settings',
    ]

    // GATELT legacy világok: a `RequireAuth` a tiltó oldalt adja rájuk, tehát
    // NINCS naviguk — korábban ezért bukott a kapu 15 route-on, holott a gating
    // helyesen működött. Itt ezt fordítva kérjük számon: a tiltás a bizonyítandó.
    const GATED_ROUTES = HIDDEN_LEGACY_WORLDS.map((world) => `/w/${world}`)

    const wrongH1Count = []
    const mismatches = []
    const noActiveNav = []
    for (const path of ROUTES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
      const info = await page.evaluate(() => {
        const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent?.trim() ?? '')
        const active = document.querySelector('[aria-current="page"]')
        return { h1s, active: active?.textContent?.trim() ?? null }
      })
      if (info.h1s.length !== 1) wrongH1Count.push({ path, h1s: info.h1s })
      if (!info.active) noActiveNav.push(path)
      else if (info.h1s.length > 0 && !info.h1s.includes(info.active)) {
        mismatches.push({ path, nav: info.active, h1s: info.h1s })
      }
    }
    check(
      `SHELL-H1: minden világ-route-nak pontosan egy h1-e van (${ROUTES.length} route)`,
      wrongH1Count.length === 0,
      wrongH1Count.length ? JSON.stringify(wrongH1Count.slice(0, 3)) : 'mind pontosan egyet kapott',
    )
    check(
      'SHELL-H1: a nav aktív eleme (aria-current) minden route-on jelen van',
      noActiveNav.length === 0,
      noActiveNav.length ? noActiveNav.join(', ') : 'mind jelöli',
    )
    check(
      'SHELL-H1: a nav aktív címkéje megjelenik az oldal címei között',
      mismatches.length === 0,
      mismatches.length ? JSON.stringify(mismatches.slice(0, 3)) : 'nincs eltérés',
    )

    // A gatelt világokon a TILTÁS a bizonyítandó. Korábban ezek a route-ok a
    // `ROUTES`-ban ültek, és „hiányzó aria-current"-ként buktak — miközben a
    // hiányzó nav épp a helyes viselkedés volt. Ráadásul a h1-ellenőrzésük
    // üresen zöld volt: a tiltó oldal címét számolta, nem egy világ-shellét.
    const gatingLeaks = []
    for (const path of GATED_ROUTES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
      const info = await page.evaluate(() => ({
        blocked:
          !!document.querySelector('[role="alert"]') &&
          (document.querySelector('h1')?.textContent ?? '').includes('nincs engedélyezve'),
        navItems: document.querySelectorAll('nav a, nav button').length,
        h1Count: document.querySelectorAll('h1').length,
      }))
      // Szivárgás = bármi, ami nem a tiltó oldal: világ-nav, több cím, vagy
      // egyszerűen renderelő képernyő.
      if (!info.blocked || info.navItems > 0 || info.h1Count !== 1) {
        gatingLeaks.push({ path, ...info })
      }
    }
    check(
      `GATING: a rejtett legacy világok a tiltó oldalt adják, nav nélkül (${GATED_ROUTES.length} route)`,
      gatingLeaks.length === 0,
      gatingLeaks.length ? JSON.stringify(gatingLeaks.slice(0, 3)) : 'mind fail-closed',
    )
    await ctx.close()
  }

  // A mobil h1 vizuálisan lehet rejtett, de az accessibility tree-ből nem tűnhet el.
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production/cutting`, { waitUntil: 'networkidle' })
    const mobileTitle = await page.evaluate(() => {
      const h1s = document.querySelectorAll('h1')
      const h1 = h1s[0]
      return {
        count: h1s.length,
        text: h1?.textContent?.trim(),
        display: h1 ? getComputedStyle(h1).display : null,
      }
    })
    check(
      'SHELL-H1 mobil: pontosan egy elérhető Szabászat főcím',
      mobileTitle.count === 1 && mobileTitle.text === 'Szabászat' && mobileTitle.display !== 'none',
      JSON.stringify(mobileTitle),
    )
    await ctx.close()
  }

  // ── TOUCH-44: a shell fejléc-gombjai érintéssel 44px-esek ─────────────────
  // A 44px-es szabály a BEVITELI ESZKÖZRŐL szól, nem a képernyő szélességéről,
  // ezért `pointer: coarse` alatt nőnek a célpontok, egérrel marad a mai arány.
  //
  // ⚠ Ezt a kaput coarse pointerrel KELL futtatni: a többi ellenőrzés finom
  // mutatóval megy, tehát a javítást nem is látná. És a coarse NEM egyenlő a
  // kis képernyővel — egy érintőképernyős laptop 1440px-en is coarse, ezért
  // ott is mérünk.
  {
    const HEADER_BUTTONS = ['Értesítések', 'Téma']
    const sizes = (labels) => {
      const out = {}
      for (const label of labels) {
        const el = [...document.querySelectorAll('button')].find(
          (b) => (b.getAttribute('aria-label') ?? '').includes(label))
        const r = el?.getBoundingClientRect()
        out[label] = r ? { w: Math.round(r.width), h: Math.round(r.height) } : null
      }
      out.coarse = window.matchMedia('(pointer: coarse)').matches
      return out
    }

    // Érintőképernyős laptop: coarse pointer ASZTALI szélességen.
    const touchCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true })
    const touchPage = await touchCtx.newPage()
    await touchPage.goto(`${BASE}/w/production`, { waitUntil: 'networkidle' })
    await touchPage.waitForTimeout(400)
    const touch = await touchPage.evaluate(sizes, HEADER_BUTTONS)
    await touchCtx.close()

    check('TOUCH-44: a böngésző coarse pointert jelent (különben a kapu vak)', touch.coarse === true)
    check(
      'TOUCH-44: érintéssel a fejléc-gombok ≥44px — érintőképernyős laptopon is',
      HEADER_BUTTONS.every((l) => touch[l] && touch[l].w >= 44 && touch[l].h >= 44),
      HEADER_BUTTONS.map((l) => `${l} ${touch[l]?.w}x${touch[l]?.h}`).join(' · '),
    )

    // Egér: a vizuális terv NEM változhat — ez őrzi meg a tervezői arányt egy
    // jövőbeli „globális 44px" javítástól.
    const mouseCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const mousePage = await mouseCtx.newPage()
    await mousePage.goto(`${BASE}/w/production`, { waitUntil: 'networkidle' })
    await mousePage.waitForTimeout(400)
    const mouse = await mousePage.evaluate(sizes, HEADER_BUTTONS)
    await mouseCtx.close()

    check(
      'TOUCH-44: egérrel a fejléc-gombok maradnak 32px (a terv nem borul)',
      HEADER_BUTTONS.every((l) => mouse[l] && mouse[l].w === 32 && mouse[l].h === 32),
      HEADER_BUTTONS.map((l) => `${l} ${mouse[l]?.w}x${mouse[l]?.h}`).join(' · '),
    )
  }

  // ── M-10: dashboard szekció-linkek 44px-es érintési zónája ────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production`, { waitUntil: 'networkidle' })
    const link = page.getByRole('button', { name: 'Szabászat →', exact: true })
    await link.waitFor({ timeout: 15_000 })
    const hit = await page.evaluate(() => {
      // A dash-szekció-linkek jellemzője a nyíl-utótag — a sidebar azonos
      // szövegű nav-gombja NEM ilyen (a nav-címke és az oldalcím egyezik).
      const el = [...document.querySelectorAll('button')].find((b) => /Szabászat\s*→\s*$/.test(b.textContent ?? ''))
      if (!el) return { ok: false, reason: 'nincs link' }
      const r = el.getBoundingClientRect()
      // A ::before kiterjesztett zóna a szöveg-doboz FELETT 12px-re is találjon.
      const above = document.elementFromPoint(r.left + r.width / 2, r.top - 10)
      const below = document.elementFromPoint(r.left + r.width / 2, r.bottom + 10)
      return {
        ok: (above === el || el.contains(above)) && (below === el || el.contains(below)),
        textHeight: Math.round(r.height),
      }
    })
    check(
      'M-10: dash-link érintési zónája a szövegdobozon túl is aktív (≈44px)',
      hit.ok,
      `szöveg-magasság: ${hit.textHeight}px`,
    )
    await ctx.close()
  }

  // ── F4: a kiosztás-megerősítés valódi dialógus (PLAN-05 F4) ───────────────
  // A korábbi kézzel írt overlay-nek nem volt fókuszcsapdája és az Escape sem
  // zárta — pont az a két dolog, amit jsdom-ban elvileg sem lehet bizonyítani.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production/scheduling`, { waitUntil: 'networkidle' })

    // Operátor kiválasztása a valódi úton, majd köteg ejtése a gépre.
    await page.locator('input[placeholder="Operátor keresése…"]').click()
    await page.locator('button:has-text("Kovács Péter")').first().click()

    const dropZone = page.locator('h3:text("Holzma HPP380")').locator('..')
    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer()
      dt.setData('application/json', JSON.stringify({ batchId: 'batch-1' }))
      return dt
    })
    await dropZone.dispatchEvent('drop', { dataTransfer })

    const dialog = page.locator('[role="alertdialog"]')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    const opened = await page.evaluate(() => {
      const d = document.querySelector('[role="alertdialog"]')
      return {
        modal: d?.getAttribute('aria-modal'),
        detailCount: d?.querySelectorAll('dl dt').length ?? 0,
        focusInside: !!d && d.contains(document.activeElement),
        focusLabel: document.activeElement?.textContent?.trim() ?? '(nincs)',
      }
    })
    check('F4: a megerősítés valódi alertdialog, strukturált összefoglalóval',
      opened.modal === 'true' && opened.detailCount === 4,
      `aria-modal=${opened.modal}, dt=${opened.detailCount}`)
    check('F4: a fókusz a dialóguson BELÜL, a Mégsén landol',
      opened.focusInside && opened.focusLabel === 'Mégse', opened.focusLabel)

    // Fókuszcsapda: körbe-Tabbolva sem eshetünk ki a body-ra.
    let escaped = false
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() =>
        !!document.querySelector('[role="alertdialog"]')?.contains(document.activeElement))
      if (!inside) { escaped = true; break }
    }
    check('F4: a Tab a dialógusban marad (nincs body-holtpont)', !escaped)

    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
    const afterEscape = await page.evaluate(() => ({
      dialogGone: !document.querySelector('[role="alertdialog"]'),
      // Escape = mégse: a köteg NEM oszthatott ki, tehát ott marad a listában.
      batchStillListed: !!Array.from(document.querySelectorAll('h4'))
        .find((el) => el.textContent?.includes('Konyhai frontok')),
    }))
    check('F4: az Escape zárja a dialógust', afterEscape.dialogGone)
    check('F4: Escape után NEM történt kiosztás (a köteg a listában maradt)',
      afterEscape.batchStillListed)

    await ctx.close()
  }
} catch (err) {
  console.error('Smoke-futás hiba:', err)
  failures.push('runtime-error')
} finally {
  if (browser) await browser.close()
  killServer()
}

if (failures.length > 0) {
  console.error(`\n${failures.length} ellenőrzés BUKOTT: ${failures.join(', ')}`)
  process.exit(1)
}
console.log('\nMinden keyboard/a11y smoke-ellenőrzés zöld.')
