import { useState } from 'react'
import { Button, StatusPill } from '../../../components/ui'
import type { AddActivityPayload, ActivityKind, CrmActivity } from '../services'
import { ACTIVITY_KIND_LABELS } from './labels'

/**
 * Tevékenységnapló — közös lista + rögzítő űrlap a lead/lehetőség
 * SlideOver-ekhez. A mutációt a szülő adja (useAddLeadActivity /
 * useAddOppActivity), a komponens csak hív.
 */

interface ActivityLogProps {
  activities: CrmActivity[]
  /** A bejegyzést rögzítő (bejelentkezett felhasználó / felelős neve). */
  who: string
  onAdd: (payload: AddActivityPayload) => void
  isPending: boolean
}

export function ActivityLog({ activities, who, onAdd, isPending }: ActivityLogProps) {
  const [kind, setKind] = useState<ActivityKind>('megjegyzes')
  const [text, setText] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ kind, who, text })
    setText('')
  }

  // legfrissebb elöl
  const sorted = [...activities].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div>
      <div className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Tevékenységnapló ({activities.length})
      </div>

      <form onSubmit={submit} className="mb-3 space-y-2 rounded-xl border border-line bg-surface-2/60 p-3">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="activity-kind">Bejegyzés típusa</label>
          <select
            id="activity-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
            className="h-8 rounded-lg border border-line bg-surface-1 px-2 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            {(Object.keys(ACTIVITY_KIND_LABELS) as ActivityKind[]).map((k) => (
              <option key={k} value={k}>{ACTIVITY_KIND_LABELS[k]}</option>
            ))}
          </select>
          <input
            aria-label="Bejegyzés szövege"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Új bejegyzés…"
            className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabledReason={
              isPending ? 'Folyamatban…' : text.trim() === '' ? 'Írd be a bejegyzés szövegét.' : undefined
            }
          >
            Rögzítés
          </Button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="text-[12px] text-ink-muted">Még nincs bejegyzés.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((a, i) => (
            <li key={`${a.at}-${i}`} className="flex gap-2 text-[11.5px]">
              <StatusPill size="sm" tone="neutral" label={ACTIVITY_KIND_LABELS[a.kind]} />
              <div className="min-w-0">
                <div className="font-mono text-[10.5px] text-ink-muted">
                  {a.at} · <span className="text-ink">{a.who}</span>
                </div>
                <div className="text-ink">{a.text}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
