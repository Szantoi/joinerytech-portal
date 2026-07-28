/**
 * ÁTMENETI dolgozó-névtár az EHS UI-hoz.
 *
 * A backend EHS API dolgozó-hivatkozásai (reportedBy, assignedTo, conductedBy…)
 * EmployeeId UUID-k (HR modul FK). Amíg a HR modul lookup-végpontja nincs bekötve
 * a portálba, ez a konfigurációs névtár oldja fel a neveket — az EHS MSW seed
 * ugyanezeket az azonosítókat használja, így dev-ben konzisztens a megjelenítés.
 */

export interface EhsEmployee {
  id: string
  name: string
}

export const EHS_EMPLOYEE_DIRECTORY: EhsEmployee[] = [
  { id: '00000000-0000-4000-8000-00000000e001', name: 'Nagy János' },
  { id: '00000000-0000-4000-8000-00000000e002', name: 'Tóth Kinga' },
  { id: '00000000-0000-4000-8000-00000000e003', name: 'Kiss András' },
  { id: '00000000-0000-4000-8000-00000000e004', name: 'Horváth Éva' },
  { id: '00000000-0000-4000-8000-00000000e005', name: 'Gábor Márton' },
  { id: '00000000-0000-4000-8000-00000000e006', name: 'Varga László' },
]

/** A bejelentkezett felhasználó dolgozó-azonosítója (demo — auth-integrációig). */
export const CURRENT_EMPLOYEE_ID = EHS_EMPLOYEE_DIRECTORY[4].id

/** UUID → név feloldás; ismeretlen azonosítóra rövidített UUID-t ad vissza. */
export function employeeName(id: string | null | undefined): string {
  if (!id) return '—'
  return EHS_EMPLOYEE_DIRECTORY.find((e) => e.id === id)?.name ?? id.slice(0, 8)
}
