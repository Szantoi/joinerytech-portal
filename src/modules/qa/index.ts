/**
 * modules/qa — Minőségbiztosítás (QA) modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/QualityPage.tsx). Az MSW kontraktus-tükör
 * KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath export
 * lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { QaDashboard } from './pages/QaDashboard'
export { InspectionsScreen } from './pages/InspectionsScreen'
export { TicketsScreen } from './pages/TicketsScreen'
export { TrendScreen } from './pages/TrendScreen'
