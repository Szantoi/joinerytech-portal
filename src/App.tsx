import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { CallbackPage } from './auth/CallbackPage'
import { RequireAuth } from './auth/RequireAuth'
import { HomeScreen } from './components/layout/HomeScreen'
import { WorldShell } from './components/layout/WorldShell'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductionPage } from './pages/ProductionPage'
import { ProductionDashboardPage } from './pages/production/ProductionDashboardPage'
import { MovementsPage } from './pages/warehouse/MovementsPage'
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

function WorldPage({ worldKey, screen, children }: { worldKey: string; screen?: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <WorldShell
      worldKey={worldKey}
      screen={screen ?? worldKey}
      onScreen={(key) => navigate(`/w/${worldKey}/${key}`)}
      onHome={() => navigate('/')}
    >
      {children}
    </WorldShell>
  )
}

function ProductionWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'dash')      return <ProductionDashboardPage onScreen={(s) => navigate(`/w/production/${s}`)} />
    if (currentScreen === 'machining') return <ProductionPage initialTab="machining" />
    if (currentScreen === 'workflow')  return <WorkflowPage />
    if (currentScreen === 'analytics') return <AnalyticsPage />
    return <ProductionPage initialTab="cutting" />
  }

  return (
    <WorldShell
      worldKey="production"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/production/${key}`)}
      onHome={() => navigate('/')}
    >
      {renderContent()}
    </WorldShell>
  )
}

function WarehouseWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'movements') return <MovementsPage />
    return <InventoryPage />
  }

  return (
    <WorldShell
      worldKey="warehouse"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/warehouse/${key}`)}
      onHome={() => navigate('/')}
    >
      {renderContent()}
    </WorldShell>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/callback" element={<CallbackPage />} />

        {/* Protected: world home (kártyák) */}
        <Route path="/w" element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        } />

        {/* Protected: shopfloor (standalone) */}
        <Route path="/w/shopfloor" element={
          <RequireAuth>
            <ShopFloorPage />
          </RequireAuth>
        } />

        {/* Protected: world routes */}
        <Route path="/w/production" element={
          <RequireAuth>
            <ProductionWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/production/:screen" element={
          <RequireAuth>
            <ProductionWorldPage />
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
            <WarehouseWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/warehouse/:screen" element={
          <RequireAuth>
            <WarehouseWorldPage />
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
