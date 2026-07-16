/**
 * modules/dms — Dokumentumtár (DMS) modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/DocsPage.tsx). Az MSW kontraktus-tükör
 * KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath export
 * lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { DmsDashboard } from './pages/DmsDashboard'
export { LibraryScreen } from './pages/LibraryScreen'
export { ExpiringScreen } from './pages/ExpiringScreen'
