import {
  RISK_LIKELIHOODS,
  RISK_SEVERITIES,
  type RiskAssessmentListItem,
  type RiskLevel,
  type RiskLikelihood,
  type RiskMatrixCell,
  type RiskSeverity,
} from '../services/riskAssessments'
import {
  RISK_LEVEL_META,
  RISK_LIKELIHOOD_LABELS,
  RISK_SEVERITY_LABELS,
} from './labels'

interface AxisMeta {
  score: number
}

interface RiskLevelStyle {
  cellClassName: string
  countClassName: string
}

/**
 * A drót-kulcsok helyi megjelenítési metaadatai. A besorolást nem ezek,
 * hanem minden esetben a backend `RiskMatrixCell.riskLevel` mezője vezérli.
 */
const SEVERITY_META: Record<RiskSeverity, AxisMeta> = {
  elhanyagolhato: { score: 1 },
  enyhe: { score: 2 },
  kozepes: { score: 3 },
  sulyos: { score: 4 },
  katasztrofalis: { score: 5 },
}

const LIKELIHOOD_META: Record<RiskLikelihood, AxisMeta> = {
  ritka: { score: 1 },
  valoszinutlen: { score: 2 },
  lehetseges: { score: 3 },
  valoszinu: { score: 4 },
  szinte_biztos: { score: 5 },
}

const RISK_LEVEL_STYLES: Record<RiskLevel, RiskLevelStyle> = {
  alacsony: {
    cellClassName: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950',
    countClassName: 'bg-emerald-700 text-white dark:bg-emerald-300 dark:text-emerald-950',
  },
  kozepes: {
    cellClassName: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
    countClassName: 'bg-amber-700 text-white dark:bg-amber-300 dark:text-amber-950',
  },
  magas: {
    cellClassName: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950',
    countClassName: 'bg-orange-700 text-white dark:bg-orange-300 dark:text-orange-950',
  },
  kritikus: {
    cellClassName: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950',
    countClassName: 'bg-rose-700 text-white dark:bg-rose-300 dark:text-rose-950',
  },
}

const DISPLAY_LIKELIHOODS = [...RISK_LIKELIHOODS].reverse()

function matrixKey(severity: RiskSeverity, likelihood: RiskLikelihood): string {
  return `${severity}:${likelihood}`
}

function cellAccessibleName(cell: RiskMatrixCell): string {
  const severity = SEVERITY_META[cell.severity]
  const likelihood = LIKELIHOOD_META[cell.likelihood]
  return [
    `Valószínűség: ${RISK_LIKELIHOOD_LABELS[cell.likelihood]} (${likelihood.score})`,
    `Súlyosság: ${RISK_SEVERITY_LABELS[cell.severity]} (${severity.score})`,
    `Kockázati szint: ${RISK_LEVEL_META[cell.riskLevel].label}`,
    `${cell.count} értékelés`,
  ].join('; ')
}

export interface RiskMatrixProps {
  cells: readonly RiskMatrixCell[]
  /** Az aktuális list-query nem archivált rekordjai; lehet szűrt részhalmaz. */
  assessments: readonly RiskAssessmentListItem[]
  onSelect: (riskAssessmentId: string) => void
}

/**
 * Szemantikus 5×5 kockázati mátrix. A komponens nem számol score-t vagy
 * kockázati sávot: a 25 backend DTO-t kulccsal rendeli a rácshoz.
 */
export function RiskMatrix({ cells, assessments, onSelect }: RiskMatrixProps) {
  const cellsByKey = new Map(
    cells.map((cell) => [matrixKey(cell.severity, cell.likelihood), cell]),
  )
  const activeAssessments = assessments.filter((assessment) => assessment.status !== 'archivalt')

  return (
    <div
      role="region"
      aria-label="5×5 kockázati mátrix, vízszintesen görgethető"
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-line bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
    >
      <table className="min-w-[1050px] w-full border-separate border-spacing-1 p-2">
        <caption className="sr-only">
          5×5 kockázati mátrix: valószínűség sorok és súlyosság oszlopok
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-44 px-2 py-3 text-left text-[11px] font-medium text-ink-muted"
            >
              Valószínűség ↓ / Súlyosság →
            </th>
            {RISK_SEVERITIES.map((severity) => {
              const meta = SEVERITY_META[severity]
              return (
                <th
                  key={severity}
                  scope="col"
                  className="min-w-40 px-2 py-3 text-center text-[11px] font-semibold text-ink"
                >
                  <span className="block text-[13px]">{meta.score}</span>
                  {RISK_SEVERITY_LABELS[severity]}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {DISPLAY_LIKELIHOODS.map((likelihood) => {
            const likelihoodMeta = LIKELIHOOD_META[likelihood]
            return (
              <tr key={likelihood}>
                <th
                  scope="row"
                  className="px-2 py-3 text-left text-[11px] font-semibold text-ink"
                >
                  <span className="mr-1 text-[13px]">{likelihoodMeta.score}</span>
                  {RISK_LIKELIHOOD_LABELS[likelihood]}
                </th>
                {RISK_SEVERITIES.map((severity) => {
                  const key = matrixKey(severity, likelihood)
                  const cell = cellsByKey.get(key)

                  if (!cell) {
                    return (
                      <td
                        key={key}
                        aria-label={`${RISK_LIKELIHOOD_LABELS[likelihood]}, ${RISK_SEVERITY_LABELS[severity]}: hiányzó mátrixadat`}
                        className="h-36 rounded-lg border border-dashed border-line bg-surface-2 p-2 align-top text-[11px] text-ink-muted"
                      >
                        Hiányzó mátrixadat
                      </td>
                    )
                  }

                  const levelMeta = RISK_LEVEL_META[cell.riskLevel]
                  const levelStyle = RISK_LEVEL_STYLES[cell.riskLevel]
                  const cellAssessments = activeAssessments.filter(
                    (assessment) => assessment.severity === severity
                      && assessment.likelihood === likelihood,
                  )

                  return (
                    <td
                      key={key}
                      aria-label={cellAccessibleName(cell)}
                      className={`h-36 rounded-lg border p-2 align-top ${levelStyle.cellClassName}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink">
                          {levelMeta.label}
                        </span>
                        <span
                          className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${levelStyle.countClassName}`}
                        >
                          {cell.count}
                          <span className="sr-only"> értékelés</span>
                        </span>
                      </div>

                      {cellAssessments.length > 0 ? (
                        <ul className="space-y-1">
                          {cellAssessments.map((assessment) => (
                            <li key={assessment.riskAssessmentId}>
                              <button
                                type="button"
                                onClick={() => onSelect(assessment.riskAssessmentId)}
                                aria-label={`${assessment.hazardDescription} kockázatértékelés megnyitása`}
                                className="w-full rounded-md border border-black/10 bg-white/80 px-2 py-1.5 text-left text-[10.5px] font-medium leading-snug text-stone-800 shadow-sm transition hover:border-world-ring hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring dark:border-white/15 dark:bg-black/25 dark:text-stone-100 dark:hover:bg-black/40"
                              >
                                {assessment.hazardDescription}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] leading-snug text-ink-muted">
                          {cell.count > 0
                            ? 'A szűrésben nincs megjeleníthető értékelés.'
                            : 'Nincs értékelés.'}
                        </p>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
