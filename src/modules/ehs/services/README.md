# services/ehs — modul-adatréteg minta (F2, EPIC-UI-PORTAL-2026Q3)

Az EHS az első modul, amely a portálban **HTTP-n keresztül, típusosan** beszél a
backenddel (dev-ben az MSW mockkal). Ez a könyvtár a **minta** a többi modul
(CRM, HR, Maintenance, QA, DMS, Kontrolling) adatrétegéhez — másold a szerkezetet.

## Szerkezet

| Fájl | Felelősség |
|---|---|
| `../apiClient.ts` | **Generikus** (modul-független) fetch réteg: query-string, JSON body, hiba→`ApiError` (status + backend message), zod-validálás. |
| `config.ts` | Modul-konfiguráció: API base path, ablak-konstansok. Nincs hardcode a komponensekben. |
| `keys.ts` | TanStack Query kulcs-gyár. Hierarchikus: `ehsKeys.all` → domain → szűrők. Invalidálás mindig kulcs-prefixszel. |
| `fsm.ts` | FSM-átmenet táblák (a backend guardok tükre) + `canTransition` / `transitionBlockReason`. **Ugyanezt importálja a UI (disabledReason) és az MSW mock (409 guard)** — egy igazságforrás. |
| `validity.ts` | Számított mezők logikája (SDS érvényesség, EVE lejárat) — a backend számításának tükre, tesztelhető tiszta függvények. |
| `{domain}.ts` (locations, incidents, materials, ppe, safetyWalks, capa) | Domainenként EGY fájl: zod sémák (openapi.yaml alapján) + fetcherek (`apiFetch`) + hookok (`useQuery`/`useMutation`). |
| `index.ts` | Barrel export. |

## Szabályok (a mintát másolóknak)

1. **Séma = kontraktus.** Minden válasz zod-sémán megy át (`apiFetch({ schema })`);
   ha a backend eltér az openapi.yaml-tól, dev-ben azonnal parse-hibát kapsz.
2. **FSM-akció = dedikált végpont.** Nincs generikus "PATCH status" — a mutáció a
   backend transition route-ját hívja; tiltott átmenet → **409** → a hook hiba-toastot
   ad és invalidál (a szerver az igazságforrás).
3. **A UI a tiltott akciót NEM rejti el**: `Button disabledReason={transitionBlockReason(...)}`
   (aria-disabled + tooltip, plan 2/3. vezérelv).
4. **Optimista frissítés** csak ott, ahol a célállapot determinisztikus
   (ld. `useIncidentTransition`): onMutate → cache-átírás, onError → rollback + toast,
   onSettled → invalidálás.
5. **Mutáció-visszajelzés a hookban él** (toast siker/hiba) — a komponens csak hív.
6. **FSM-mutáció minden érintett domain-kulcsot invalidál** — a keresztkötéseket is.
   Az egységes CAPA-tábla miatt egy mutáció több domaint érinthet: CAPA-teljesítés →
   `capas` + `walk` + `incidents` + `incident`; incidens-átmenet (pl. `addCorrectiveAction`)
   → `incidents` + `incident` + `capas`. Figyelem: a detail kulcs (`incident`, `walk` —
   egyes szám) NEM a lista-prefix alatt él, külön invalidálandó (409-rollback után is
   így szinkronizál újra a szerverrel). Minta: `safetyWalks.ts` `useInvalidateWalks`.
7. **MSW tükör:** a mockok a `src/mocks/ehsApi/` alatt élnek, domainenként bontva,
   közös in-memory store-ral (`db.ts`, `resetEhsDb()` teszthez), és ugyanazokat az
   FSM-guardokat futtatják (`fsm.ts`), 409-cel válaszolva — a UI-t így éles
   kontraktus-viselkedésen fejlesztjük és teszteljük.

## Tesztminta

`src/services/ehs/__tests__/` — `setupServer(...ehsApiHandlers)` (msw/node) +
`resetEhsDb()` beforeEach-ben; a fetcher-függvényeket hívjuk közvetlenül
(hook-render nélkül gyors), FSM guard 409 utakat és számított mezőket assertelve.
