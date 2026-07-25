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
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

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

  // ── WORLDS-SHELL-H1 (részleges): MINDEN világ-route-nak legyen CÍME, és a
  //    nav aktív eleme ugyanazt mondja, mint az oldalcím.
  //
  //    A „pontosan egy <h1>" cél NEM teljesíthető a shell-cím elvételével: a
  //    fresh review bizonyította, hogy 8 legacy világ 38 route-ján a tartalom
  //    nem ad saját címet. Ez az őr azt a REGRESSZIÓT fogja meg, amit az első
  //    nekifutás majdnem beszállított (cím nélküli oldalak), a duplikáció
  //    feloldása a WORLDS-SHELL-H1 következő körére marad.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const ROUTES = [
      '/w/production', '/w/production/cutting', '/w/production/machining',
      '/w/production/orders', '/w/production/quotes', '/w/production/workflow',
      '/w/production/analytics',
      '/w/crm', '/w/kontrolling', '/w/hr', '/w/maintenance', '/w/quality',
      '/w/ehs', '/w/docs',
      // Legacy világak — ezeken a shell címe az EGYETLEN cím:
      '/w/sales', '/w/design', '/w/warehouse', '/w/finance', '/w/masterdata',
      '/w/interior', '/w/service', '/w/settings',
    ]
    const titleless = []
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
      if (info.h1s.length === 0) titleless.push(path)
      if (!info.active) noActiveNav.push(path)
      else if (info.h1s.length > 0 && !info.h1s.includes(info.active)) {
        mismatches.push({ path, nav: info.active, h1s: info.h1s })
      }
    }
    check(
      `SHELL-H1: minden világ-route-nak van címe (${ROUTES.length} route)`,
      titleless.length === 0,
      titleless.length ? `cím nélkül: ${titleless.join(', ')}` : 'mind kapott címet',
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
    await ctx.close()
  }

  // ── M-10: dashboard szekció-linkek 44px-es érintési zónája ────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/w/production`, { waitUntil: 'networkidle' })
    const link = page.getByRole('button', { name: 'Vágótervezés →', exact: true })
    await link.waitFor({ timeout: 15_000 })
    const hit = await page.evaluate(() => {
      // A dash-szekció-linkek jellemzője a nyíl-utótag — a sidebar azonos
      // szövegű nav-gombja NEM ilyen (a nav-címke és az oldalcím egyezik).
      const el = [...document.querySelectorAll('button')].find((b) => /Vágótervezés\s*→\s*$/.test(b.textContent ?? ''))
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
