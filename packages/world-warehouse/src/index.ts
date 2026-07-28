/**
 * modules/warehouse — a Warehouse modul PUBLIKUS API-ja (production-minta).
 *
 * Csak a diszpécser (src/pages/WarehousePage.tsx) által használt világ-
 * képernyőket + a warehouseKeys kulcs-gyárat exportálja. Az MSW kontraktus-
 * tükör KÜLÖN belépési pont (./mocks) — a világ lazy chunkjába nem kerülhet
 * mock-kód. Modulon belül maradj a relatív importoknál.
 */
export { WarehouseDashboard } from './pages/WarehouseDashboard';
export { StockScreen } from './pages/StockScreen';
export { OffcutsScreen } from './pages/OffcutsScreen';
export { MovementsScreen } from './pages/MovementsScreen';
export { ProcurementScreen } from './pages/ProcurementScreen';
export { warehouseKeys } from './services/keys';
