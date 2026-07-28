import { Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WorldShell } from '../components/layout/WorldShell';
import { RouteFallback } from '../components/layout/RouteFallback';
import { WarehouseDashboard } from '../modules/warehouse';
import { WAREHOUSE_SCREEN_COMPONENTS } from './warehouseScreenMap';

/**
 * Warehouse világ-diszpécser — kizárólag a modules/warehouse képernyőit
 * route-olja. A régi stone-* oldalak (LotsPage/ZoneMapPage/MovementLogPage,
 * src/pages/warehouse/) ki vannak vezetve a diszpécserből: mögöttük nincs
 * backend (lots/zones a domainben nem létezik), a „Backend endpoint nem
 * elérhető" bannerük hamis ígéret volt. A fájlok külön takarítási körben
 * kerülnek törlésre. Ismeretlen screen-kulcs → áttekintés.
 */
export function WarehouseWorldPage() {
  const navigate = useNavigate();
  const { screen } = useParams<{ screen?: string }>();
  const currentScreen = screen ?? 'dash';

  function renderContent() {
    const Screen = WAREHOUSE_SCREEN_COMPONENTS[currentScreen as keyof typeof WAREHOUSE_SCREEN_COMPONENTS];
    if (Screen) {
      return <Screen />;
    }
    return (
      <WarehouseDashboard
        onNavigateTab={(tab) => navigate(`/w/warehouse/${tab}`)}
      />
    );
  }

  return (
    <WorldShell
      worldKey="warehouse"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/warehouse/${key}`)}
      onHome={() => navigate('/')}
    >
      <Suspense fallback={<RouteFallback fullscreen={false} />}>
        <div key={currentScreen} className="contents">
          {renderContent()}
        </div>
      </Suspense>
    </WorldShell>
  );
}
