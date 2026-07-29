# Migrációs útmutató — saját komponensről `@spaceos/portal-ui`-ra

Komponensenként: mit cserélsz, mire figyelj, és **hogyan állsz vissza**, ha nem
válik be. A sorrend szándékos — a legkisebb kockázatúval kezdd.

**Általános rollback (bármelyik lépésre):** a régi komponensed maradjon a
repóban a következő kiadásig; a csere egy import-sor. Ha visszaállsz, írd meg
nekünk **miért** — abból tudjuk, mi hiányzik a primitívből.

---

## 0. Előfeltétel (egyszer)

```css
@import "tailwindcss";
@source "../node_modules/@spaceos/portal-ui/dist";
```

Plusz a szemantikus tokenek (`--color-ink`, `--color-surface-card`, …) — a
teljes lista a [README](./README.md)-ben. **Ezt hagyd ki, és minden komponens
stílus nélkül renderel** — ez a leggyakoribb hibabejelentés.

**Ellenőrzés, mielőtt továbbmész:** renderelj egy `QueryGate`-et `isPending`-gel.
Ha látod a skeleton-sorokat, a token-bekötés rendben van.

---

## 1. `StatusChip` → `StatusPill` *(legkisebb kockázat)*

A tónus-kulcs a rendering, a jelentés a te FSM-térképed marad.

```diff
- <StatusChip status={order.status} />
+ <StatusPill tone={toneOf(order.status)}>{labelOf(order.status)}</StatusPill>
```

**Figyelj:** a `STATUS_TONES` 7 elemű és WCAG AA-ra hangolt (light `-100`/`-800`,
dark `-950`/`-300`). Ha a saját palettád más, **ne** írd felül a tónusokat —
a `tone` kiválasztását igazítsd.

**Rollback:** import-csere vissza. Adat-alak nem változik.

---

## 2. Dátumkezelés → `isoDate` / `addDays` / `parseIsoDate`

```diff
- const day = new Date().toISOString().split('T')[0]
+ const day = isoDate(new Date())
```

**Miért éri meg:** a `toISOString()` **UTC**-t ad. Budapesten éjfél és 01:00/02:00
között az **előző** napot — éjszakai műszakban a tegnapi tervet mutatja mainak.
Az `addDays` naptári léptetés, tehát DST-váltáskor sem csúszik el.

**Figyelj:** ha az API UTC-t vár, a határon **te** konvertálj — a segédek
szándékosan helyi idejűek.

**Rollback:** a két hívás visszacserélése. Nincs állapot-hatás.

---

## 3. `ConfirmDialog` + `useConfirm`

```diff
- if (window.confirm('Biztosan törlöd?')) doDelete()
+ if (await ask({ title: 'Biztosan törlöd?', confirmLabel: 'Törlés',
+                 cancelLabel: 'Mégse', tone: 'danger' })) doDelete()
```

Strukturált összefoglalóhoz (mire mond igent a felhasználó) a `details` mező:

```ts
await ask({
  title: 'Kiosztás megerősítése',
  confirmLabel: 'Megerősítés', cancelLabel: 'Mégse',
  details: [{ label: 'Célgép', value: 'Holzma HPP380', hint: 'Kapacitás: 100' }],
})
```

**Figyelj:** `<ConfirmProvider>` kell a fába (a `ToastProvider` **alatt**, hogy a
dialógus bezárása után érkező visszajelzés ne essen az inert háttérbe).
A fókusz szándékosan a **Mégsén** landol — egy véletlen Enter ne hajtson végre
romboló műveletet.

**Rollback:** a `window.confirm` visszaállítása; a provider maradhat, ártalmatlan.

---

## 4. `DependencyGanttTimeline` → `GanttChart`

**Ez a te kódodból lett általánosítva** (PLAN-05 F1) — az adat-alak ismerős lesz.

```diff
- <DependencyGanttTimeline rows={rows} />
+ <GanttChart lanes={lanes} domain={{ start, end }} ticks={hourTicks}
+             ariaLabel="…" emptyLabel="…" />
```

**Figyelj két dologra:**
1. A `formatTick` alapértelmezése **UTC** `óó:pp`-t ad. Ha a `domain` helyi
   idejű (pl. egy naptári nap éjfele), adj saját formattert **vagy** explicit
   `ticks` listát — különben a felirat eltolódik a zónával.
2. Az `emptyLabel` **nem hibaállapot-jelzés**. Betöltés/hiba esetén a `QueryGate`
   a helyes keret; az üres felirat azt állítja, hogy *nincs adat*, nem azt, hogy
   *nem tudjuk*.

**Rollback:** a régi komponens visszakapcsolása; a `lanes` → `rows` átalakítás a
te oldaladon egy `map`.

---

## 5. `WorkflowDependencyGraph` → `DependencyGraph`

Ugyanaz a provenancia. FS/SS/FF/SF relációkat kezel.

**Figyelj:** hiányzó végpontra **nem rajzol kitalált élt** — ha nálad eddig
megjelent egy él, aminek az egyik vége nincs az adathalmazban, az itt eltűnik.
Ez szándékos: egy nem létező függőség kirajzolása félrevezet.

**Rollback:** import-csere vissza.

---

## 6. Betöltés/hiba keret → `QueryGate` *(a legnagyobb haszon)*

```diff
- {isLoading && <Spinner />}
- {data && <Table rows={data} />}
+ <QueryGate isPending={q.isPending} isError={q.isError}
+            onRetry={q.refetch} resource="rendelések">
+   <Table rows={data ?? []} />
+ </QueryGate>
```

**Figyelj — ez a leggyakoribb hiba:** ha a query-hookod **lusta** (a fetch nem
indul magától), az `isLoading` `false`-ként indul, és egy `isPending={isLoading}`
gating **átvillantja az üres nézetet**. A helyes predikátum: *„nincs válasz erre
az url-re" is betöltés.* Nálunk ezt a hook adja meg, nem a fogyasztó.

**Rollback:** a régi feltételes render visszaállítása.

---

## Amit szándékosan NEM migrálunk

- **`roles` / auth fogalmak** — a `@spaceos/portal-core`-ban élnek, és a te
  identitás-modelleddel ütközhetnek. Külön kör, külön döntés.
- **Theme-provider** — a tokenek a te CSS-edben élnek; nem viszünk providert,
  hogy a saját téma-váltásod maradjon a főnök.
