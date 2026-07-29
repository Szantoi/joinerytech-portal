import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { STATUS_TONES } from '../../theme/statusTones'
import { useFocusTrap } from './hooks/useFocusTrap'
import { useInertBackground } from './hooks/useInertBackground'
import { ConfirmContext, type ConfirmOptions } from './confirmContext'

/**
 * ConfirmDialog + ConfirmProvider — promise-alapú megerősítés (PLAN-05 F3).
 *
 * Provenance: a doorstar-instance ConfirmDialog/useConfirm mintája, a portál
 * fókuszkezelésével (useInertBackground + useFocusTrap, a SlideOver sorrendjével).
 *
 * A11y (DESIGN_SYSTEM_SPEC_V1 §2.2):
 *  - `role="alertdialog"` + `aria-modal`, cím és leírás azonosítóval kötve;
 *  - a fókusz a **Mégse** gombra érkezik (a DOM-ban ez az első interaktív elem),
 *    így egy véletlen Enter nem hajtja végre a romboló műveletet;
 *  - Esc és a háttérre kattintás = mégse; záráskor a fókusz a triggerre tér vissza;
 *  - a gombok `touch` méretűek (≥44px érintési zóna).
 */

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // A leírás ÉS az összefoglaló is a dialógus leírása — az `aria-describedby`
  // több id-t is elfogad, tehát a képernyőolvasó mindkettőt felolvassa.
  const describedBy = [
    description ? `${titleId}-description` : null,
    details?.length ? `${titleId}-details` : null,
  ].filter(Boolean).join(' ')

  // Sorrend: az inert-et a fókusz-visszaadás ELŐTT kell feloldani.
  useInertBackground(rootRef, open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-stone-900/30 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy || undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-line bg-surface-card p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p id={`${titleId}-description`} className="mt-2 text-sm text-ink-muted">
            {description}
          </p>
        )}
        {details && details.length > 0 && (
          // Definíciós lista: a címke→érték viszonyt a MARKUP hordozza, nem a
          // tördelés — így a képernyőolvasó is párokként adja vissza.
          <dl id={`${titleId}-details`} className="mt-4 space-y-3 rounded-lg border border-line bg-surface-sunken p-3">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
                  {detail.label}
                </dt>
                <dd className="mt-0.5">
                  {detail.tone ? (
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONES[detail.tone].bg} ${STATUS_TONES[detail.tone].fg}`}>
                      {detail.value}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-ink">{detail.value}</span>
                  )}
                  {detail.hint && (
                    <span className="mt-0.5 block text-xs text-ink-soft">{detail.hint}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {/* A Mégse áll elöl a DOM-ban: a fókusz ide érkezik. */}
          <Button variant="secondary" size="touch" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'destructive' : 'primary'} size="touch" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (result: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const pending = useRef<PendingConfirm | null>(null)

  const ask = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // Ha egy korábbi kérdés még nyitva van, azt elutasításként zárjuk le —
        // így nem marad függőben egy soha fel nem oldódó promise.
        pending.current?.resolve(false)
        pending.current = { options: next, resolve }
        setOptions(next)
      }),
    [],
  )

  const settle = useCallback((result: boolean) => {
    pending.current?.resolve(result)
    pending.current = null
    setOptions(null)
  }, [])

  const value = useMemo(() => ({ ask }), [ask])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open
          {...options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}
