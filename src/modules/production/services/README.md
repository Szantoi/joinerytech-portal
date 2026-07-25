# services/production — API-first adatréteg (WORLDS-PRODUCTION-FE)

A production világ adatrétege az EHS-minta (`src/modules/ehs/services/README.md`)
szerkezetét követi, de — az MSW-first modulokkal ellentétben — **API-first**:
minden séma/útvonal/FSM az egyetlen kontraktus-igazságból készült:
`docs/knowledge/architecture/WORLDS_API_CONTRACTS_2026-07-18.md`
(1. cutting + 2. joinery szekció). Az MSW ennek TÜKRE, nem előkép.

## Eltérések az MSW-first moduloktól

| Kérdés | MSW-first modulok (qa, hr…) | production |
|---|---|---|
| Státusz-kulcsok | kanonikus MAGYAR | **MAI wire-alak: angol tagnév-string** (wire.ts) — ADR-059 wave 2 (EnumWireMap) EGY helyen cseréli |
| Request-enumok | string | **SZÁM** (int ordinal — wire.ts szótárak fordítanak) |
| FSM-sértés hibakódja | egységesen 409 | **végpontonként eltér** (a backend Ardalis-mappingje): planning → 400 · executions → **422 + csupasz `[{identifier,errorMessage}]` tömb** (állapot ÉS payload egyaránt: az Execution szeletben 0 db `Result.Conflict` producer van, minden elutasítás `Result.Invalid` → `MapResult` 422 — M-2 fix, review 2026-07-24) · joinery DoorOrder → **400 + csupasz `string[]`** (`Results.BadRequest(result.Errors)`; a 404 ÜRES törzsű) · quotes → 400 |
| Útvonalak | egy API-gyökér | **kevert prefixek** (P7): `/cutting/api/cutting/*` ÉS `/cutting/api/plans/*` (assign-batch) — nem „szépítjük" |

## Fájlok

| Fájl | Felelősség |
|---|---|
| `config.ts` | API-gyökerek (proxy-prefixek + P7 dokumentálva), kontraktus-korlátok (planDays 7..90…), UI-küszöbök. Literál a képernyőkön nincs. |
| `wire.ts` | Enum-szótárak EGY helyen (ADR-059 csere-pont): string-készletek + request-oldali szám-térképek. |
| `keys.ts` | TanStack Query kulcs-gyár (detail kulcsok a lista-prefixen KÍVÜL). |
| `fsm.ts` | FSM-tükrök a közös `fsmGuards`-on: CuttingPlan, CuttingExecution (6 állapot, `Failed` átmenet nélkül), DoorOrder (⚠ `InProduction/Completed/Cancelled` ELÉRHETETLEN — a UI gap-ként jelöli), Quote. + FSM-en túli guardok (publish-snapshot, complete-panels, submit-items, **device-signature/G9**) — a UI és az MSW közös függvényei. |
| `plans.ts` | Vágótervek (planning-aggregátum) + priority-profilok + assign-batch (kevert prefix). Freeze → kereszt-entitás invalidálás (offcut-batch regisztráció indul a backendben). |
| `executions.ts` | Végrehajtás lista/detail/idővonal + start/progress/complete/cancel (HMAC-mezőkkel, szám-enumokkal). ⚠ `api` módban a start/progress/complete LETILTOTT — nincs eszköz-integráció a valós aláíráshoz (G9 gap). |
| `orders.ts` | Joinery DoorOrder lista/detail/szabásjegyzék + submit/revert/calculate. |
| `quotes.ts` | Árajánlat-lista + approve/reject + waste-riport (config-ablak). |

## Ismert gapek (teljes lista: a task-doksi végén)

- DoorOrder `InProduction/Completed/Cancelled`: nincs backend-átmenet (P6) — disabled+tooltip.
- assign-batch: a batch-read-modelben nincs batchId (P2) — fetcher+MSW kész, UI-etetés follow-up.
- Execution `Schedule`: sheetId/workerId/enrollmentId forrás-lista hiányzik (P8) — nincs bekötve.
- Analytics OEE/trend: `tenantId` kötelező query-param = hitelesítetlen tenant-állítás (P4) — a
  portál NEM hívja a WORLDS-CUTTING-AUTHFIX előtt.
- `apiFetch` ma nem visz Authorization headert (közös modul-minta gap — hosting-kör).
- **G9 — eszköz-integráció (kártyaolvasó / esemény-aláírás) nincs bekötve:** a badge-HMAC,
  esemény-HMAC és bizonyíték-hash valós forrása hiányzik, ezért `api` módban a három
  aláírás-függő execution-akció letiltott (`deviceSignatureBlockReason`).
- **DoorOrder `createdAt` nem perzisztált:** a lista üres dátumot, a detail a lekérés idejét
  adja — a UI „—"-t mutat magyarázattal (M-4).
- **Nincs joinery count/filter végpont:** a dashboard rendelés-KPI-ja csak a lekért lapot
  vizsgálja, és ezt az alcím ki is mondja (M-6).
- **Mock-fidelitás maradvány:** a planning/quotes 400-as ágak és a 404-ek a mockban
  `{error, message}` törzset adnak, míg a valós cutting host `Result`-alapú törzset küld
  (planning: ValidationErrors-tömb; 404: üres). A hibaÜZENET így is helyesen jut a UI-ig,
  de az alak-tükrözés hiányos — az API-GATE élő fázisában rendezendő follow-up.
