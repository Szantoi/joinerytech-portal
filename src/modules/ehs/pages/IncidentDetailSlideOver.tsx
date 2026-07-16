import { SlideOver, StatusPill, FsmStepper, Icon } from '../../../components/ui'
import { useIncident, employeeName } from '../services'
import {
  INCIDENT_STATUS_LABELS, INCIDENT_TYPE_LABELS, SEVERITY_LABELS,
  formatDate, formatDateTime,
} from './labels'
import { IncidentTransitionPanel } from './IncidentTransitionPanel'

/**
 * Esemény-részletek SlideOver — FSM stepper + validált átmenet-akciók + CAPA lista.
 * Az adat a useIncident query-ből jön (az átmenet-mutáció optimista frissítéssel
 * írja a cache-t, 409-nél rollback + toast — ld. services/ehs/incidents.ts).
 */

const INCIDENT_MAIN_PATH = (['Reported', 'Investigated', 'CorrectiveActionPlanned', 'Closed'] as const)
  .map((key) => ({ key, label: INCIDENT_STATUS_LABELS[key] }))

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10.5px] text-ink-muted">{label}</div>
      <div className="text-[12px] text-ink">{children}</div>
    </div>
  )
}

export function IncidentDetailSlideOver({ incidentId, onClose }: { incidentId: string | null; onClose: () => void }) {
  const { data: incident, isPending, isError } = useIncident(incidentId)
  if (incidentId === null) return null

  return (
    <SlideOver open onClose={onClose} title={incident ? INCIDENT_TYPE_LABELS[incident.incidentType] : 'Esemény'}
      subtitle={incident?.location} width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">Az esemény betöltése nem sikerült.</p>}

        {incident && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill fsm="ehsBaleset" status={incident.status} label={INCIDENT_STATUS_LABELS[incident.status]} />
              <StatusPill tone={SEVERITY_LABELS[incident.severity].tone}
                label={`Súlyosság: ${SEVERITY_LABELS[incident.severity].label}`} />
            </div>

            <FsmStepper
              label="Esemény állapota"
              steps={INCIDENT_MAIN_PATH}
              currentKey={incident.status}
              sideLabel={INCIDENT_STATUS_LABELS[incident.status]}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Meta label="Esemény időpontja">{formatDateTime(incident.incidentDate)}</Meta>
              <Meta label="Bejelentette">{employeeName(incident.reportedBy)}</Meta>
              <Meta label="Helyszín">{incident.location}</Meta>
              <Meta label="Kivizsgáló">{employeeName(incident.investigatedBy)}</Meta>
            </div>

            <Meta label="Leírás">{incident.description}</Meta>

            {incident.investigation && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <div className="font-medium"><Icon name="alert" size={12} className="mr-1 inline" />Kivizsgálás</div>
                <div className="mt-1">{incident.investigation.findings}</div>
                <div className="mt-1"><span className="font-medium">Gyökérok:</span> {incident.investigation.rootCause}</div>
              </div>
            )}

            {/* CAPA lista — az egységes intézkedés-táblából (unified CAPA) */}
            <div>
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                Intézkedések (CAPA)
              </div>
              {(incident.correctiveActions?.length ?? 0) === 0 ? (
                <p className="text-[12px] text-ink-muted">Még nincs rögzített intézkedés.</p>
              ) : (
                <ul className="space-y-2">
                  {incident.correctiveActions!.map((ca, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-1 px-3 py-2">
                      <span aria-hidden="true"
                        className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                          ca.completedAt ? 'bg-emerald-500 text-white' : 'border-2 border-stone-300 dark:border-stone-600'
                        }`}>
                        {ca.completedAt && <Icon name="check" size={9} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[12px] ${ca.completedAt ? 'text-ink-muted line-through' : 'text-ink'}`}>
                          {ca.description}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-ink-muted">
                          {employeeName(ca.responsiblePerson)} · Határidő: {formatDate(ca.dueDate)}
                          {ca.completedAt ? ` · Kész: ${formatDate(ca.completedAt)}` : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <IncidentTransitionPanel incident={incident} />
          </>
        )}
      </div>
    </SlideOver>
  )
}
