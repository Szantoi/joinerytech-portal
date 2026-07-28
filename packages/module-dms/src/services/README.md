# services/dms — DMS adatréteg (F2-DMS-FE)

A HR/Maintenance/QA adatréteg-minta (`services/hr/README.md` — annak MINDEN
szabálya itt is érvényes) másolata a DMS (dokumentumkezelés + verziózás)
modulra — a 7., utolsó platform-modul.

**Forrás-helyzet:** a backend `src/dms` Document-magja **domain-modell +
OpenAPI-kontraktus** (Active/Archived/Deleted életciklus, DocumentVersion
value object, AddVersion) — futtatható endpoint-rétege NINCS (host,
handler-ek és repository-implementációk hiányoznak; csak a
DocumentCategory/Tag szelet handler-kész). Jóváhagyás-folyam a backendben
egyáltalán nincs. Ilyenkor a feladat-kiírás szerint a **prototípus az
irányadó** (`docs/joinerytech/data-docs.js` — DOC_FLOW/DocsEngine) és az
**MSW-kontraktus a rögzítendő előkép** (`src/mocks/dmsApi/`).

## Modul-sajátosságok (eltérések/kiegészítések a mintához képest)

1. **Életciklus-FSM** (`fsm.ts` — a prototípus DOC_FLOW 1:1 tükre, a spec
   fsmTones `dmsDokumentum` kanonikus kulcsaival):
   `piszkozat → ellenorzes → kiadott → archivalt`, visszautasítás-ág:
   `ellenorzes → piszkozat` (reject), felülvizsgálat: `kiadott → ellenorzes`
   (recall), újranyitás: `archivalt → piszkozat` (reopen). Ellenőrzés ALATT
   nem archiválható (előbb döntés kell). Extra guardok:
   - `uploadVersionBlockReason` — archivált dokumentumhoz nem tölthető fel
     új verzió (a backend `AddVersion()`/Deleted-tiltás tükre) → UI-gomb +
     MSW **409** közös feltétele;
   - `rejectReasonBlockReason` — visszautasítás csak indokkal (QA
     reject-precedens) → UI-beküldés + MSW **400**;
   - `versionFieldsBlockReason` — fájl-címke + változás-jegyzet kötelező
     (DocumentVersion.ChangeNotes tükör) → UI-beküldés + MSW **400**.
2. **`calc.ts` = a prototípus/backend lekérdezés-logikáinak tükre:**
   - `releasedVersionInfo` (`DocsEngine.runtimeVersion()` tükör): a műhely a
     legutolsó KIADOTT verziót használja; ha az aktuális verzió nem kiadott,
     a korábbi kiadott az érvényes (pending), ha sosem volt kiadás → blocked.
     A `releasedVersion` mező SZÁMÍTOTT, az MSW kiszolgáláskor adja.
   - `expiryState` (IDocumentExpiryService / `GET /search/expiring` előkép):
     lejárt / a config-ablakon (`EXPIRY_WARN_DAYS`) belül lejáró → az
     `expiry` mező is kiszolgáláskor számított.
   - `docStats` (`DocsEngine.stats()` tükör) — dashboard KPI-k.
   Ugyanezt futtatja a UI és az MSW — a kliens SOSEM számol saját
   `releasedVersion`/`expiry` mezőt, a válaszban kapott jelenik meg.
3. **Verzió-lánc:** `POST /documents/:id/versions` = verziószám-léptetés
   (`version + 1` — AddVersion-tükör), a korábbi verziók MEGŐRZŐDNEK a
   `versions[]` láncban (verziótörténet); az új verzió `piszkozat`
   munkapéldányként indul (újra végig kell mennie a jóváhagyáson), a
   dokumentum státusza is `piszkozat`-ra vált. A verzió-bejegyzés `status`
   mezője pillanatkép: az AKTUÁLIS verzióé az átmenetekkel együtt frissül —
   ebből számítódik az érvényes kiadott verzió.
4. **Kereszt-invalidálás (rule-6):** a verziószám/státusz a lista ÉS a detail
   nézetben is derivált → a verzió-mutáció a `documents` + `document`
   (detail — KÜLÖN prefix!) kulcsokat egyaránt invalidálja; az FSM-átmenet
   ugyanígy (a lista státusz-pillje és az érvényes-verzió oszlopa változik).
5. **`dms.manage` jogosultság UI-STUB** (`permissions.ts`): minden átmenet- és
   verzió-gomb `dmsManageBlockReason`-nel kap aria-disabled + tooltip
   tiltást; auth-bekötéskor csak a `useDmsPermissions` belseje cserélendő.
6. **Küszöbök a configból** (`config.ts`): lejárat-ablak
   (`EXPIRY_WARN_DAYS` — HR-review M1-lecke: sosem literál a UI-ban),
   legutóbbi-lista hossza (`RECENT_DOCS_LIMIT`).

## Backend-gapek (follow-up a backend terminálnak)

- **Document endpoint-réteg hiánya** — az openapi.yaml kontraktus létezik, de
  nincs host/handler/repository a Document-maghoz; a teljes
  `/api/dms/documents` készlet MSW-first előkép.
- **Jóváhagyás-folyam hiánya** — a backend életciklus Active/Archived/Deleted;
  a prototípus (és a spec `dmsDokumentum` készlete) piszkozat/ellenőrzés/
  kiadott/archivált jóváhagyás-kapuval dolgozik. A kliens a prototípust
  tükrözi; a backend `archive/unarchive/restore` ↔ kliens `archive/reopen`
  megfeleltetése és a review-státuszok backend-bevezetése ADR-döntés.
- **Fájl-tartalom:** nincs blob-feltöltés (IBlobStorageService implementálatlan)
  — a prototípus mintájára a `fileLabel` jelképezi a fájlt; valódi
  multipart/presigned-url folyam a backend-bekötéskor.
- **DocumentCategory/Tag szelet:** a backend EGYETLEN handler-kész szelete —
  a könyvtár-képernyő mappa-tengelye most a prototípus kapcsolat-típusa
  (`linkType`); kategória-fa bekötése a Category-endpointok kivezetése után.
- **Lejárat a szerverről:** `GET /search/expiring|expired` az openapi-ban
  definiált — endpoint után a kliens `expiring=true` szűrője átállítandó.

## Tesztminta

`src/services/dms/__tests__/` — `setupServer(...dmsApiHandlers)` (msw/node) +
`resetDmsDb()` beforeEach-ben; fetcher-függvények közvetlen hívása, FSM guard
409 utak (+ a payload-guardok 400-jai), verzió-lánc kontraktus (léptetés +
megőrzés + számított releasedVersion), lejárat-szűrő; a `calc.ts` tiszta
függvényei fix dátumokkal assertelve.
