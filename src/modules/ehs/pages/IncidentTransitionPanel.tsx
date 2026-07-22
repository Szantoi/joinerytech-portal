import { useState } from 'react'
import { Button, Input, SelectField, TextAreaField } from '../../../components/ui'
import {
  INCIDENT_FSM, transitionBlockReason, type IncidentAction,
  useIncidentTransition, type Incident, type IncidentTransitionPayloads,
  CURRENT_EMPLOYEE_ID, EHS_EMPLOYEE_DIRECTORY,
} from '../services'
import { INCIDENT_STATUS_LABELS } from './labels'
import { EmployeeOptions } from './EmployeeOptions'

/**
 * Esemény FSM-akciók (plan 3. vezérelv): MINDEN átmenet-gomb látható;
 * a tiltott átmenet nem tűnik el, hanem Button `disabledReason`-t kap
 * (aria-disabled + tooltip). Engedélyezett akció → inline mini-űrlap.
 */

const ACTION_LABELS: Record<IncidentAction, string> = {
  investigate: 'Kivizsgálás indítása',
  addCorrectiveAction: 'Intézkedés rögzítése',
  close: 'Lezárás',
  reopen: 'Újranyitás',
}

const ACTION_ORDER: IncidentAction[] = ['investigate', 'addCorrectiveAction', 'close', 'reopen']

function defaultDueDate(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export function IncidentTransitionPanel({ incident }: { incident: Incident }) {
  const transition = useIncidentTransition()
  const [activeAction, setActiveAction] = useState<IncidentAction | null>(null)

  // űrlap-állapot (akciónként a releváns mezők)
  const [investigatedBy, setInvestigatedBy] = useState(CURRENT_EMPLOYEE_ID)
  const [capaDescription, setCapaDescription] = useState('')
  const [capaResponsible, setCapaResponsible] = useState(CURRENT_EMPLOYEE_ID)
  const [capaDueDate, setCapaDueDate] = useState(defaultDueDate)
  const [notes, setNotes] = useState('')

  const submit = (action: IncidentAction) => {
    const payloads: IncidentTransitionPayloads = {
      investigate: { investigatedBy },
      addCorrectiveAction: {
        description: capaDescription,
        responsiblePerson: capaResponsible,
        dueDate: capaDueDate,
      },
      close: { closureNotes: notes },
      reopen: { reopenReason: notes },
    }
    transition.mutate(
      { id: incident.incidentId, action, payload: payloads[action] },
      { onSuccess: () => { setActiveAction(null); setNotes(''); setCapaDescription('') } },
    )
  }

  const formValid: Record<IncidentAction, boolean> = {
    investigate: investigatedBy !== '',
    addCorrectiveAction: capaDescription.trim() !== '' && capaDueDate !== '',
    close: notes.trim() !== '',
    reopen: notes.trim() !== '',
  }

  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
        Állapot-átmenetek
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTION_ORDER.map((action) => {
          const reason = transitionBlockReason(
            INCIDENT_FSM, action, incident.status, INCIDENT_STATUS_LABELS,
          )
          const isActive = activeAction === action
          return (
            <Button
              key={action}
              size="sm"
              variant={isActive ? 'primary' : 'secondary'}
              disabledReason={reason}
              aria-expanded={reason ? undefined : isActive}
              onClick={() => setActiveAction(isActive ? null : action)}
            >
              {ACTION_LABELS[action]}
            </Button>
          )
        })}
      </div>

      {activeAction && (
        <form
          className="mt-3 space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
          onSubmit={(e) => { e.preventDefault(); submit(activeAction) }}
        >
          {activeAction === 'investigate' && (
            <SelectField label="Kivizsgáló" required value={investigatedBy}
              onChange={(e) => setInvestigatedBy(e.target.value)}>
              <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
            </SelectField>
          )}

          {activeAction === 'addCorrectiveAction' && (
            <>
              <TextAreaField label="Intézkedés leírása" required value={capaDescription}
                onChange={(e) => setCapaDescription(e.target.value)} />
              <SelectField label="Felelős" required value={capaResponsible}
                onChange={(e) => setCapaResponsible(e.target.value)}>
                <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
              </SelectField>
              <Input label="Határidő" type="date" required value={capaDueDate}
                onChange={(e) => setCapaDueDate(e.target.value)} />
            </>
          )}

          {activeAction === 'close' && (
            <TextAreaField label="Lezárási megjegyzés" required value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          )}

          {activeAction === 'reopen' && (
            <TextAreaField label="Újranyitás indoka" required value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabledReason={
                transition.isPending
                  ? 'Folyamatban…'
                  : formValid[activeAction] ? undefined : 'Töltsd ki a kötelező mezőket.'
              }
            >
              {ACTION_LABELS[activeAction]}
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setActiveAction(null)}>
              Mégse
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
