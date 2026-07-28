import { stockHandlers } from './handlers.stock';
import { offcutHandlers } from './handlers.offcuts';
import { procurementHandlers } from './handlers.procurement';
import { movementsHandlers } from './handlers.movements';

/**
 * Warehouse MSW kontraktus-tükör — KÜLÖN belépési pont (a modul gyökér-barrelje
 * NEM exportálja, hogy a világ lazy chunkjába ne kerüljön mock-kód; a globális
 * worker a src/mocks/handlers.ts-ből, a node-tesztek innen importálják).
 */
export const warehouseHandlers = [
  ...stockHandlers,
  ...offcutHandlers,
  ...procurementHandlers,
  ...movementsHandlers,
];

export { warehouseMockDb } from './db';
export {
  SEED_STOCK_ITEMS, SEED_OFFCUTS, SEED_RESERVATIONS, SEED_MOVEMENTS,
  SEED_SUPPLIERS, SEED_PURCHASE_ORDERS, SEED_REQUISITIONS, SEED_TENANT_ID,
} from './seed';
