# Változásnapló — `@spaceos/portal-ui`

A verzió **tartalmi változásnál** emelkedik (a backend hash-pin fegyelmének
analógja). Semver: `MAJOR` = törő változás a publikus felületen, `MINOR` = új
primitív vagy additív prop, `PATCH` = javítás a viselkedésben.

**Törő változást `⚠ BREAKING` jelöléssel írunk ki**, és mellé mindig kerül
migrációs lépés a [MIGRATION.md](./MIGRATION.md)-be.

---

## 1.0.0 — 2026-07-29

Az első **fogyasztható** kiadás. Eddig a csomag `private: true` volt és forrást
exportált (`./src/index.ts`), tehát külső projekt másolni tudta, fogyasztani nem.

### Hozzáadva

- **Buildelt kimenet**: ESM `dist/index.js` + `.d.ts` (41 deklarációs fájl).
  A peer-ek (`react`, `react-dom`, `clsx`, `react-hot-toast`) **külsők**
  maradnak — két React-példány néma hook-hibákat okozna.
- **Semlegességi kapu**: `src/__tests__/neutrality.test.ts` tiltott szólistát
  futtat a forrás felett. CI-ben is fut, tehát gép őrzi, nem figyelem.

### ⚠ BREAKING — eltávolítva a publikus felületről

- **`Wordmark`, `GrainMark`** — szóvédjegy és faerezet-motívum. Egyik sem
  UI-primitív: márkajel az alkalmazásé. Átkerültek a portál `src/components/
  layout/` alá. **Külső fogyasztót nem érint** (a csomag eddig sem volt
  telepíthető), a workspace-en belül az importútvonal változott.

### Ismert korlát

- A csomag **nem hoz CSS-t**: Tailwind-osztálynevek beégetett stringek. A
  fogyasztónak `@source`-szal be kell húznia a `dist`-et, és definiálnia kell a
  szemantikus tokeneket — ld. [README](./README.md).

---

## Verzió-üzenet sablon (kiadáskor a fogyasztónak)

```
@spaceos/portal-ui <verzió> kiadva.

Mi változott:  <egy mondat>
Törő változás: <nincs | a lista + migrációs lépés hivatkozása>
Migráció:      MIGRATION.md#<szakasz>
Rollback:      npm install @spaceos/portal-ui@<előző verzió>

Integritás:
  npm view @spaceos/portal-ui@<verzió> dist.integrity
  → sha512-…            (a fogyasztó ezt pinelheti)
```

A `dist.integrity` a csomag-tarball SHA-512 lenyomata — a backend
kontraktus-hash fegyelmének megfelelője: ha a fogyasztó erre pinel, egy
csendben újracsomagolt azonos verziószám **nem** csúszik be észrevétlenül.
