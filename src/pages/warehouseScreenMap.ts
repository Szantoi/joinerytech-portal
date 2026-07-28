import {
  StockScreen,
  OffcutsScreen,
  MovementsScreen,
  ProcurementScreen,
} from '@joinerytech/world-warehouse';

/**
 * A warehouse-diszpécser képernyő-térképe és teljes kulcskészlete — a
 * worlds.ts warehouse-regiszterével kulcsra egyezőnek KELL lennie (őr:
 * src/pages/__tests__/WarehousePage.test.tsx). Alias-kulcs itt tilos: a
 * WorldShell fejléce a worlds.ts-ből címez, ismeretlen kulcsra az áttekintés
 * címére esne vissza (fejléc-hazugság). Külön fájl a WarehousePage mellől:
 * a react-refresh szabály komponens-fájlból nem enged konstans-exportot.
 */
export const WAREHOUSE_SCREEN_COMPONENTS = {
  inventory: StockScreen,
  offcuts: OffcutsScreen,
  movements: MovementsScreen,
  procurement: ProcurementScreen,
} as const;

export const WAREHOUSE_DISPATCHER_KEYS = ['dash', ...Object.keys(WAREHOUSE_SCREEN_COMPONENTS)];
