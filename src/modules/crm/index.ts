/**
 * modules/crm — CRM modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/CrmPage.tsx). Az MSW kontraktus-tükör
 * KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath export
 * lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { CrmDashboard } from './pages/CrmDashboard'
export { PipelineScreen } from './pages/PipelineScreen'
export { LeadsScreen } from './pages/LeadsScreen'
export { OppsScreen } from './pages/OppsScreen'
export { TasksScreen } from './pages/TasksScreen'
export { ForecastScreen } from './pages/ForecastScreen'
