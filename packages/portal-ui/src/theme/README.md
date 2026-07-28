# `src/theme/` — Design-system futásidejű réteg

A `docs/knowledge/patterns/DESIGN_SYSTEM_SPEC_V1.md` TS-oldali implementációja
(EPIC-UI-PORTAL-2026Q3 / F1-A). A CSS-oldali párja a `src/index.css`
tokenblokk (`@theme inline` + `:root` / `.dark` / `[data-world]`).

| Fájl | Tartalom |
|---|---|
| `statusTones.ts` | `Tone` (7 szemantikus tónus), `STATUS_TONES` (light+dark osztályok), legacy kulcs-térkép + `resolveLegacyTone` |
| `fsmTones.ts` | `FSM_TONES` (8 modul-FSM státusz → tónus), átmeneti angol→kanonikus alias-ok, `resolveFsmTone` |
| `worldAccents.ts` | portál világ-kulcs → `data-world` attribútum (quality→qa, docs→dms) |
| `useTheme.ts` | `jt-theme` localStorage preferencia (light/dark/system), `.dark` class kezelés, `useTheme` hook |

## Használat

```tsx
// Státusz-pill (FSM-készletből feloldva)
<StatusPill fsm="ehsBaleset" status={incident.status} label={INCIDENT_STATUS_META[incident.status].label} />

// Közvetlen tónussal
<StatusPill tone="success" label="Kész" />

// Világ-akcent bekötés (WorldShell gyökér)
<div data-world={WORLD_DATA_ATTR[worldKey]}>…</div>

// Téma
const { preference, isDark, setPreference } = useTheme()
```

Szabályok:

- Komponens NEM használ nyers palettát felület-színre — csak szemantikus
  utility-t (`bg-surface-1`, `text-ink`, `bg-world`, …). `dark:` variáns csak
  escape hatch (spec 4.2).
- Ismeretlen státusz → `neutral` tónus + `console.warn` dev módban.
- Az `FSM_STATUS_ALIASES` / `FSM_EXTRA_TONES` átmenetiek: az enum-kanonizáció
  (root-döntés, ld. UI_GAP_ANALYSIS 7.2) után törlendők.

Tesztek: `src/theme/__tests__/`.
