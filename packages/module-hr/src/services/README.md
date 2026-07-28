# services/hr — HR adatréteg (F2-HR-FE)

Az EHS adatréteg-minta (`services/ehs/README.md` — annak MINDEN szabálya itt is
érvényes) másolata a HR modulra. Backend: `src/hr` — a **domain kész és
terv-konform** (Absence aggregátum + FSM + guardok), de nincs API-réteg/host
(audit G4.1), ezért a kontraktus MSW-first tükör: `src/mocks/hrApi/`, a backend
domain elnevezéseit követve.

## Modul-sajátosságok (eltérések/kiegészítések az EHS-mintához képest)

1. **FSM = a backend tükre** (`fsm.ts`): `kert → jovahagyva → folyamatban →
   lezarva` (+`elutasitva` a kertből, `reopen`-nel vissza) = a backend
   `AbsenceStatusTransitions` (Pending/Approved/InProgress/Completed/Rejected)
   1:1 megfelelője; az akciónevek (approve/reject/start/complete/reopen) az
   aggregátum-események tükrei. Guard-helperek: közös `services/fsmGuards`.
2. **`calc.ts` a Kontrolling calc.ts megfelelője:** napi kapacitás =
   heti óraszám / 5, lekötés = napi beosztás-órák összege, túlterhelés-flag,
   blokkoló távollét (`isAbsenceBlocking`: jovahagyva/folyamatban/lezarva) →
   0 kapacitás. Ugyanezt a tiszta modult futtatja a UI és az MSW
   (`GET /capacity` válasz-számítás) — egy igazságforrás. A kapacitás-rács a
   kliensen SOSEM számolódik újra: a `/capacity` válasz jelenik meg.
3. **Kereszt-invalidálás:** a távollét-átmenet a kapacitást is érinti →
   a mutáció a `absences` + `absence` (detail — KÜLÖN prefix!) + `capacity`
   kulcsokat invalidálja (EHS README 6. szabály, CRM S2 review-lecke).
4. **`hr.manage` jogosultság UI-STUB** (`permissions.ts`): a jóváhagyás/
   elutasítás gombok `manageBlockReason`-nel kapnak aria-disabled + tooltip
   tiltást; auth-bekötéskor csak a `useHrPermissions` belseje cserélendő.
5. **Munkaóra-napló → Kontrolling átadás STUB** (`timeLogs.ts`): a push
   végpont most csak megjelöli a tételeket (`pushedAt`) és toast-ol; éles
   integrációkor a mutációnak a `controllingKeys.all`-t is invalidálnia kell
   (munka-kategória tényköltség).

## Tesztminta

`src/services/hr/__tests__/` — `setupServer(...hrApiHandlers)` (msw/node) +
`resetHrDb()` beforeEach-ben; fetcher-függvények közvetlen hívása, FSM guard
409 utak + a `calc.ts` tiszta függvényei fix dátumokkal assertelve.
