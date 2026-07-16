/**
 * modules/maintenance — Karbantartás modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/MaintenancePage.tsx). Az MSW kontraktus-
 * tükör KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath
 * export lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { MaintenanceDashboard } from './pages/MaintenanceDashboard'
export { AssetsScreen } from './pages/AssetsScreen'
export { WorkOrdersScreen } from './pages/WorkOrdersScreen'
export { ScheduleScreen } from './pages/ScheduleScreen'
