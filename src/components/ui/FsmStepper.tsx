/**
 * FsmStepper — lineáris FSM fő-út vizualizáció (plan 3. vezérelv kiegészítője).
 *
 * A fő láncot rendezett listaként mutatja (aria-current="step" az aktívon);
 * a teljesített lépések kitöltött, a hátralévők üres jelölőt kapnak — a
 * jelzés forma + szín (nem csak szín). Mellékállapot (pl. Elmaradt/Újranyitva)
 * a lánc felett külön jelvényként jelenik meg, a lánc halványítva.
 */

export interface FsmStep {
  key: string
  label: string
}

interface FsmStepperProps {
  steps: FsmStep[]
  /** Aktuális státusz-kulcs; ha nincs a steps között, mellékállapotként jelenik meg. */
  currentKey: string
  /** Mellékállapot címkéje (pl. „Elmaradt"), ha a currentKey nem fő-út lépés. */
  sideLabel?: string
  /** A stepper akadálymentes neve, pl. „Bejárás állapota". */
  label: string
}

export function FsmStepper({ steps, currentKey, sideLabel, label }: FsmStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey)
  const isSideState = currentIndex === -1

  return (
    <div>
      {isSideState && (
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full border-2 border-stone-500 dark:border-stone-400" />
          {sideLabel ?? currentKey}
        </span>
      )}
      <ol aria-label={label} className={`flex flex-wrap items-center gap-1 ${isSideState ? 'opacity-50' : ''}`}>
        {steps.map((step, i) => {
          const done = currentIndex > i
          const active = currentIndex === i
          return (
            <li key={step.key} aria-current={active ? 'step' : undefined} className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${
                  active
                    ? 'bg-world-soft font-semibold text-world-soft-fg'
                    : done
                      ? 'font-medium text-ink'
                      : 'text-ink-muted'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    done || active ? 'bg-current' : 'border border-current bg-transparent'
                  }`}
                />
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="text-[10px] text-ink-muted">→</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
