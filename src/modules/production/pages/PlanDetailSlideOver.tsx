import { useState } from 'react'
import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  CUTTING_PLAN_FSM, CUTTING_PLAN_PATH, publishSnapshotBlockReason,
  usePlan, usePlanTransition, usePriorityProfiles, useReservePanels,
} from '../services'
import { transitionBlockReason } from '../../../services/fsmGuards'
import { UTILIZATION_WARN_THRESHOLD } from '../services/config'
import { SelectField } from './fields'
import { PLAN_ACTION_LABELS, PLAN_STATUS_META, formatDate, formatNumber } from './labels'

/**
 * Vágóterv-részlet — FSM-stepper (Draft→Published→Frozen→Closed), napi
 * sávok kihasználtsággal (config-küszöb feletti sáv figyelmeztet), és a
 * portálról hívható átmenetek (publish/freeze/close) `disabledReason`-nel a
 * KÖZÖS fsm.ts táblából (transitionBlockReason — a UI és az MSW egy
 * igazságforrása). A publish előfeltétele a prioritás-profil kiválasztása
 * (profileSnapshotId) — a UI ezt választatja ki, nem generál álértéket.
 */
export function PlanDetailSlideOver({ planId, onClose }: { planId: string | null; onClose: () => void }) {
  const plan = usePlan(planId)
  const profiles = usePriorityProfiles(planId !== null)
  const transition = usePlanTransition()
  const reservePanels = useReservePanels()
  const [profileId, setProfileId] = useState('')

  if (planId === null) return null
  const data = plan.data

  const statusLabels = Object.fromEntries(
    CUTTING_PLAN_PATH.map((s) => [s, PLAN_STATUS_META[s].label]),
  ) as Record<(typeof CUTTING_PLAN_PATH)[number], string>

  const selectedProfile = profiles.data?.find((p) => p.id === profileId)
  const snapshotBlock = publishSnapshotBlockReason(profileId)

  return (
    <SlideOver open onClose={onClose} title={data?.id ?? planId} subtitle="Vágóterv" width={560}>
      {!data ? (
        <p className="text-[12.5px] text-ink-muted">Betöltés…</p>
      ) : (
        <div className="space-y-5">
          <FsmStepper
            steps={CUTTING_PLAN_PATH.map((key) => ({ key, label: PLAN_STATUS_META[key].label }))}
            currentKey={data.status}
            label="Vágóterv állapota"
          />

          <dl className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <dt className="text-ink-muted">Kezdődátum</dt>
              <dd className="font-mono text-ink">{formatDate(data.planDate)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Ablak</dt>
              <dd className="text-ink">{data.planDays} nap</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Stratégia</dt>
              <dd className="font-mono text-ink">{data.strategyId}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Állapot</dt>
              <dd><StatusPill size="sm" tone={PLAN_STATUS_META[data.status].tone} label={PLAN_STATUS_META[data.status].label} /></dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold text-ink">Napi sávok</h3>
            <ul className="space-y-1.5">
              {data.dailyPlans.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                  <span className="w-20 shrink-0 font-mono text-[11px] text-ink-muted">{formatDate(d.date)}</span>
                  <span className="flex-1 text-[11.5px] text-ink">{d.jobs.length} munka</span>
                  <span className={`text-[11px] font-medium tabular-nums ${d.utilizationPercent >= UTILIZATION_WARN_THRESHOLD ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {formatNumber(d.utilizationPercent, 1)}%
                  </span>
                </li>
              ))}
            </ul>
            {data.dailyPlans.some((d) => d.utilizationPercent < UTILIZATION_WARN_THRESHOLD) && (
              <p className="mt-1.5 text-[10.5px] text-amber-700 dark:text-amber-400">
                Egy vagy több nap {UTILIZATION_WARN_THRESHOLD}% alatti kihasználtsággal fut.
              </p>
            )}
          </div>

          {data.status === 'Draft' && (
            <div>
              <SelectField
                label="Prioritás-profil (publikáláshoz)"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                <option value="">— válasszon —</option>
                {(profiles.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' (alap)' : ''}</option>
                ))}
              </SelectField>
              {selectedProfile && (
                <p className="mt-1 text-[10.5px] text-ink-muted">
                  Kapacitás-modell: {selectedProfile.capacityModelId} · Rework: {selectedProfile.reworkPolicyId}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(Object.keys(CUTTING_PLAN_FSM) as (keyof typeof CUTTING_PLAN_FSM)[]).map((action) => {
              const fsmReason = transitionBlockReason(CUTTING_PLAN_FSM, action, data.status, statusLabels)
              const reason = action === 'publish' && !fsmReason ? snapshotBlock : fsmReason
              return (
                <Button
                  key={action}
                  size="sm"
                  disabledReason={reason}
                  onClick={() => transition.mutate({
                    planId: data.id, action,
                    profileSnapshotId: action === 'publish' ? profileId : undefined,
                  })}
                >
                  {PLAN_ACTION_LABELS[action]}
                </Button>
              )
            })}
            <Button
              size="sm" variant="secondary"
              disabledReason={data.status === 'Closed' ? 'Lezárt tervhez nem foglalható panel.' : undefined}
              onClick={() => reservePanels.mutate(data.id)}
            >
              Panel-foglalás
            </Button>
          </div>
        </div>
      )}
    </SlideOver>
  )
}
