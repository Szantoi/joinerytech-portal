/**
 * dms.manage jogosultság — UI-STUB az auth-bekötésig
 * (a services/qa/permissions.ts mintája).
 *
 * A dokumentum-átmenetek (submit/approve/reject/recall/archive/reopen) és az
 * új verzió feltöltése `dms.manage` joghoz kötöttek. A portálban még nincs
 * claim-forrás — addig ez a modul A kapcsolódási pont:
 *  - a UI kizárólag a `useDmsPermissions()` hookon át kérdezi a jogot,
 *  - auth-bekötéskor CSAK ennek a hooknak a belsejét kell átírni,
 *  - a stub alapértéke `true` (dev-ben minden akció kipróbálható); tesztben a
 *    `dmsPermissionStub.manage` átállításával a tiltott ág is fedhető.
 *
 * A tiltott akció NEM tűnik el: aria-disabled + tooltip (plan 3. vezérelv),
 * a `dmsManageBlockReason` a Button `disabledReason`-jába megy.
 */

export const DMS_MANAGE_PERMISSION = 'dms.manage'

/** Mutálható stub — auth-bekötésig az egyetlen jogosultság-forrás. */
export const dmsPermissionStub = { manage: true }

export function useDmsPermissions(): { canManage: boolean } {
  // TODO(auth): claim-alapú feloldás az auth-kontextusból (stub kivezetése).
  return { canManage: dmsPermissionStub.manage }
}

/** Tiltott manage-akció indoka (Button disabledReason), engedélyezettnél undefined. */
export function dmsManageBlockReason(canManage: boolean): string | undefined {
  return canManage ? undefined : `Ehhez „${DMS_MANAGE_PERMISSION}" jogosultság szükséges.`
}
