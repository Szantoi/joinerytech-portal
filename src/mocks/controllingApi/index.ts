import { projectHandlers } from './handlers.projects'
import { portfolioHandlers } from './handlers.portfolio'
import { adjustmentHandlers } from './handlers.adjustments'

/**
 * mocks/controllingApi — a Kontrolling modul MSW tükre (az ehsApi/crmApi
 * mintája). A backend (spaceos-modules-kontrolling) domainje KÉSZ, de host
 * nélkül (audit G0.1/G3.2) — ez a tükör a backend `/api/kontrolling`
 * kontraktusát követi, és a számított válaszokat (EAC/variance/fedezet)
 * ugyanazzal a calc-modullal adja, amit a UI is használ
 * (services/controlling/calc.ts — egy igazságforrás).
 * Tesztben: `setupServer(...controllingApiHandlers)` + `resetControllingDb()`.
 */
export const controllingApiHandlers = [
  ...projectHandlers,
  ...portfolioHandlers,
  ...adjustmentHandlers,
]

export { resetControllingDb, getControllingDb } from './db'
export { CONTROLLING_SEED_IDS } from './seed'
