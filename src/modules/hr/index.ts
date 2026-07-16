/**
 * modules/hr — HR modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell ténylegesen használ: a világ-képernyőket
 * a diszpécser-oldalnak (src/pages/HrPage.tsx). Az MSW kontraktus-tükör
 * KÜLÖN belépési pont (./mocks — a csomagosításnál "./mocks" subpath export
 * lesz), hogy a világ lazy chunkjába ne kerüljön mock-kód.
 * Modulon belül maradj a relatív importoknál.
 */
export { HrDashboard } from './pages/HrDashboard'
export { PeopleScreen } from './pages/PeopleScreen'
export { CapacityScreen } from './pages/CapacityScreen'
export { AbsencesScreen } from './pages/AbsencesScreen'
export { SkillsScreen } from './pages/SkillsScreen'
export { TimeLogsScreen } from './pages/TimeLogsScreen'
