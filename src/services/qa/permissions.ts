/**
 * qa.manage jogosultság — UI-STUB az auth-bekötésig
 * (a services/maintenance/permissions.ts mintája).
 *
 * Az átvizsgálás- és hibajegy-átmenetek (start/pass/fail, assign/resolve/
 * reject/reopen/escalate) `qa.manage` joghoz kötöttek. A portálban még nincs
 * claim-forrás — addig ez a modul A kapcsolódási pont:
 *  - a UI kizárólag a `useQaPermissions()` hookon át kérdezi a jogot,
 *  - auth-bekötéskor CSAK ennek a hooknak a belsejét kell átírni,
 *  - a stub alapértéke `true` (dev-ben minden akció kipróbálható); tesztben a
 *    `qaPermissionStub.manage` átállításával a tiltott ág is fedhető.
 *
 * A tiltott akció NEM tűnik el: aria-disabled + tooltip (plan 3. vezérelv),
 * a `qaManageBlockReason` a Button `disabledReason`-jába megy.
 */

export const QA_MANAGE_PERMISSION = 'qa.manage'

/** Mutálható stub — auth-bekötésig az egyetlen jogosultság-forrás. */
export const qaPermissionStub = { manage: true }

export function useQaPermissions(): { canManage: boolean } {
  // TODO(auth): claim-alapú feloldás az auth-kontextusból (stub kivezetése).
  return { canManage: qaPermissionStub.manage }
}

/** Tiltott manage-akció indoka (Button disabledReason), engedélyezettnél undefined. */
export function qaManageBlockReason(canManage: boolean): string | undefined {
  return canManage ? undefined : `Ehhez „${QA_MANAGE_PERMISSION}" jogosultság szükséges.`
}
