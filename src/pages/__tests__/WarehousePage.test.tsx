import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { WarehouseWorldPage } from '../WarehousePage';
import { WAREHOUSE_DISPATCHER_KEYS } from '../warehouseScreenMap';
import { WORLDS } from '../../mocks/worlds';
import { createWarehouseWrapper } from '@joinerytech/world-warehouse/mocks';

/**
 * Diszpécser-kulcs őr: a worlds.ts warehouse-regiszterének MINDEN screen-kulcsát
 * a WarehouseWorldPage tényleges képernyővel szolgálja ki, és a WorldShell h1-e
 * a kulcshoz tartozó címet mondja. Ez fogja meg a „halott alias" osztályt
 * (pl. a korábbi 'stock' kulcs): ismeretlen kulcsnál a WorldShell a screens[0]
 * címére ('Áttekintés') esne vissza, miközben más képernyő renderel — az ilyen
 * fejléc-hazugság itt bukik, a browser-smoke ROUTES-listájától függetlenül.
 */

const WAREHOUSE_SCREENS = WORLDS.warehouse.screens;

function renderDispatcher(path: string) {
  return render(
    <Routes>
      <Route path="/w/warehouse" element={<WarehouseWorldPage />} />
      <Route path="/w/warehouse/:screen" element={<WarehouseWorldPage />} />
    </Routes>,
    { wrapper: createWarehouseWrapper([path]) }
  );
}

describe('WarehouseWorldPage diszpécser-kulcs őr', () => {
  it('a worlds.ts warehouse-regisztere létezik és nem üres', () => {
    expect(WAREHOUSE_SCREENS.length).toBeGreaterThanOrEqual(5);
  });

  it('a diszpécser kulcskészlete kulcsra egyezik a worlds.ts regiszterével (nincs halott alias, nincs kiszolgálatlan kulcs)', () => {
    const worldsKeys = [...WAREHOUSE_SCREENS.map((s) => s.key)].sort();
    const dispatcherKeys = [...WAREHOUSE_DISPATCHER_KEYS].sort();
    expect(dispatcherKeys).toEqual(worldsKeys);
  });

  it.each(WAREHOUSE_SCREENS.map((s) => [s.key, s.hu] as const))(
    'a(z) "%s" kulcs saját címmel renderel (h1 = "%s")',
    async (key, hu) => {
      renderDispatcher(`/w/warehouse/${key}`);
      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(hu);
      if (key !== WAREHOUSE_SCREENS[0].key) {
        // Ismeretlen kulcsnál a WorldShell a screens[0] címére esne vissza —
        // pontosan azt zárja ki ez az ág.
        expect(heading).not.toHaveTextContent(WAREHOUSE_SCREENS[0].hu);
      }
    }
  );

  it('ismeretlen screen-kulcs az áttekintésre esik vissza (kimondott fallback)', async () => {
    renderDispatcher('/w/warehouse/nem-letezo-kulcs');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(WAREHOUSE_SCREENS[0].hu);
  });
});
