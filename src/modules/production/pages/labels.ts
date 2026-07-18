import type { Tone } from '../../../theme/statusTones'
import type {
  CuttingPlanAction, DoorOrderAction, ExecutionAction, QuoteAction,
} from '../services/fsm'
import type {
  CancelReason, CuttingPlanStatus, DoorOrderStatus, ExecutionStatus,
  MilestoneKind, MilestoneStatus, ProgressEventKind, ProofLevel, QuoteStatus,
} from '../services/wire'

/**
 * Production UI címke-térképek — a wire-kulcsok (angol tagnév, wire.ts)
 * MAGYAR megjelenítése, a wire-alaktól elválasztva (ADR-059 elv: a címke a
 * view-rétegé, a kulcs a dróté). A tónusok lokális Tone-térképek (a
 * theme/fsmTones 1.5-ös spec-készletei production-FSM-eket még nem
 * definiálnak — designer follow-up, QA TICKET_STATUS_META precedens).
 */

// ── Vágóterv (CuttingPlan) ──────────────────────────────────────────────────

export const PLAN_STATUS_META: Record<CuttingPlanStatus, { label: string; tone: Tone }> = {
  Draft: { label: 'Vázlat', tone: 'neutral' },
  Published: { label: 'Publikált', tone: 'info' },
  Frozen: { label: 'Fagyasztott', tone: 'progress' },
  Closed: { label: 'Lezárt', tone: 'terminal' },
}

export const PLAN_ACTION_LABELS: Record<CuttingPlanAction, string> = {
  publish: 'Publikálás',
  freeze: 'Fagyasztás',
  close: 'Lezárás',
}

// ── Végrehajtás (CuttingExecution) ──────────────────────────────────────────

export const EXECUTION_STATUS_META: Record<ExecutionStatus, { label: string; tone: Tone }> = {
  Scheduled: { label: 'Ütemezett', tone: 'info' },
  Started: { label: 'Elindítva', tone: 'progress' },
  InProgress: { label: 'Folyamatban', tone: 'progress' },
  Completed: { label: 'Kész', tone: 'success' },
  Cancelled: { label: 'Megszakítva', tone: 'terminal' },
  Failed: { label: 'Hibára futott', tone: 'danger' },
}

export const EXECUTION_ACTION_LABELS: Record<ExecutionAction, string> = {
  start: 'Indítás',
  progress: 'Panel készre jelentése',
  complete: 'Lezárás bizonylattal',
  cancel: 'Megszakítás',
}

export const PROGRESS_KIND_LABELS: Record<ProgressEventKind, string> = {
  PanelStarted: 'Panel megkezdve',
  PanelCompleted: 'Panel kész',
  MaterialLoaded: 'Anyag betöltve',
  MachineEvent: 'Gépesemény',
}

export const MILESTONE_KIND_LABELS: Record<MilestoneKind, string> = {
  PanelCompletion: 'Panel-teljesítés',
  TimeWindow: 'Időablak',
  QualityCheck: 'Minőség-ellenőrzés',
  WorkerConsent: 'Dolgozói hozzájárulás',
}

export const MILESTONE_STATUS_META: Record<MilestoneStatus, { label: string; tone: Tone }> = {
  Pending: { label: 'Függőben', tone: 'neutral' },
  Met: { label: 'Teljesült', tone: 'success' },
  Expired: { label: 'Lejárt', tone: 'warn' },
}

export const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  OperatorCancelled: 'Gépkezelő szakította meg',
  MaterialShortage: 'Anyaghiány',
  MachineFault: 'Géphiba',
  SystemCancelled: 'Rendszer szakította meg',
}

export const PROOF_LEVEL_LABELS: Record<ProofLevel, string> = {
  HashOnly: 'Csak hash',
  SignedEvidence: 'Aláírt bizonylat',
  PhotoEvidence: 'Fotós bizonylat',
}

// ── Ajtórendelés (DoorOrder) ────────────────────────────────────────────────

export const DOOR_ORDER_STATUS_META: Record<DoorOrderStatus, { label: string; tone: Tone }> = {
  Draft: { label: 'Vázlat', tone: 'neutral' },
  ConfirmedFromSales: { label: 'Sales-ből megerősítve', tone: 'info' },
  Submitted: { label: 'Beadva', tone: 'info' },
  Calculating: { label: 'Kalkuláció fut', tone: 'progress' },
  Calculated: { label: 'Kalkulálva', tone: 'success' },
  CalculationFailed: { label: 'Kalkuláció hibás', tone: 'danger' },
  // ⚠ backend-elérhetetlen állapotok (fsm.ts UNREACHABLE) — csak megjelenítés
  InProduction: { label: 'Gyártásban', tone: 'progress' },
  Completed: { label: 'Elkészült', tone: 'success' },
  Cancelled: { label: 'Törölve', tone: 'terminal' },
}

export const DOOR_ORDER_ACTION_LABELS: Record<DoorOrderAction, string> = {
  submit: 'Beadás kalkulációra',
  revert: 'Visszavonás vázlatba',
  markCalculating: 'Kalkuláció indult',
  markCalculated: 'Kalkuláció kész',
  markCalculationFailed: 'Kalkuláció hibás',
}

/** A backendben elérhetetlen lánc-szakasz tooltipje (P6 gap-jelölés). */
export const DOOR_ORDER_UNREACHABLE_HINT =
  'A backendben ehhez az állapothoz ma nincs átmenet (DoorOrder FSM-hiány, ' +
  'kontraktus-doksi P6) — a szakasz nem érhető el, follow-up a hiány-listában.'

// ── Árajánlat (CuttingQuoteRequest) ─────────────────────────────────────────

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: Tone }> = {
  PendingReview: { label: 'Döntésre vár', tone: 'warn' },
  Quoted: { label: 'Ajánlat kiküldve', tone: 'info' },
  ConvertedToOrder: { label: 'Rendeléssé alakult', tone: 'success' },
  Rejected: { label: 'Elutasítva', tone: 'terminal' },
}

export const QUOTE_ACTION_LABELS: Record<QuoteAction, string> = {
  approve: 'Ajánlat jóváhagyása',
  reject: 'Elutasítás',
  convert: 'Rendeléssé alakítás (ügyfél-oldali)',
}

// ── Formázók ────────────────────────────────────────────────────────────────

/** ISO időbélyeg / nap-kulcs → rövid magyar dátum (év.hó.nap [óó:pp]). */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const day = iso.slice(0, 10).replaceAll('-', '.')
  const time = iso.length > 10 ? ` ${iso.slice(11, 16)}` : ''
  return `${day}.${time}`
}

/** Szám → magyar ezres-tagolás (nem törő szóközzel). */
export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString('hu-HU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** Pénzösszeg formázása a wire-ből jövő devizával. */
export function formatMoney(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}
