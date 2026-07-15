# services/controlling — Kontrolling adatréteg (F2-KONTROLLING-FE)

Az EHS adatréteg-minta (`services/ehs/README.md`) másolata a Kontrolling
modulra. Backend: `src/spaceos-modules/spaceos-modules-kontrolling` — **KÉSZ**
(EAC, variance, cost-adjustment, overhead), de host nélkül (audit G0.1/G3.2),
ezért a kontraktus MSW-first tükör: `src/mocks/controllingApi/`.

## Modul-sajátosságok (eltérések az EHS-mintától)

1. **Nincs FSM.** A projekt-státusz (`draft/active/install/done/on_hold`)
   életciklus-CÍMKE (terv 70. sor), nem szigorú állapotgép — nincs
   `fsm.ts`, nincs transition-végpont, a `fsmGuards` itt nem alkalmazható.
   Tónusok: `theme/fsmTones.ts` `kontrollingProjekt` készlete.
2. **`calc.ts` a validity.ts megfelelője:** a backend
   `ProjectCostCalculation` aggregátum tükre (EAC = kategóriánkénti
   MAX(terv, tény), variance, fedezet-százalékok) — a UI és az MSW mock
   ugyanazt a tiszta modult futtatja.
3. **Kereszt-invalidálás (EHS README 6. szabály) itt totális:** a
   költség-korrekció (utókalkuláció) a kategória tény-költségét módosítja,
   ami MINDEN olvasatot érint (portfólió-lista, projekt-kalkuláció,
   vezetői KPI-k, eltérés-elemzés) → a mutációk a `controllingKeys.all`
   prefixet invalidálják.
4. **Kategória-kulcsok:** kanonikus magyar kulcsok ↔ backend `CostCategory`
   enum: anyag=Material, munka=Labor, bermunka=Subcontracting,
   szallitas=Logistics, beszallito=Supplier, rezsi=Overhead.
