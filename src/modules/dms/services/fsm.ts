import type { FsmRule } from '../../../services/fsmGuards'

/**
 * DMS dokumentum-életciklus FSM — a prototípus DOC_FLOW tükre
 * (docs/joinerytech/data-docs.js; a spec fsmTones `dmsDokumentum` kanonikus
 * kulcsaival):
 *
 *    Akció                          átmenet
 *    ────────────────────────────   ─────────────────────────────
 *    submit  (ellenőrzésre küldés)  piszkozat  → ellenorzes
 *    approve (jóváhagyás — kiadás)  ellenorzes → kiadott
 *    reject  (visszautasítás)       ellenorzes → piszkozat
 *    recall  (felülvizsgálat)       kiadott    → ellenorzes
 *    archive (archiválás)           piszkozat | kiadott → archivalt
 *    reopen  (újranyitás)           archivalt  → piszkozat
 *
 * MEGJEGYZÉS (backend-gap, F2-DMS-FE): a backend src/dms Document aggregátum
 * életciklusa Active/Archived/Deleted — jóváhagyás-folyam (ellenőrzés/kiadás)
 * NINCS a backendben, és a Document-magnak futtatható endpoint-rétege sincs.
 * A feladat-kiírás szerint ilyenkor a prototípus az irányadó, az MSW-kontraktus
 * a rögzítendő előkép; a backend archive/unarchive/restore hármas ↔ kliens
 * archive/reopen megfeleltetése follow-up ADR.
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre).
 */

/** Kanonikus kulcsok (fsmTones `dmsDokumentum` — a spec 1.5 készlete). */
export type DocumentStatus = 'piszkozat' | 'ellenorzes' | 'kiadott' | 'archivalt'

export const DOCUMENT_FSM = {
  submit: { from: ['piszkozat'], to: 'ellenorzes' },
  approve: { from: ['ellenorzes'], to: 'kiadott' },
  reject: { from: ['ellenorzes'], to: 'piszkozat' },
  recall: { from: ['kiadott'], to: 'ellenorzes' },
  // a prototípus szerint ellenőrzés ALATT nem archiválható (előbb döntés kell)
  archive: { from: ['piszkozat', 'kiadott'], to: 'archivalt' },
  reopen: { from: ['archivalt'], to: 'piszkozat' },
} as const satisfies Record<string, FsmRule<DocumentStatus>>

export type DocumentAction = keyof typeof DOCUMENT_FSM

/** A fő (jóváhagyási) lánc állapotai sorrendben — FsmStepperhez; archivalt mellékág. */
export const DOCUMENT_MAIN_PATH_STATUSES = [
  'piszkozat', 'ellenorzes', 'kiadott',
] as const satisfies readonly DocumentStatus[]

/**
 * Munkában lévő (jóváhagyásra váró vagy szerkesztett) státuszok — a dashboard
 * „folyamatban" jellegű KPI-inak nevesített guardja (isTicketOpen-minta).
 */
export const DOCUMENT_WORKFLOW_OPEN_STATUSES = [
  'piszkozat', 'ellenorzes',
] as const satisfies readonly DocumentStatus[]

export function isDocumentWorkflowOpen(status: DocumentStatus): boolean {
  return (DOCUMENT_WORKFLOW_OPEN_STATUSES as readonly DocumentStatus[]).includes(status)
}

/** Jóváhagyásra vár — a dashboard „Ellenőrzésre vár" KPI nevesített guardja. */
export function isDocumentInReview(status: DocumentStatus): boolean {
  return status === 'ellenorzes'
}

/**
 * Új verzió feltöltésének FSM-en TÚLI guardja — a backend `AddVersion()` tükre
 * (Deleted státuszon tilos; a kliens-életciklusban az archivalt az analóg
 * lezárt állapot). A UI (Button disabledReason) és az MSW (409) közös feltétele.
 */
export function uploadVersionBlockReason(status: DocumentStatus): string | undefined {
  return status === 'archivalt'
    ? 'Archivált dokumentumhoz nem tölthető fel új verzió — előbb nyisd újra.'
    : undefined
}

/**
 * A visszautasítás (reject) payload-guardja — indok nélkül nem utasítható
 * vissza (a QA reject-precedens: az indok a felülvizsgálati napló része).
 * A UI (beküldés-gomb disabledReason) és az MSW (400) közös feltétele.
 */
export function rejectReasonBlockReason(reason: string): string | undefined {
  return reason.trim() !== ''
    ? undefined
    : 'A visszautasításhoz kötelező az indok megadása.'
}

/**
 * Az új verzió payload-guardja — fájl-címke és változás-jegyzet nélkül nem
 * rögzíthető verzió (a verzió-lánc auditálhatóságának feltétele; a backend
 * DocumentVersion.ChangeNotes tükre). UI-beküldés + MSW 400 közös feltétele.
 */
export function versionFieldsBlockReason(fileLabel: string, note: string): string | undefined {
  if (fileLabel.trim() === '') return 'Add meg az új verzió fájl-címkéjét.'
  if (note.trim() === '') return 'Add meg, mi változott az új verzióban (változás-jegyzet).'
  return undefined
}

// Guard helperek — közös, modul-független implementáció (services/fsmGuards).
export { canTransition, transitionBlockReason, type FsmRule } from '../../../services/fsmGuards'
