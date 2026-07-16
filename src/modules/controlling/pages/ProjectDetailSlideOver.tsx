import { QueryGate, StatusPill } from '../../../components/ui'
import { SlideOver } from '../../../components/ui/SlideOver'
import { useAdjustments, useProject, useProjectCalc } from '../services'
import { MarginBar, MarginPill } from './MarginVisuals'
import { CATEGORY_LABELS, PROJECT_STATUS_LABELS, formatDate, formatHuf, formatSignedHuf } from './labels'

/**
 * Projekt-részlet SlideOver — életciklus-címke (nem FSM), fedezet-sáv,
 * kategória-bontás (terv / tény / EAC / eltérés) és a projekt élő
 * utókalkulációs korrekciói.
 */
export function ProjectDetailSlideOver({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
  const project = useProject(projectId)
  const calc = useProjectCalc(projectId)
  const adjustments = useAdjustments(projectId ? { projectId } : {})

  if (projectId === null) return null
  const p = project.data
  const c = calc.data

  return (
    <SlideOver open onClose={onClose} title={p?.name ?? 'Projekt'} subtitle={p?.customer} width={600}>
      <div className="space-y-5 px-5 py-5">
        <QueryGate
          isPending={project.isPending || calc.isPending}
          isError={project.isError || calc.isError}
          onRetry={() => { void project.refetch(); void calc.refetch() }}
          resource="projekt-kalkuláció"
        >
          {p && c && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill size="sm" fsm="kontrollingProjekt" status={p.status} label={PROJECT_STATUS_LABELS[p.status]} />
                <MarginPill pct={c.eacMarginPct} />
              </div>

              <dl className="grid grid-cols-2 gap-3">
                {[
                  ['Szerződéses érték', formatHuf(p.contractValue)],
                  ['Számlázott', formatHuf(p.invoiced)],
                  ['Terv-összköltség', formatHuf(c.planTotal)],
                  ['Tény-összköltség', formatHuf(c.actualTotal)],
                  ['EAC (várható összköltség)', formatHuf(c.eacTotal)],
                  ['Eltérés (tény − terv)', formatSignedHuf(c.variance)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10.5px] text-ink-muted">{label}</dt>
                    <dd className="text-[14px] font-semibold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <div className="mb-1.5 text-[10.5px] text-ink-muted">Fedezet-sáv (EAC alapon)</div>
                <MarginBar revenue={p.contractValue} cost={c.eacTotal} />
              </div>

              <div>
                <h3 className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">Kategória-bontás</h3>
                {/* Saját overflow-x-auto konténer (DataTable.tsx:114-119 recept) — a nyers
                    Ft-összegek miatt ~450-500px min-width a tábla; enélkül a mobil bottom
                    sheet (~360px) egésze csúszna affordancia nélkül (S1). */}
                <div
                  role="region"
                  aria-label="Kategória-bontás"
                  tabIndex={0}
                  className="overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                >
                  <table className="w-full text-[12px]">
                    <caption className="sr-only">Költség-kategóriák terv, tény, EAC és eltérés szerint</caption>
                    <thead>
                      <tr className="border-b border-line text-[10.5px] text-ink-muted">
                        <th scope="col" className="pb-2 text-left font-medium">Kategória</th>
                        <th scope="col" className="pb-2 text-right font-medium">Terv</th>
                        <th scope="col" className="pb-2 text-right font-medium">Tény</th>
                        <th scope="col" className="pb-2 text-right font-medium">EAC</th>
                        <th scope="col" className="pb-2 text-right font-medium">Eltérés</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/50">
                      {c.byCategory.map((cat) => (
                        <tr key={cat.category}>
                          <td className="py-1.5 text-ink">{CATEGORY_LABELS[cat.category]}</td>
                          <td className="py-1.5 text-right tabular-nums text-ink-muted">{formatHuf(cat.plan)}</td>
                          <td className="py-1.5 text-right font-medium tabular-nums text-ink">{formatHuf(cat.actual)}</td>
                          <td className="py-1.5 text-right tabular-nums text-ink">{formatHuf(cat.projected)}</td>
                          <td className={`py-1.5 text-right tabular-nums ${cat.variance > 0 ? 'text-rose-700 dark:text-rose-400' : cat.variance < 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-muted'}`}>
                            {cat.variance === 0 ? '—' : formatSignedHuf(cat.variance)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-line font-semibold">
                        <td className="pt-2 text-ink">Összesen</td>
                        <td className="pt-2 text-right tabular-nums text-ink-muted">{formatHuf(c.planTotal)}</td>
                        <td className="pt-2 text-right tabular-nums text-ink">{formatHuf(c.actualTotal)}</td>
                        <td className="pt-2 text-right tabular-nums text-ink">{formatHuf(c.eacTotal)}</td>
                        <td className={`pt-2 text-right tabular-nums ${c.variance > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {formatSignedHuf(c.variance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {(adjustments.data?.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Utókalkulációs korrekciók (a tényben)
                  </h3>
                  <ul className="divide-y divide-line/50">
                    {adjustments.data!.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[12px] text-ink">{a.reason}</div>
                          <div className="text-[10.5px] text-ink-muted">
                            {CATEGORY_LABELS[a.category]} · {formatDate(a.createdAt)} · {a.createdBy}
                          </div>
                        </div>
                        <span className={`shrink-0 text-[12px] font-semibold tabular-nums ${a.amount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {formatSignedHuf(a.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </QueryGate>
      </div>
    </SlideOver>
  )
}
