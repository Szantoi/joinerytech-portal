# @spaceos/portal-ui

SpaceOS portál UI-primitívek: React 19 + Tailwind 4, design-system tokenekkel.
Iparág-semleges — a márkajelek és az iparági képernyők **nem** részei.

## Verziózott hozzáférés

| | |
|---|---|
| **Csomagnév** | `@spaceos/portal-ui` |
| **Aktuális verzió** | `1.0.0` |
| **Registry** | `https://npm.pkg.github.com` (GitHub Packages, privát) |
| **Jogosultság** | `read:packages` a `SPACEOS_PACKAGES_TOKEN`-en; a scope `@spaceos` |
| **Támogatott Node** | ≥ 20 (a mi CI-nk 24-en fut) |
| **Csomagkezelő** | npm ≥ 9 · pnpm és yarn nincs mérve |
| **Modul-alak** | **csak ESM** (`"type": "module"`) — CommonJS `require()` nem támogatott |
| **Változásnapló** | [CHANGELOG.md](./CHANGELOG.md) · migráció: [MIGRATION.md](./MIGRATION.md) |

**Verzió-pinelés integritással** (a kontraktus-hash fegyelem megfelelője):

```bash
npm view @spaceos/portal-ui@1.0.0 dist.integrity   # → sha512-…
```

Erre pinelve egy csendben újracsomagolt azonos verziószám nem csúszik be.

## Telepítés

A csomag privát registryben él (GitHub Packages). A fogyasztó `.npmrc`-je:

```
@spaceos:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${SPACEOS_PACKAGES_TOKEN}
```

```bash
npm install @spaceos/portal-ui
```

**Peer-ek** (a csomag nem hozza magával, hogy ne legyen két React-példány):
`react` ^19 · `react-dom` ^19 · `clsx` ^2.1 · `react-hot-toast` ^2.6

## ⚠ A leggyakoribb „nálam nem néz ki jól" ok

**A csomag nem hoz CSS-t.** A megjelenést Tailwind-osztálynevek adják, amik a
JS-be beégetett stringek — ha a te Tailwinded nem nézi végig a csomagot, a
komponensek stílus nélkül renderelnek.

Tailwind 4-ben vedd fel forrásnak:

```css
@import "tailwindcss";
@source "../node_modules/@spaceos/portal-ui/dist";
```

### A design-system tokenjei is kellenek

A primitívek **szemantikus** osztályokat használnak (`text-ink`,
`bg-surface-card`, `border-line`), nem nyers palettát. Ezeket a fogyasztónak
definiálnia kell, különben a tokenek feloldatlanok maradnak:

```css
@theme {
  --color-ink: #1c1917;
  --color-ink-soft: #57534e;
  --color-ink-muted: #78716c;
  --color-surface-card: #ffffff;
  --color-surface-sunken: #fafaf9;
  --color-surface-0: #ffffff;
  --color-surface-1: #fafaf9;
  --color-surface-2: #f5f5f4;
  --color-line: #e7e5e4;
  --color-line-strong: #d6d3d1;
}
```

Sötét témához ugyanezeket a `:root[data-theme="dark"]` alatt írd felül — a
komponensek a `dark:` variánst is használják, tehát a Tailwind dark-mode
stratégiádnak `data-theme`-alapúnak kell lennie, vagy igazítsd a sajátodhoz.

## Mit ad

63 publikus export. A leggyakrabban használtak:

| Primitív | Mire jó |
|---|---|
| `QueryGate` | egységes betöltés/hiba keret (skeleton + újrapróbálás) |
| `GanttChart` | idősáv sávokkal, saját tengely-feliratokkal |
| `DependencyGraph` | FS/SS/FF/SF függőségi háló |
| `CapacityHeatmap` | kapacitás-hőtérkép valódi táblázat-szemantikával |
| `ConfirmDialog` / `useConfirm` | promise-alapú megerősítés, fókuszcsapdával |
| `STATUS_TONES` | 7 elemű szemantikus tónus-skála (light + dark, WCAG AA) |
| `isoDate` / `addDays` | **helyi** idejű dátumkezelés (nem UTC), DST-biztos |

## Amit szándékosan NEM ad

- **Auth/tenant fogalmakat** — azok a `@spaceos/portal-core`-ban élnek, és a
  te identitás-modelleddel ütközhetnek. Külön kör, külön döntés.
- **Márkajelet** — a szóvédjegy az alkalmazásé, nem a primitív-készleté.
- **Iparág-specifikus képernyőket** — azok a `@joinerytech/world-*`
  csomagokban vannak, és nem publikusak.

A semlegességet **kapu őrzi**, nem figyelem: `src/__tests__/neutrality.test.ts`
tiltott szólistát futtat a forrás felett (a provenancia-kommentek kivételével).
