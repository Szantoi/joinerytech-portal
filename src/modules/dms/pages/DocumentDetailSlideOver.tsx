import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  DOCUMENT_FSM, daysUntilExpiry, dmsManageBlockReason, rejectReasonBlockReason,
  todayIso, transitionBlockReason, uploadVersionBlockReason, useDmsPermissions,
  useDocument, useDocumentTransition, useUploadVersion, versionFieldsBlockReason,
  type DocumentAction, type DocumentStatus,
} from '../services'
import type { DmsDocument } from '../services/documents'
import {
  DOCUMENT_ACTION_LABELS, DOCUMENT_MAIN_PATH, DOCUMENT_STATUS_LABELS,
  DOC_LINK_LABELS, DOC_TYPE_META, EXPIRY_META,
  formatDate, formatDateTime, formatExpiryDays,
} from './labels'

/**
 * Dokumentum-részletek — FSM stepper (piszkozat → ellenőrzés → kiadott,
 * archivált mellékág), érvényes-verzió sáv (runtimeVersion-tükör: a műhely a
 * kiadott verziót használja), metaadatok, verziótörténet-idővonal (soronkénti
 * aria-labellel, a kiadott verzió jelölésével), átmenet-gombsor — tiltott
 * akció `disabledReason`-nel (aria-disabled + tooltip, SOSEM rejtett),
 * indok-lánc: folyamatban → dms.manage → FSM-guard. Űrlapos akciók:
 * jóváhagyás (opcionális megjegyzés), visszautasítás (KÖTELEZŐ indok —
 * rejectReasonBlockReason a beküldés-guardban ÉS az MSW 400-ában),
 * felülvizsgálat (opcionális indok), új verzió feltöltése (fájl-címke +
 * változás-jegyzet kötelező; archiváltnál 409-tükör gomb-tiltás; rule-6:
 * a mutáció a listát ÉS a detailt is frissíti).
 */

const inputCls =
  'h-8 w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring'
const labelCls = 'block text-[11px] font-medium text-ink'
const formCls = 'mt-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3'

// ── Érvényes (kiadott) verzió sáv — releasedVersionInfo megjelenítése ────────

function ReleasedVersionBanner({ doc }: { doc: DmsDocument }) {
  // a releasedVersion SZÁMÍTOTT mező a válaszból — a kliens nem számolja újra
  if (doc.status === 'kiadott') {
    return (
      <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[11.5px] text-ink">
        A kiadott <span className="font-semibold">v{doc.version}</span> az érvényes — a műhely ezt használja.
      </div>
    )
  }
  if (doc.releasedVersion !== null) {
    return (
      <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[11.5px] text-ink">
        A műhely a kiadott <span className="font-semibold">v{doc.releasedVersion}</span>-t használja —{' '}
        v{doc.version} ({DOCUMENT_STATUS_LABELS[doc.status]}) kiadásra vár.
      </div>
    )
  }
  return (
    <div role="note" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
      Nincs kiadott verzió — a dokumentum a gyártásban nem használható.
    </div>
  )
}

// ── Átmenet-panel (jóváhagyás-folyam + verzió-feltöltés) ────────────────────

function DocumentTransitionPanel({ doc }: { doc: DmsDocument }) {
  const transition = useDocumentTransition()
  const upload = useUploadVersion()
  const { canManage } = useDmsPermissions()
  const [activeForm, setActiveForm] = useState<'approve' | 'reject' | 'recall' | 'version' | null>(null)
  const [approveNote, setApproveNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [recallReason, setRecallReason] = useState('')
  const [versionFile, setVersionFile] = useState('')
  const [versionNote, setVersionNote] = useState('')

  const status: DocumentStatus = doc.status
  const pendingReason = transition.isPending || upload.isPending ? 'Folyamatban…' : undefined
  const manageReason = dmsManageBlockReason(canManage)

  /** Indok-lánc: folyamatban → jogosultság → FSM-guard. */
  const blockReason = (action: DocumentAction): string | undefined =>
    pendingReason ??
    manageReason ??
    transitionBlockReason(DOCUMENT_FSM, action, status, DOCUMENT_STATUS_LABELS)

  const closeForm = () => {
    setActiveForm(null)
    setApproveNote('')
    setRejectReason('')
    setRecallReason('')
    setVersionFile('')
    setVersionNote('')
  }

  const mutate = (action: DocumentAction, payload: Record<string, string | undefined>) =>
    transition.mutate({ id: doc.id, action, payload }, { onSuccess: closeForm })

  /** Űrlapos akció gombja: kapcsoló, a tiltás-indok a sima gombéval azonos. */
  const formToggle = (form: 'approve' | 'reject' | 'recall', action: DocumentAction) => (
    <Button key={action} size="sm" variant={activeForm === form ? 'primary' : 'secondary'}
      disabledReason={blockReason(action)}
      onClick={() => setActiveForm((f) => (f === form ? null : form))}>
      {DOCUMENT_ACTION_LABELS[action]}
    </Button>
  )

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabledReason={blockReason('submit')}
          onClick={() => mutate('submit', {})}>
          {DOCUMENT_ACTION_LABELS.submit}
        </Button>
        {formToggle('approve', 'approve')}
        {formToggle('reject', 'reject')}
        {formToggle('recall', 'recall')}
        <Button size="sm" variant="secondary" disabledReason={blockReason('archive')}
          onClick={() => mutate('archive', {})}>
          {DOCUMENT_ACTION_LABELS.archive}
        </Button>
        <Button size="sm" variant="secondary" disabledReason={blockReason('reopen')}
          onClick={() => mutate('reopen', {})}>
          {DOCUMENT_ACTION_LABELS.reopen}
        </Button>
        {/* verzió-feltöltés: nem FSM-akció — saját státusz-guard (AddVersion-tükör) */}
        <Button size="sm" variant={activeForm === 'version' ? 'primary' : 'secondary'}
          disabledReason={pendingReason ?? manageReason ?? uploadVersionBlockReason(status)}
          onClick={() => setActiveForm((f) => (f === 'version' ? null : 'version'))}>
          Új verzió feltöltése
        </Button>
      </div>

      {/* Jóváhagyás: opcionális megjegyzés (a reviewNote-ba kerül) */}
      {activeForm === 'approve' && (
        <form className={formCls}
          onSubmit={(e) => {
            e.preventDefault()
            mutate('approve', { note: approveNote.trim() || undefined })
          }}>
          <label className={labelCls} htmlFor="dms-approve-note">Megjegyzés (opcionális)</label>
          <input id="dms-approve-note" value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabledReason={pendingReason}>
              Jóváhagyás megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Visszautasítás: KÖTELEZŐ indok — a beküldés-guard az MSW 400 tükre */}
      {activeForm === 'reject' && (
        <form className={formCls}
          onSubmit={(e) => {
            e.preventDefault()
            mutate('reject', { reason: rejectReason.trim() })
          }}>
          <label className={labelCls} htmlFor="dms-reject-reason">
            Visszautasítás indoka <span aria-hidden="true">*</span>
          </label>
          <input id="dms-reject-reason" value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive"
              disabledReason={rejectReasonBlockReason(rejectReason) ?? pendingReason}>
              Visszautasítás megerősítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Felülvizsgálat: opcionális indok — a kiadott visszakerül ellenőrzésre */}
      {activeForm === 'recall' && (
        <form className={formCls}
          onSubmit={(e) => {
            e.preventDefault()
            mutate('recall', { reason: recallReason.trim() || undefined })
          }}>
          <label className={labelCls} htmlFor="dms-recall-reason">Felülvizsgálat indoka (opcionális)</label>
          <input id="dms-recall-reason" value={recallReason}
            onChange={(e) => setRecallReason(e.target.value)} className={inputCls} />
          <p className="text-[11px] text-ink-muted">
            A dokumentum visszakerül ellenőrzésre — a műhely a korábbi kiadott verziót használja.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabledReason={pendingReason}>
              Felülvizsgálat indítása
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}

      {/* Új verzió: fájl-címke + változás-jegyzet kötelező (versionFieldsBlockReason) */}
      {activeForm === 'version' && (
        <form className={formCls}
          onSubmit={(e) => {
            e.preventDefault()
            upload.mutate(
              { id: doc.id, input: { fileLabel: versionFile.trim(), note: versionNote.trim() } },
              { onSuccess: closeForm },
            )
          }}>
          <div className="text-[11px] font-semibold text-ink">
            Új verzió (v{doc.version + 1}) — a korábbi verziók megőrződnek
          </div>
          <div>
            <label className={labelCls} htmlFor="dms-version-file">
              Fájl-címke <span aria-hidden="true">*</span>
            </label>
            <input id="dms-version-file" value={versionFile}
              onChange={(e) => setVersionFile(e.target.value)} className={inputCls}
              placeholder="pl. doorstar-ajto-gyartasi-v3.pdf" />
          </div>
          <div>
            <label className={labelCls} htmlFor="dms-version-note">
              Változás-jegyzet <span aria-hidden="true">*</span>
            </label>
            <input id="dms-version-note" value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm"
              disabledReason={versionFieldsBlockReason(versionFile, versionNote) ?? pendingReason}>
              Verzió rögzítése
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={closeForm}>Mégse</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── SlideOver ───────────────────────────────────────────────────────────────

export function DocumentDetailSlideOver({
  documentId, onClose,
}: {
  documentId: string | null
  onClose: () => void
}) {
  const { data: doc, isPending, isError } = useDocument(documentId)
  if (documentId === null) return null

  const expiryDays = doc ? daysUntilExpiry(doc.validUntil, todayIso()) : null

  return (
    <SlideOver open onClose={onClose} title={doc?.name ?? documentId}
      subtitle={doc ? `${doc.id} · ${doc.owner}` : undefined}
      width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A dokumentum betöltése nem sikerült.</p>}

        {doc && (
          <>
            <FsmStepper
              label="Dokumentum állapota"
              steps={DOCUMENT_MAIN_PATH}
              currentKey={doc.status}
              sideLabel={DOCUMENT_STATUS_LABELS[doc.status]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="dmsDokumentum" status={doc.status} label={DOCUMENT_STATUS_LABELS[doc.status]} />
              <StatusPill size="sm" tone={DOC_TYPE_META[doc.type].tone} label={DOC_TYPE_META[doc.type].label} />
              {doc.expiry && (
                <StatusPill size="sm" tone={EXPIRY_META[doc.expiry].tone} label={EXPIRY_META[doc.expiry].label} />
              )}
            </div>

            <ReleasedVersionBanner doc={doc} />

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: 'Kapcsolat', val: `${DOC_LINK_LABELS[doc.linkType]} · ${doc.linkLabel}` },
                { label: 'Felelős', val: doc.owner },
                { label: 'Aktuális verzió', val: `v${doc.version}` },
                { label: 'Frissítve', val: formatDate(doc.updatedAt) },
                {
                  label: 'Érvényesség',
                  val: doc.validUntil
                    ? `${formatDate(doc.validUntil)} (${formatExpiryDays(expiryDays)})`
                    : 'nem jár le',
                },
                { label: 'Fájl', val: doc.fileLabel },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</div>
                  <div className="break-words text-ink">{f.val}</div>
                </div>
              ))}
            </div>

            {doc.note && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Leírás:</span> {doc.note}
              </div>
            )}

            {doc.reviewNote && (
              <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-ink-muted">
                <span className="font-medium text-ink">Utolsó átmenet megjegyzése:</span> {doc.reviewNote}
              </div>
            )}

            {/* Verziótörténet — a lánc megőrzött, a kiadott (érvényes) verzió jelölt */}
            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Verziótörténet ({doc.versions.length})
              </div>
              <ul aria-label="Verziótörténet" className="space-y-1.5">
                {[...doc.versions].sort((a, b) => b.v - a.v).map((entry) => (
                  <li
                    key={entry.v}
                    aria-label={`v${entry.v} — ${DOCUMENT_STATUS_LABELS[entry.status]}: ${entry.note}`}
                    className="rounded-lg bg-surface-2/60 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-ink">v{entry.v}</span>
                      <StatusPill size="sm" fsm="dmsDokumentum" status={entry.status}
                        label={DOCUMENT_STATUS_LABELS[entry.status]} />
                      {doc.releasedVersion === entry.v && (
                        <StatusPill size="sm" tone="success" label="Érvényes (kiadott) verzió" />
                      )}
                      <span className="ml-auto font-mono text-[10.5px] text-ink-muted">
                        {formatDateTime(entry.uploadedAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink">{entry.note}</div>
                    <div className="text-[10.5px] text-ink-muted">
                      {entry.fileLabel} · {entry.uploadedBy}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <DocumentTransitionPanel doc={doc} />
          </>
        )}
      </div>
    </SlideOver>
  )
}
