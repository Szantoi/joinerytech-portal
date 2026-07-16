/**
 * modules/controlling — Kontrolling modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/ControllingPage.tsx). Az MSW kontraktus-
 * tükör KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath
 * export lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { DashboardScreen } from './pages/DashboardScreen'
export { PortfolioScreen } from './pages/PortfolioScreen'
export { MarginScreen } from './pages/MarginScreen'
export { VarianceScreen } from './pages/VarianceScreen'
export { AdjustmentsScreen } from './pages/AdjustmentsScreen'
