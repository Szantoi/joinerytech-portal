# services/qa — QA adatréteg (F2-QA-FE)

A HR/Maintenance adatréteg-minta (`services/hr/README.md` — annak MINDEN
szabálya itt is érvényes) másolata a QA (minőségbiztosítás) modulra.
Backend: `src/qa` (SpaceOS.Modules.QA) — a **domain teljes** (Inspection +
Ticket + QACheckpoint aggregátum, FSM-táblákkal), de az endpoint-réteg
részleges: az Inspection végpontok léteznek (204-es válaszokkal), a
**Ticketnek egyetlen REST végpontja sincs** — a hibajegy-kontraktus MSW-first
tükör: `src/mocks/qaApi/`, a backend Command-neveit követve.

## Modul-sajátosságok (eltérések/kiegészítések a mintához képest)

1. **KÉT FSM egy modulban** (`fsm.ts`):
   - **INSPECTION_FSM** — az Inspection aggregátum tükre: `nyitott →
     folyamatban → megfelelt | selejt`. A backend a státuszt
     (Planned/InProgress/Completed) és az eredményt (Pass/Fail) külön mezőben
     tárolja; a kliens a kettő összevonását használja kanonikus kulcsként
     (fsmTones `qaEllenorzes`). A megfelelt/selejt terminális (immutable
     audit-trail). **Spec↔backend gap:** a spec `javitasra` (rework-hurok)
     ága és a `Conditional` eredmény a backendben nem létezik — a szigorúbb
     backend az irányadó (ADR/follow-up).
   - **TICKET_FSM** — a Ticket aggregátum tükre: `bejelentve → kiosztva →
     folyamatban → megoldva` (+`elutasitva` a folyamatban-ból, `reopen`-nel
     vissza bejelentve-be). A megoldva terminális (`IsTerminalState`).
   - Extra guardok: `failNotesBlockReason` (selejtezés legalább 1
     hibajegyzettel — `CompleteWithFail()` tükör), `resolveActionsBlockReason`
     (megoldás legalább 1 intézkedéssel — `Resolve()` tükör),
     `escalateStatusBlockReason`/`escalatePriorityBlockReason` (eszkaláció:
     nem terminálison, csak FELFELÉ — `EscalatePriority()` tükör).
2. **`calc.ts` = a backend lekérdezés-logikáinak tükre:**
   `isInspectionBlocking` (`GetBlockingInspectionsQuery` — kritikus ponton
   selejt BLOKKOLJA a gyártást; a mező SZÁMÍTOTT, az MSW kiszolgáláskor adja),
   `calcQaMetrics` (`GetQAMetricsQueryHandler`/QAMetricsDto — pass rate,
   átlagos megoldási idő), `weeklyInspectionTrend` (a metrics heti bontása a
   trend-nézethez). Ugyanezt futtatja a UI és az MSW — a kliens SOSEM számol
   saját `blocking`/`openTickets` mezőt, a válaszban kapott jelenik meg.
3. **Kereszt-invalidálás (rule-6):** az átvizsgálás `openTickets` mezője a
   kapcsolt hibajegyekből SZÁMÍTOTT → minden hibajegy-mutáció a
   `tickets` + `ticket` (detail — KÜLÖN prefix!) + `inspections` + `inspection`
   kulcsokat invalidálja. Az átvizsgálás-átmenet csak a saját kulcsait
   (hibajegyet nem módosít).
4. **`qa.manage` jogosultság UI-STUB** (`permissions.ts`): minden átmenet-,
   létrehozás- és eszkaláció-gomb `qaManageBlockReason`-nel kap aria-disabled
   + tooltip tiltást; auth-bekötéskor csak a `useQaPermissions` belseje
   cserélendő.
5. **Küszöbök a configból** (`config.ts`): megfelelési küszöb
   (`PASS_RATE_WARN_THRESHOLD` — HR-review M1-lecke), trend-ablak
   (`TREND_WINDOW_WEEKS`).

## Backend-gapek (follow-up a backend terminálnak)

- **Ticket REST végpontok hiánya** — a teljes `/api/qa/tickets` készlet
  (lista/detail/create + assign/start/resolve/reject/reopen/escalate)
  MSW-first előkép.
- **204 → frissített DTO:** az Inspection átmenet-végpontok 204-et adnak; a
  UI-kontraktus a frissített InspectionDto-t várja (Maintenance-precedens).
- **Checklist a detailben:** az InspectionDto nem hordozza a checkpoint
  szempontjait (criteria) — a kontraktus denormalizálva beemeli.
- **GetQAMetricsQuery endpoint nélkül** — a dashboard/trend most kliens-oldali
  calc-tükörrel számol a listákból; endpoint után átállítandó.
- **Spec `javitasra` / backend `Conditional`** — nincs backend-átmenet (ADR).

## Tesztminta

`src/services/qa/__tests__/` — `setupServer(...qaApiHandlers)` (msw/node) +
`resetQaDb()` beforeEach-ben; fetcher-függvények közvetlen hívása, FSM guard
409 utak (+ a payload-guardok 400-jai) + a `calc.ts` tiszta függvényei fix
dátumokkal assertelve; rule-6 keresztkötés a kontraktusban (hibajegy-mutáció →
átvizsgálás `openTickets`).
