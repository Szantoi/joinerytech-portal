/**
 * fsmGuards — generikus (modul-független) FSM guard helperek.
 *
 * A services/ehs/fsm.ts-ben bevált mintából kiemelve: az átmenet-táblák
 * modulonként élnek (services/{modul}/fsm.ts), de a guard-logika közös.
 * Ugyanazt a táblát használja a UI (Button disabledReason) és az MSW mock
 * (tiltott átmenet → 409) — egy igazságforrás.
 *
 * MEGJEGYZÉS: a services/ehs/fsm.ts saját (azonos) helper-példányt hordoz;
 * az EHS designer-review lezárta a fájlokat — az átállása follow-up feladat.
 */

/** Átmenet-szabály: melyik akció melyik állapot(ok)ból indítható. */
export interface FsmRule<S extends string> {
  /** Megengedett kiinduló állapotok. */
  from: readonly S[]
  /** Célállapot. */
  to: S
}

/** Indítható-e az akció az adott állapotból. */
export function canTransition<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
): boolean {
  const rule = fsm[action]
  return rule !== undefined && rule.from.includes(status)
}

/**
 * Tiltott átmenet indoka (Button `disabledReason`-höz), engedélyezettnél undefined.
 * A `statusLabels` a hívó modul lokalizált címkéi — így ez a réteg nyelvfüggetlen.
 */
export function transitionBlockReason<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
  statusLabels: Record<S, string>,
): string | undefined {
  if (canTransition(fsm, action, status)) return undefined
  const rule = fsm[action]
  const fromLabels = rule ? rule.from.map((s) => `„${statusLabels[s]}"`).join(' vagy ') : '?'
  return `Csak ${fromLabels} státuszból indítható — jelenlegi: „${statusLabels[status]}".`
}
