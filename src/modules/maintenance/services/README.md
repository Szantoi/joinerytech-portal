# services/maintenance — Maintenance adatréteg (F2-MAINTENANCE-FE)

A HR adatréteg-minta (`services/hr/README.md` — annak MINDEN szabálya itt is
érvényes) másolata a Maintenance modulra. Backend: `src/maintenance` — a
**domain ÉS az API-váz kész** (Asset + WorkOrder aggregátum, FSM, endpointok),
de a munkalap-átmenetek közül csak a start/complete van kivezetve, és a
végpontok 204-et adnak vissza — ezért a kontraktus MSW-first tükör:
`src/mocks/maintenanceApi/`, a backend domain elnevezéseit követve.

## Modul-sajátosságok (eltérések/kiegészítések a HR-mintához képest)

1. **FSM = a backend WorkOrder aggregátum tükre** (`fsm.ts`):
   `bejelentve → utemezve → folyamatban → kesz` (+`halasztva` az
   utemezve/folyamatban-ból, +`elutasitva` a bejelentve/utemezve-ből, mindkettő
   `reopen`-nel vissza bejelentve-be) = Reported/Scheduled/InProgress/
   Completed/Postponed/Rejected 1:1. **Az aggregátum az irányadó, nem a
   `WorkOrderStatusTransitions` tábla** (az a Reported→InProgress ugrást is
   engedné — dokumentált backend-gap). Extra guardok: `canAssignWorkOrder`
   (felelős csak bejelentve/utemezve-ben), `startAssignmentBlockReason`
   (a start felelős nélkül tiltott — `StartWork()` tükör).
2. **`calc.ts` = KÉT backend domain-service tükre:** `calcAssetStatus`
   (`AssetStatusCalculationService` — az eszköz-státusz SZÁMÍTOTT, sosem
   tárolt: selejtezve / geptores / karbantartas / uzemel) és
   `isPlanDue`/`planDueInfo` (`PreventiveMaintenanceSchedulerService` —
   idokoz- és uzemora-trigger). Ugyanezt a modult futtatja a UI és az MSW
   (asset-válaszok `status`/`duePlans` mezői) — a kliens SOSEM számol
   saját eszköz-státuszt.
3. **Kereszt-invalidálás:** a munkalap-átmenet az eszköz-státuszt is érinti
   (leállásos munka indítása/lezárása átbillenti) → a mutáció a
   `workorders` + `workorder` (detail — KÜLÖN prefix!) + `assets` + `asset`
   kulcsokat invalidálja (EHS README 6. szabály, CRM S2 review-lecke).
4. **`maintenance.manage` jogosultság UI-STUB** (`permissions.ts`): minden
   átmenet- és hozzárendelés-gomb `maintenanceManageBlockReason`-nel kap
   aria-disabled + tooltip tiltást; auth-bekötéskor csak a
   `useMaintenancePermissions` belseje cserélendő.
5. **Küszöbök a configból** (`config.ts`): esedékesség-ablakok
   (`PLAN_DUE_SOON_DAYS`/`_HOURS`), ütemterv-ablak (`SCHEDULE_WINDOW_DAYS`).

## Tesztminta

`src/services/maintenance/__tests__/` — `setupServer(...maintenanceApiHandlers)`
(msw/node) + `resetMaintenanceDb()` beforeEach-ben; fetcher-függvények
közvetlen hívása, FSM guard 409 utak (+ a start felelős-guardja) + a `calc.ts`
tiszta függvényei fix dátumokkal assertelve.
