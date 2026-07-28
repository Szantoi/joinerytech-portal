# services/crm — CRM modul-adatréteg (F2-CRM-FE, EPIC-UI-PORTAL-2026Q3)

Az EHS-ben bevált adatréteg-minta (`../ehs/README.md`) másolata a CRM modulra.
**MSW-FIRST kontraktus:** a backend CRM modulnak nincs futtatható hostja/OpenAPI-ja
(audit blocker G0.1), ezért a kontraktust a `src/mocks/crmApi/` MSW-tükör rögzíti
a terv-FSM-ek szerint (UI_IMPLEMENTATION_PLAN 5. pont).

## Szerkezet

| Fájl | Felelősség |
|---|---|
| `../apiClient.ts` | Generikus fetch réteg (query-string, JSON, `ApiError`, zod-validálás). |
| `../fsmGuards.ts` | Generikus FSM guard helperek (`canTransition`, `transitionBlockReason`). |
| `config.ts` | Modul-konfiguráció: API base path, SLA-ablak, lista-limitek. |
| `keys.ts` | TanStack Query kulcs-gyár (`crmKeys.all` → domain → szűrők). |
| `fsm.ts` | Lead- és Opportunity-átmenet táblák + fázis-valószínűségek + `nextOppAction`. UI és MSW közös igazságforrása. |
| `sla.ts` | SZÁMÍTOTT feladat-SLA (`ok`/`soon`/`overdue`) — tesztelhető tiszta függvények. |
| `activities.ts` | Tevékenységnapló séma (hivas/email/talalkozo/megjegyzes) + „legutóbbiak" lekérdezés. |
| `leads.ts` | Lead sémák + fetcherek + hookok; `convertLeadToOpp` handoff. |
| `opportunities.ts` | Opportunity sémák + fetcherek + hookok; `createQuoteFromOpp` handoff-csonk. |
| `tasks.ts` | SLA-figyelt feladatok + teljesítés. |

## FSM-ek (terv 5. pont — kanonikus)

- **Lead:** `uj → kapcsolat → minosites → nurturing → konvertalva` (+`elvetve`).
  Konvertálás `minosites`-ből és `nurturing`-ból; elvetés bármely nyitott állapotból.
- **Opportunity:** `nyitott → igenyfelmeres → osszeallitas → ajanlat → targyalas →
  megnyert | elveszett`; győzelmi valószínűségek: 10/25/40/55/80/100/0%.

**Backend-gap:** a `SpaceOS.Modules.CRM` Lead domain FSM-je
(`New→Contacted→Qualified→Opportunity`, +`Disqualified`) NEM tartalmaz
`nurturing` állapotot — a UI-ra a terv a kanonikus; a backend-follow-up a
`docs/tasks/EPIC-UI-PORTAL-2026Q3/F2-CRM-FE.md`-ben dokumentált.

## Szabályok

Az EHS README szabályai érvényesek (séma=kontraktus, FSM-akció=dedikált végpont,
tiltott akció nem rejtett, optimista frissítés determinisztikus célállapotnál,
toast a hookban, MSW-tükör közös guardokkal → 409).
