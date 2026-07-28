import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '@spaceos/portal-ui'
import {
  EXECUTION_FSM, EXECUTION_MAIN_PATH, completePanelsBlockReason, deviceSignatureBlockReason,
  useExecution, useExecutionMilestones, useExecutionMutation, useExecutionProgress,
} from '../services'
import { CANCEL_REASON_WIRE, PROOF_LEVEL_WIRE } from '../services/wire'
import type { CancelReason, ExecutionStatus, ProofLevel } from '../services/wire'
import { IS_PRODUCTION_API_MODE } from '../services/config'
import { transitionBlockReason } from '@spaceos/portal-core'
import { SelectField } from './fields'
import { DetailState } from './DetailState'
import {
  CANCEL_REASON_LABELS, EXECUTION_STATUS_META, MILESTONE_KIND_LABELS, MILESTONE_STATUS_META,
  PROGRESS_KIND_LABELS, PROOF_LEVEL_LABELS, formatDate,
} from './labels'

/**
 * Végrehajtás-részlet — FSM-stepper (Scheduled→Started→InProgress→Completed;
 * Cancelled/Failed mellékállapotok), esemény-idővonal és mérföldkövek, a
 * start/progress/complete/cancel akciók a KÖZÖS fsm.ts guardjaival. A
 * complete-hez panel-guard (completePanelsBlockReason) + bizonyíték-szint
 * választó.
 *
 * ⚠ G9 gap (M-3 fix, WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24): a badge-,
 * esemény- és bizonyíték-aláírás valós forrása (kártyaolvasó / gyártásidő
 * eszköz-integráció) NINCS bekötve a portálban — a mezők ma placeholder
 * értéket hordoznának. Ez NEM a kontraktus hiánya, de élesben a `complete`
 * ÁTMENNE, és a konstans hash HAMIS bizonyítékként rögzülne, ezért `api`
 * módban a három aláírás-függő akció letiltott, magyarázó tooltippel. Mock
 * módban (MSW-tükör) az akciók demózhatók maradnak.
 */

export function ExecutionDetailSlideOver({
  executionId,
  onClose,
  /**
   * Adat-mód. Alapértelmezésben a build-idejű kapcsoló (`VITE_DATA_MODE`), de
   * INJEKTÁLHATÓ — így a G9 tiltás (M-3) tesztelhető, nem csak a mögötte lévő
   * tiszta guard-függvény. Semmilyen hívási hely nem adja meg élesben.
   */
  apiMode = IS_PRODUCTION_API_MODE,
}: {
  executionId: string | null
  onClose: () => void
  apiMode?: boolean
}) {
  // Az aláírás-függő akciók (start/progress/complete) tiltó oka `api` módban.
  // A szabály a services/fsm.ts-ben él (a többi guard mellett), itt csak a
  // mód-kapcsoló dől el. Mock módban `undefined` → a demó-folyamat változatlan.
  const deviceBlockReason = deviceSignatureBlockReason(apiMode)
  const execution = useExecution(executionId)
  const progress = useExecutionProgress(executionId)
  const milestones = useExecutionMilestones(executionId)
  const mutation = useExecutionMutation()
  const [proofLevel, setProofLevel] = useState<ProofLevel>('HashOnly')
  const [cancelReason, setCancelReason] = useState<CancelReason>('OperatorCancelled')

  if (executionId === null) return null
  const data = execution.data

  const statusLabels = Object.fromEntries(
    Object.entries(EXECUTION_STATUS_META).map(([key, meta]) => [key, meta.label]),
  ) as Record<ExecutionStatus, string>

  return (
    <SlideOver open onClose={onClose} title={data?.id ?? executionId} subtitle="Vágás-végrehajtás" width={560}>
      {!data ? (
        <DetailState isError={execution.isError} onRetry={() => void execution.refetch()} resource="végrehajtás" />
      ) : (
        <div className="space-y-5">
          <FsmStepper
            steps={EXECUTION_MAIN_PATH.map((key) => ({ key, label: EXECUTION_STATUS_META[key].label }))}
            currentKey={data.status}
            sideLabel={EXECUTION_STATUS_META[data.status]?.label}
            label="Végrehajtás állapota"
          />

          <dl className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <dt className="text-ink-muted">Lap-azonosító</dt>
              <dd className="font-mono text-ink">{data.sheetId}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Panel-haladás</dt>
              <dd className="tabular-nums text-ink">{data.panelsCompleted} / {data.totalPanels}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Indítva</dt>
              <dd className="text-ink">{formatDate(data.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Lezárva</dt>
              <dd className="text-ink">{formatDate(data.completedAt)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              size="sm"
              disabledReason={
                deviceBlockReason
                ?? transitionBlockReason(EXECUTION_FSM, 'start', data.status, statusLabels)
              }
              onClick={() => mutation.mutate({
                id: data.id, action: 'start',
                payload: { workerId: 'WORKER-DEMO', badgeHmacBase64: 'demo-hmac', hmacKeyVersion: 'v1' },
              })}
            >
              Indítás
            </Button>
            <Button
              size="sm"
              disabledReason={
                deviceBlockReason
                ?? transitionBlockReason(EXECUTION_FSM, 'progress', data.status, statusLabels)
              }
              onClick={() => mutation.mutate({
                id: data.id, action: 'progress',
                payload: {
                  eventId: crypto.randomUUID(), kind: 'PanelCompleted',
                  occurredAt: new Date().toISOString(),
                  eventHmacBase64: 'demo-hmac', hmacKeyVersion: 'v1',
                },
              })}
            >
              Panel kész
            </Button>

            <div className="flex items-end gap-1.5">
              <SelectField
                label="Bizonyíték-szint"
                value={proofLevel}
                onChange={(e) => setProofLevel(e.target.value as ProofLevel)}
              >
                {Object.keys(PROOF_LEVEL_WIRE).map((level) => (
                  <option key={level} value={level}>{PROOF_LEVEL_LABELS[level as ProofLevel]}</option>
                ))}
              </SelectField>
              <Button
                size="sm"
                disabledReason={
                  deviceBlockReason
                  ?? transitionBlockReason(EXECUTION_FSM, 'complete', data.status, statusLabels)
                  ?? completePanelsBlockReason(data.panelsCompleted, data.totalPanels)
                }
                onClick={() => mutation.mutate({
                  id: data.id, action: 'complete',
                  payload: { proofLevel, proofHash: 'demo-proof-hash' },
                })}
              >
                Lezárás
              </Button>
            </div>

            <div className="flex items-end gap-1.5">
              <SelectField
                label="Megszakítás oka"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value as CancelReason)}
              >
                {Object.keys(CANCEL_REASON_WIRE).map((reason) => (
                  <option key={reason} value={reason}>{CANCEL_REASON_LABELS[reason as CancelReason]}</option>
                ))}
              </SelectField>
              <Button
                size="sm" variant="destructive"
                disabledReason={transitionBlockReason(EXECUTION_FSM, 'cancel', data.status, statusLabels)}
                onClick={() => mutation.mutate({ id: data.id, action: 'cancel', payload: { reason: cancelReason } })}
              >
                Megszakítás
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold text-ink">Esemény-idővonal</h3>
            {/* M-12: üres ≠ hiba ≠ betöltés. Egy OPERATÍV képernyőn a tranziens
                hiba „Nincs rögzített esemény."-ként a gépkezelőt téveszti meg. */}
            {progress.isPending || progress.isError ? (
              <DetailState
                isError={progress.isError}
                onRetry={() => void progress.refetch()}
                resource="esemény-idővonal"
              />
            ) : (progress.data ?? []).length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs rögzített esemény.</p>
            ) : (
              <ul className="space-y-1">
                {(progress.data ?? []).map((event) => (
                  <li key={event.eventId} className="flex items-center gap-2 text-[11.5px]">
                    <span className="font-mono text-ink-muted">{formatDate(event.occurredAt)}</span>
                    <span className="text-ink">{PROGRESS_KIND_LABELS[event.kind]}</span>
                    {event.panelNumber !== null && <span className="text-ink-muted">· panel #{event.panelNumber}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold text-ink">Mérföldkövek</h3>
            {milestones.isPending || milestones.isError ? (
              <DetailState
                isError={milestones.isError}
                onRetry={() => void milestones.refetch()}
                resource="mérföldkövek"
              />
            ) : (milestones.data ?? []).length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs mérföldkő.</p>
            ) : (
              <ul className="space-y-1.5">
                {(milestones.data ?? []).map((m) => (
                  <li key={m.milestoneId} className="flex items-center justify-between text-[11.5px]">
                    {/* M-9: magyar címke a nyers wire-tagnév helyett. */}
                    <span className="text-ink">{MILESTONE_KIND_LABELS[m.kind]}</span>
                    <StatusPill size="sm" tone={MILESTONE_STATUS_META[m.status].tone} label={MILESTONE_STATUS_META[m.status].label} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </SlideOver>
  )
}
