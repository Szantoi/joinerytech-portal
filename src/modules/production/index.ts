/**
 * modules/production — Production modul PUBLIKUS API-ja (EHS README-minta).
 *
 * Csak a diszpécser-oldal (src/App.tsx ProductionWorldPage) által ténylegesen
 * használt világ-képernyőket + a productionKeys kulcs-gyárat exportálja. Az
 * MSW kontraktus-tükör KÜLÖN belépési pont (./mocks), hogy a világ lazy
 * chunkjába ne kerüljön mock-kód. Modulon belül maradj a relatív importoknál.
 */
export { ProductionDashboard } from './pages/ProductionDashboard'
export { CuttingPlansScreen } from './pages/CuttingPlansScreen'
export { CuttingExecutionScreen } from './pages/CuttingExecutionScreen'
export { DoorOrdersScreen } from './pages/DoorOrdersScreen'
export { QuotesScreen } from './pages/QuotesScreen'
export { CuttingAnalyticsScreen } from './pages/CuttingAnalyticsScreen'
export { productionKeys } from './services/keys'
