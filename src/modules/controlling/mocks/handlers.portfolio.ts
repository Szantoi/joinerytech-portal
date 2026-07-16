import { http, HttpResponse } from 'msw'
import { AT_RISK_MARGIN_THRESHOLD, CONTROLLING_API_BASE } from '../services/config'
import { COST_CATEGORIES, marginPct } from '../services/calc'
import type { VarianceRow } from '../services/variance'
import { getControllingDb, portfolioAdjustments } from './db'
import { CURRENT_TREND_MONTH, MARGIN_TREND_HISTORY } from './seed'
import { toSummary } from './handlers.projects'

/**
 * Portfólió handlerek — vezetői összegzés + eltérés-elemzés.
 * A portfólió-hatályú korrekciók az összesen tény/EAC értékbe EGYSZER
 * számítanak bele (projektenként nem — a backend AppliesTo szemantikájának
 * portfólió-nézeti leolvasata); az eltérés-elemzés projekt-költség alapú,
 * ezért csak a projekt-hatályú korrekciókat tartalmazza.
 */

/** Kockázatos projekt: futó (nem draft/done) ÉS EAC-fedezet a küszöb alatt. */
const AT_RISK_STATUSES = new Set(['active', 'install', 'on_hold'])

export const portfolioHandlers = [
  http.get(`${CONTROLLING_API_BASE}/portfolio/cost-calculation`, () => {
    const summaries = getControllingDb().projects.map(toSummary)
    const portfolioAdj = portfolioAdjustments().reduce((s, a) => s + a.amount, 0)

    const contractTotal = summaries.reduce((s, p) => s + p.contractValue, 0)
    const invoicedTotal = summaries.reduce((s, p) => s + p.invoiced, 0)
    const planCostTotal = summaries.reduce((s, p) => s + p.planTotal, 0)
    const actualCostTotal = summaries.reduce((s, p) => s + p.actualTotal, 0) + portfolioAdj
    const eacTotal = summaries.reduce((s, p) => s + p.eacTotal, 0) + portfolioAdj

    const atRiskProjects = summaries
      .filter(
        (p) =>
          AT_RISK_STATUSES.has(p.status) &&
          p.eacMarginPct !== null &&
          p.eacMarginPct < AT_RISK_MARGIN_THRESHOLD,
      )
      .map((p) => ({ id: p.id, name: p.name, eacMarginPct: p.eacMarginPct }))

    const overruns = summaries.filter((p) => p.eacTotal > p.planTotal)

    const planMarginPct = marginPct(contractTotal, planCostTotal)
    const actualMarginPct = marginPct(contractTotal, actualCostTotal)

    return HttpResponse.json({
      projectCount: summaries.length,
      contractTotal,
      invoicedTotal,
      planCostTotal,
      actualCostTotal,
      eacTotal,
      planMarginPct,
      actualMarginPct,
      eacMarginPct: marginPct(contractTotal, eacTotal),
      projectsAtRisk: atRiskProjects.length,
      atRiskProjects,
      eacOverrunCount: overruns.length,
      eacOverrunTotal: overruns.reduce((s, p) => s + (p.eacTotal - p.planTotal), 0),
      // Az aktuális hónap trend-pontja a store-ból számított → mindig
      // konzisztens a fenti KPI-kkal.
      marginTrend: [
        ...MARGIN_TREND_HISTORY,
        {
          month: CURRENT_TREND_MONTH,
          planMarginPct: planMarginPct ?? 0,
          actualMarginPct: actualMarginPct ?? 0,
        },
      ],
    })
  }),

  http.get(`${CONTROLLING_API_BASE}/variance`, () => {
    const summaries = getControllingDb().projects.map(toSummary)

    const rows: VarianceRow[] = COST_CATEGORIES.map((category) => {
      const projects = summaries
        .map((p) => {
          const c = p.byCategory.find((cc) => cc.category === category)
          return c
            ? { projectId: p.id, name: p.name, plan: c.plan, actual: c.actual, variance: c.variance }
            : null
        })
        .filter((r) => r !== null)
      const plan = projects.reduce((s, r) => s + r.plan, 0)
      const actual = projects.reduce((s, r) => s + r.actual, 0)
      const variance = actual - plan
      return {
        category,
        plan,
        actual,
        variance,
        variancePct: plan > 0 ? variance / plan : null,
        // drill-down: legnagyobb eltérés elöl
        projects: [...projects].sort((a, b) => b.variance - a.variance),
      }
    }).filter((row) => row.projects.length > 0)

    return HttpResponse.json(rows)
  }),
]
