import {
  RISK_LEVELS,
  RISK_LIKELIHOODS,
  RISK_SEVERITIES,
  type RiskAssessment,
  type RiskLevel,
  type RiskLikelihood,
  type RiskMatrixSummary,
  type RiskSeverity,
} from '../services/riskAssessments'

/**
 * Kizárólag a mock-backend configja. A production UI soha nem számol sávot;
 * mindig a backend/MSW DTO `riskLevel` mezőjét jeleníti meg.
 */
export interface MockRiskBandConfig {
  lowMax: number
  mediumMax: number
  highMax: number
}

export const DEFAULT_MOCK_RISK_BANDS: MockRiskBandConfig = {
  lowMax: 4,
  mediumMax: 9,
  highMax: 16,
}

const severityScore: Record<RiskSeverity, number> = Object.fromEntries(
  RISK_SEVERITIES.map((value, index) => [value, index + 1]),
) as Record<RiskSeverity, number>

const likelihoodScore: Record<RiskLikelihood, number> = Object.fromEntries(
  RISK_LIKELIHOODS.map((value, index) => [value, index + 1]),
) as Record<RiskLikelihood, number>

export function calculateRiskScore(
  severity: RiskSeverity,
  likelihood: RiskLikelihood,
): number {
  return severityScore[severity] * likelihoodScore[likelihood]
}

export function riskLevelForScore(
  score: number,
  config: MockRiskBandConfig = DEFAULT_MOCK_RISK_BANDS,
): RiskLevel {
  if (score <= config.lowMax) return 'alacsony'
  if (score <= config.mediumMax) return 'kozepes'
  if (score <= config.highMax) return 'magas'
  return 'kritikus'
}

export function calculateMockRisk(
  severity: RiskSeverity,
  likelihood: RiskLikelihood,
  config: MockRiskBandConfig = DEFAULT_MOCK_RISK_BANDS,
) {
  const riskScore = calculateRiskScore(severity, likelihood)
  return { riskScore, riskLevel: riskLevelForScore(riskScore, config) }
}

export function buildRiskMatrixSummary(
  assessments: readonly RiskAssessment[],
  config: MockRiskBandConfig = DEFAULT_MOCK_RISK_BANDS,
): RiskMatrixSummary {
  const active = assessments.filter((assessment) => assessment.status !== 'archivalt')
  const byRiskLevel: Partial<Record<RiskLevel, number>> = {}
  const byStatus: RiskMatrixSummary['byStatus'] = {}

  for (const assessment of active) {
    byRiskLevel[assessment.riskLevel] = (byRiskLevel[assessment.riskLevel] ?? 0) + 1
    byStatus[assessment.status] = (byStatus[assessment.status] ?? 0) + 1
  }

  return {
    totalAssessments: active.length,
    byRiskLevel,
    byStatus,
    matrixCells: RISK_SEVERITIES.flatMap((severity) =>
      RISK_LIKELIHOODS.map((likelihood) => ({
        severity,
        likelihood,
        count: active.filter(
          (assessment) => assessment.severity === severity && assessment.likelihood === likelihood,
        ).length,
        riskLevel: riskLevelForScore(calculateRiskScore(severity, likelihood), config),
      })),
    ),
  }
}

export function isKnownRiskLevel(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value)
}
