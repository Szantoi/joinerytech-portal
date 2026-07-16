import { useState } from 'react'
import { SlideOver } from '../../components/ui'
import { RISKS, RISK_LEVEL_META, type EhsRisk, type RiskLevel } from '../../mocks/ehs'

/**
 * Kockázatok képernyő — 3×3 mátrix (valószínűség × hatás).
 * MEGJEGYZÉS: még statikus mockból dolgozik; a risk-assessment API-ra kötés
 * nem az F2 scope-ja (a backend 5×5 mátrixa külön migrációt igényel).
 */

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const m = RISK_LEVEL_META[level]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

export function RisksScreen() {
  const [selected, setSelected] = useState<EhsRisk | null>(null)

  function cellColor(prob: number, impact: number) {
    const score = prob * impact
    if (score >= 6) return 'bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-900'
    if (score >= 3) return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900'
    return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900'
  }

  function getRisksAt(prob: number, impact: number) {
    return RISKS.filter((r) => r.probability === prob && r.impact === impact)
  }

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-ink">Kockázatok</h1>
        <p className="text-[12.5px] text-ink-muted mt-0.5">3×3 kockázati mátrix — valószínűség × hatás</p>
      </div>

      <div className="bg-surface-1 rounded-xl border border-line p-5 mb-5 overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="flex mb-1">
            <div className="w-24 shrink-0" />
            {[1, 2, 3].map((impact) => (
              <div key={impact} className="flex-1 text-center text-[10.5px] text-ink-muted pb-1">
                Hatás {impact}
              </div>
            ))}
          </div>
          {([3, 2, 1] as const).map((prob) => (
            <div key={prob} className="flex gap-1 mb-1">
              <div className="w-24 shrink-0 flex items-center text-[10.5px] text-ink-muted pr-2">
                Val. {prob}
              </div>
              {([1, 2, 3] as const).map((impact) => {
                const cellRisks = getRisksAt(prob, impact)
                return (
                  <div key={impact} className={`flex-1 min-h-[80px] rounded-lg border p-2 ${cellColor(prob, impact)}`}>
                    {cellRisks.map((r) => (
                      <button key={r.id} onClick={() => setSelected(r)}
                        className="w-full text-left text-[10px] text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white mb-1 leading-tight">
                        {r.title}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {RISKS.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)}
            className="w-full text-left bg-surface-1 rounded-xl border border-line px-4 py-3 hover:shadow-sm hover:border-rose-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">{r.title}</div>
              <div className="text-[11.5px] text-ink-muted mt-0.5">{r.area} · Felelős: {r.owner}</div>
              <div className="text-[11px] text-ink-muted mt-1">Val. {r.probability} × Hatás {r.impact} · Felülvizsgálat: {r.lastReview}</div>
            </div>
            <RiskLevelBadge level={r.level} />
          </button>
        ))}
      </div>

      {selected && (
        <SlideOver open={true} onClose={() => setSelected(null)} title={selected.title} subtitle={`${selected.id} · ${selected.area}`} width={420}>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-2">
              <RiskLevelBadge level={selected.level} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10.5px] text-ink-muted mb-0.5">Valószínűség</div>
                <div className="text-[14px] font-bold text-ink">{selected.probability} / 3</div>
              </div>
              <div>
                <div className="text-[10.5px] text-ink-muted mb-0.5">Hatás</div>
                <div className="text-[14px] font-bold text-ink">{selected.impact} / 3</div>
              </div>
              <div>
                <div className="text-[10.5px] text-ink-muted mb-0.5">Terület</div>
                <div className="text-[12px] text-ink">{selected.area}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-ink-muted mb-0.5">Felelős</div>
                <div className="text-[12px] text-ink">{selected.owner}</div>
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-ink-muted mb-0.5">Utolsó felülvizsgálat</div>
              <div className="text-[12px] font-mono text-ink">{selected.lastReview}</div>
            </div>
          </div>
        </SlideOver>
      )}
    </div>
  )
}
