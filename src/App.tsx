import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { CallbackPage } from './auth/CallbackPage'
import { RequireAuth } from './auth/RequireAuth'
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
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<CallbackPage />} />

        {/* Protected: shopfloor (standalone) */}
        <Route path="/w/shopfloor" element={
          <RequireAuth>
            <ShopFloorPage />
          </RequireAuth>
        } />

        {/* Protected: world routes */}
        <Route path="/w/production" element={
          <RequireAuth>
            <WorldPage worldKey="production"><DashboardPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/production/:screen" element={
          <RequireAuth>
            <WorldPage worldKey="production"><ProductionPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="/w/sales" element={
          <RequireAuth>
            <WorldPage worldKey="sales"><SalesPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/sales/:screen" element={
          <RequireAuth>
            <WorldPage worldKey="sales"><SalesPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="/w/design" element={
          <RequireAuth>
            <WorldPage worldKey="design"><DesignPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/design/:screen" element={
          <RequireAuth>
            <WorldPage worldKey="design"><DesignPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="/w/warehouse" element={
          <RequireAuth>
            <WorldPage worldKey="warehouse"><InventoryPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/warehouse/:screen" element={
          <RequireAuth>
            <WorldPage worldKey="warehouse"><InventoryPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="/w/settings" element={
          <RequireAuth>
            <WorldPage worldKey="settings"><SettingsPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/settings/:screen" element={
          <RequireAuth>
            <WorldPage worldKey="settings"><SettingsPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="/w/orders" element={
          <RequireAuth>
            <WorldPage worldKey="production"><OrdersPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/workflow" element={
          <RequireAuth>
            <WorldPage worldKey="production"><WorkflowPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/procurement" element={
          <RequireAuth>
            <WorldPage worldKey="warehouse"><ProcurementPage /></WorldPage>
          </RequireAuth>
        } />
        <Route path="/w/analytics" element={
          <RequireAuth>
            <WorldPage worldKey="production"><AnalyticsPage /></WorldPage>
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
