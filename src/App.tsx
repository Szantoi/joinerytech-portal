import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { HomeScreen } from './components/layout/HomeScreen'
import { WorldShell } from './components/layout/WorldShell'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductionPage } from './pages/ProductionPage'
import { SalesPage } from './pages/SalesPage'
import { DesignPage } from './pages/DesignPage'
import { WorkflowPage } from './pages/WorkflowPage'
import { InventoryPage } from './pages/InventoryPage'
import { ProcurementPage } from './pages/ProcurementPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopFloorPage } from './pages/ShopFloorPage'

function HomePage() {
  const navigate = useNavigate()
  return (
    <HomeScreen
      onEnter={(world, screen) => {
        if (screen) {
          navigate(`/w/${world}/${screen}`)
        } else {
          navigate(`/w/${world}`)
        }
      }}
    />
  )
}

function WorldPage({ worldKey, children }: { worldKey: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <WorldShell
      worldKey={worldKey}
      screen={worldKey}
      onScreen={(key) => navigate(`/w/${worldKey}/${key}`)}
      onHome={() => navigate('/')}
    >
      {children}
    </WorldShell>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/w/production" element={<WorldPage worldKey="production"><DashboardPage /></WorldPage>} />
      <Route path="/w/production/:screen" element={<WorldPage worldKey="production"><ProductionPage /></WorldPage>} />

      <Route path="/w/sales" element={<WorldPage worldKey="sales"><SalesPage /></WorldPage>} />
      <Route path="/w/sales/:screen" element={<WorldPage worldKey="sales"><SalesPage /></WorldPage>} />

      <Route path="/w/design" element={<WorldPage worldKey="design"><DesignPage /></WorldPage>} />
      <Route path="/w/design/:screen" element={<WorldPage worldKey="design"><DesignPage /></WorldPage>} />

      <Route path="/w/warehouse" element={<WorldPage worldKey="warehouse"><InventoryPage /></WorldPage>} />
      <Route path="/w/warehouse/:screen" element={<WorldPage worldKey="warehouse"><InventoryPage /></WorldPage>} />

      <Route path="/w/shopfloor" element={<ShopFloorPage />} />

      <Route path="/w/settings" element={<WorldPage worldKey="settings"><SettingsPage /></WorldPage>} />
      <Route path="/w/settings/:screen" element={<WorldPage worldKey="settings"><SettingsPage /></WorldPage>} />

      <Route path="/w/orders" element={<WorldPage worldKey="production"><OrdersPage /></WorldPage>} />
      <Route path="/w/workflow" element={<WorldPage worldKey="production"><WorkflowPage /></WorldPage>} />
      <Route path="/w/procurement" element={<WorldPage worldKey="warehouse"><ProcurementPage /></WorldPage>} />
      <Route path="/w/analytics" element={<WorldPage worldKey="production"><AnalyticsPage /></WorldPage>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
