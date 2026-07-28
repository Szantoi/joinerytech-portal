/**
 * hr.manage jogosultság — UI-STUB az auth-bekötésig.
 *
 * A terv szerint a távollét jóváhagyás/elutasítás `hr.manage` jogosultsághoz
 * kötött. A portálban még nincs igazi claim-forrás (az auth-kontextus csak
 * role-listát ad) — addig ez a modul A kapcsolódási pont:
 *  - a UI kizárólag a `useHrPermissions()` hookon át kérdezi a jogot,
 *  - az auth-bekötéskor CSAK ennek a hooknak a belsejét kell átírni
 *    (pl. `useAuth().permissions.includes(HR_MANAGE_PERMISSION)`),
 *  - a stub alapértéke `true` (dev-ben minden akció kipróbálható); tesztben
 *    a `hrPermissionStub.manage` átállításával a tiltott ág is fedhető.
 *
 * A tiltott akció NEM tűnik el: aria-disabled + tooltip (plan 3. vezérelv),
 * a `manageBlockReason` a Button `disabledReason`-jába megy.
 */

export const HR_MANAGE_PERMISSION = 'hr.manage'

/** Mutálható stub — auth-bekötésig az egyetlen jogosultság-forrás. */
export const hrPermissionStub = { manage: true }

export function useHrPermissions(): { canManage: boolean } {
  // TODO(auth): claim-alapú feloldás az auth-kontextusból (hrPermissionStub kivezetése).
  return { canManage: hrPermissionStub.manage }
}

/** Tiltott manage-akció indoka (Button disabledReason), engedélyezettnél undefined. */
export function manageBlockReason(canManage: boolean): string | undefined {
  return canManage ? undefined : `Ehhez „${HR_MANAGE_PERMISSION}" jogosultság szükséges.`
}
