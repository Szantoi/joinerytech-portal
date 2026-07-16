/**
 * modules/ehs — EHS modul PUBLIKUS API-ja.
 *
 * Csak azt exportálja, amit a shell és más modulok ténylegesen használnak:
 *  - világ-képernyők a diszpécser-oldalnak (src/pages/EhsPage.tsx),
 *  - ehsKeys + useEhsLocations a shell-oldali EHS wizardnak
 *    (src/components/EHS — bejelentő FAB, minden világból elérhető),
 * Az MSW kontraktus-tükör KÜLÖN belépési pont (./mocks — a csomagosításnál
 * "./mocks" subpath export lesz), hogy a világ lazy chunkjába ne kerüljön
 * mock-kód. Modulon belül maradj a relatív importoknál.
 *
 * SZÁNDÉKOSAN NINCS itt: a ./pages/formFields űrlap-segédek (SelectField,
 * TextAreaField), pedig a controlling modul (AdjustmentForm) is használja
 * őket — KERESZT-MODUL függés. Ha a barrel-en át exportálnánk, a teljes EHS
 * világ közös chunkba emelkedne (~50 kB extra a controlling világnak), ezért
 * ott mély import marad; a MODULE-PACKAGES lépésben a formFields a
 * @joinerytech/ui-ba kerül és a kivétel megszűnik.
 */
export { EhsDashboard } from './pages/EhsDashboard'
export { IncidentsScreen } from './pages/IncidentsScreen'
export { RisksScreen } from './pages/RisksScreen'
export { SdsScreen } from './pages/SdsScreen'
export { PpeScreen } from './pages/PpeScreen'
export { WalksScreen } from './pages/WalksScreen'
export { ehsKeys } from './services/keys'
export { useEhsLocations } from './services/locations'
