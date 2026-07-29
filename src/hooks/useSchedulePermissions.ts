import { useAuth } from '../auth'

/**
 * Kiosztási jogosultság — üzemi szerepek (PLAN-05 F6).
 *
 * A hook modellje jó volt: üzemvezető a teljes 1-10 skálát adhatja, gépkezelő
 * 5-ig. A hiba a szerep-SZŰRŐBEN volt (`parseUserClaims`), ami ezt a két
 * szerepet kiejtette — így a `canAssignBatches` mindig false lett, és a
 * képernyő MINDENKINEK csak-olvashatóként működött. Addig rejtve maradt, amíg
 * a lap nem volt beroutolva, a teszt pedig közvetlenül a `roles` kimenetet
 * mockolta, megkerülve a szűrőt.
 */
export function useSchedulePermissions() {
  const { roles } = useAuth()

  // Az Admin kimondva szerepel: eddig sehol nem volt benne, pedig a mátrix
  // szerint oszthat — enélkül egy adminisztrátornak külön üzemi szerep kellene
  // ahhoz, hogy dolgozni tudjon a képernyőn.
  const canAssignBatches = roles.includes('Admin') ||
                           roles.includes('production_manager') ||
                           roles.includes('machine_operator')

  const maxPriority = roles.includes('Admin') || roles.includes('production_manager') ? 10 : 5

  const isReadOnly = !canAssignBatches

  return {
    canAssignBatches,
    maxPriority,
    isReadOnly
  }
}
