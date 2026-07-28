/**
 * maintenance.manage jogosultság — UI-STUB az auth-bekötésig
 * (a services/hr/permissions.ts mintája).
 *
 * A prototípus szerint a munkalap-átmenetek és a felelős-hozzárendelés
 * `maintenance.manage` joghoz kötöttek. A portálban még nincs claim-forrás —
 * addig ez a modul A kapcsolódási pont:
 *  - a UI kizárólag a `useMaintenancePermissions()` hookon át kérdezi a jogot,
 *  - auth-bekötéskor CSAK ennek a hooknak a belsejét kell átírni,
 *  - a stub alapértéke `true` (dev-ben minden akció kipróbálható); tesztben a
 *    `maintenancePermissionStub.manage` átállításával a tiltott ág is fedhető.
 *
 * A tiltott akció NEM tűnik el: aria-disabled + tooltip (plan 3. vezérelv),
 * a `maintenanceManageBlockReason` a Button `disabledReason`-jába megy.
 */

export const MAINTENANCE_MANAGE_PERMISSION = 'maintenance.manage'

/** Mutálható stub — auth-bekötésig az egyetlen jogosultság-forrás. */
export const maintenancePermissionStub = { manage: true }

export function useMaintenancePermissions(): { canManage: boolean } {
  // TODO(auth): claim-alapú feloldás az auth-kontextusból (stub kivezetése).
  return { canManage: maintenancePermissionStub.manage }
}

/** Tiltott manage-akció indoka (Button disabledReason), engedélyezettnél undefined. */
export function maintenanceManageBlockReason(canManage: boolean): string | undefined {
  return canManage ? undefined : `Ehhez „${MAINTENANCE_MANAGE_PERMISSION}" jogosultság szükséges.`
}
