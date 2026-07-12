import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui'
import { CallbackPage } from './auth/CallbackPage'
import { RequireAuth } from './auth/RequireAuth'
import { HomeScreen } from './components/layout/HomeScreen'
import { WorldShell } from './components/layout/WorldShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductionPage } from './pages/ProductionPage'
import { ProductionDashboardPage } from './pages/production/ProductionDashboardPage'
import { MovementsPage } from './pages/warehouse/MovementsPage'
import { SalesWorldPage } from './pages/SalesPage'
import { DesignWorldPage } from './pages/DesignPage'
import { WorkflowPage } from './pages/WorkflowPage'
import { InventoryPage } from './pages/InventoryPage'
import { ProcurementPage } from './pages/ProcurementPage'
import { CuttingAnalyticsPage } from './pages/CuttingAnalyticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopFloorPage } from './pages/ShopFloorPage'
import { ShopFloorKioskPage } from './pages/ShopFloorKioskPage'
import { CrmWorldPage } from './pages/CrmPage'
import { FinanceWorldPage } from './pages/FinancePage'
import { ProjectsWorldPage } from './pages/ProjectsPage'
import { LogisticsWorldPage } from './pages/LogisticsPage'
import { MfgPrepWorldPage } from './pages/MfgPrepPage'
import { SupervisorWorldPage } from './pages/SupervisorPage'
import { MasterdataWorldPage } from './pages/MasterdataPage'
import { TradeWorld } from './pages/TradeWorld'
import { InteriorWorldPage } from './pages/InteriorPage'
import { MaintenanceWorldPage } from './pages/MaintenancePage'
import { QualityWorldPage } from './pages/QualityPage'
import { EhsWorldPage } from './pages/EhsPage'
import { AttendanceWorldPage } from './pages/AttendancePage'
import { TasksWorldPage } from './pages/TasksPage'
import { DocsWorldPage } from './pages/DocsPage'
import { AiWorldPage } from './pages/AiPage'
import { ExecBiWorldPage } from './pages/ExecBiPage'
import { ShopWorldPage } from './pages/ShopPage'
import { HrWorldPage } from './pages/HrPage'
import { ControllingWorldPage } from './pages/ControllingPage'
import { ServiceWorldPage } from './pages/ServicePage'
import { LotsPage, ZoneMapPage, MovementLogPage } from './pages/warehouse/LotsPage'
import { ProductConfiguratorWizard } from './pages/ProductConfiguratorWizard'
import { BOMPreviewPage } from './pages/BOMPreviewPage'
import { WorkOrderSummary } from './pages/WorkOrderSummary'
import { SupplierPortalPage } from './pages/SupplierPortalPage'
import PublicQuoteRequestPage from './pages/PublicQuoteRequestPage'

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

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
    if (currentScreen === 'analytics') return <CuttingAnalyticsPage />
    return <ProductionPage initialTab="cutting" />
  }

  return (
    <WorldShell
      worldKey="production"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/production/${key}`)}
      onHome={() => navigate('/')}
    >
      <ErrorBoundary>
        <div key={currentScreen} className="contents">
          {renderContent()}
        </div>
      </ErrorBoundary>
    </WorldShell>
  )
}

function SettingsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'company'

  return (
    <WorldShell
      worldKey="settings"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/settings/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        <SettingsPage
          initialTab={currentScreen}
          onTabChange={(tab) => navigate(`/w/settings/${tab}`)}
        />
      </div>
    </WorldShell>
  )
}

function WarehouseWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'dash')        return <InventoryPage />
    if (currentScreen === 'inventory')   return <InventoryPage />
    if (currentScreen === 'procurement') return <ProcurementPage />
    if (currentScreen === 'movements')   return <MovementsPage />
    if (currentScreen === 'lots')        return <LotsPage />
    if (currentScreen === 'zones')       return <ZoneMapPage />
    if (currentScreen === 'movementlog') return <MovementLogPage />
    return <InventoryPage />
  }

  return (
    <WorldShell
      worldKey="warehouse"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/warehouse/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/quote-request" element={<PublicQuoteRequestPage />} />

        {/* Protected: world home (kártyák) */}
        <Route path="/w" element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        } />

        {/* Public: shopfloor kiosk (standalone, no auth) */}
        <Route path="/shopfloor" element={<ShopFloorKioskPage />} />

        {/* Protected: shopfloor (standalone) */}
        <Route path="/w/shopfloor" element={
          <RequireAuth>
            <ShopFloorPage />
          </RequireAuth>
        } />

        {/* Protected: supplier portal (standalone) */}
        <Route path="/supplier/portal" element={
          <RequireAuth>
            <SupplierPortalPage />
          </RequireAuth>
        } />

        {/* Protected: configurator flow */}
        <Route path="/configurator" element={
          <RequireAuth>
            <ProductConfiguratorWizard />
          </RequireAuth>
        } />
        <Route path="/configurator/preview/:configId" element={
          <RequireAuth>
            <BOMPreviewPage />
          </RequireAuth>
        } />
        <Route path="/work-orders/new/:configId" element={
          <RequireAuth>
            <WorkOrderSummary />
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
            <SalesWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/sales/:screen" element={
          <RequireAuth>
            <SalesWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/design" element={
          <RequireAuth>
            <DesignWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/design/:screen" element={
          <RequireAuth>
            <DesignWorldPage />
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
            <SettingsWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/settings/:screen" element={
          <RequireAuth>
            <SettingsWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/crm" element={
          <RequireAuth>
            <CrmWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/crm/:screen" element={
          <RequireAuth>
            <CrmWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/finance" element={
          <RequireAuth>
            <FinanceWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/finance/:screen" element={
          <RequireAuth>
            <FinanceWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/projects" element={
          <RequireAuth>
            <ProjectsWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/projects/:screen" element={
          <RequireAuth>
            <ProjectsWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/logistics" element={
          <RequireAuth>
            <LogisticsWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/logistics/:screen" element={
          <RequireAuth>
            <LogisticsWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/mfgprep" element={
          <RequireAuth>
            <MfgPrepWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/mfgprep/:screen" element={
          <RequireAuth>
            <MfgPrepWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/supervisor" element={
          <RequireAuth>
            <SupervisorWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/supervisor/:screen" element={
          <RequireAuth>
            <SupervisorWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/masterdata" element={
          <RequireAuth>
            <MasterdataWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/masterdata/:screen" element={
          <RequireAuth>
            <MasterdataWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/trade" element={
          <RequireAuth>
            <TradeWorld />
          </RequireAuth>
        } />

        <Route path="/w/interior" element={
          <RequireAuth>
            <InteriorWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/interior/:screen" element={
          <RequireAuth>
            <InteriorWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/maintenance" element={
          <RequireAuth>
            <MaintenanceWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/maintenance/:screen" element={
          <RequireAuth>
            <MaintenanceWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/quality" element={
          <RequireAuth>
            <QualityWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/quality/:screen" element={
          <RequireAuth>
            <QualityWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/ehs" element={
          <RequireAuth>
            <EhsWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/ehs/:screen" element={
          <RequireAuth>
            <EhsWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/attendance" element={
          <RequireAuth>
            <AttendanceWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/attendance/:screen" element={
          <RequireAuth>
            <AttendanceWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/tasks" element={
          <RequireAuth>
            <TasksWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/tasks/:screen" element={
          <RequireAuth>
            <TasksWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/docs" element={
          <RequireAuth>
            <DocsWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/docs/:screen" element={
          <RequireAuth>
            <DocsWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/ai" element={
          <RequireAuth>
            <AiWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/ai/:screen" element={
          <RequireAuth>
            <AiWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/execbi" element={
          <RequireAuth>
            <ExecBiWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/execbi/:screen" element={
          <RequireAuth>
            <ExecBiWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/shop" element={
          <RequireAuth>
            <ShopWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/shop/:screen" element={
          <RequireAuth>
            <ShopWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/hr" element={
          <RequireAuth>
            <HrWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/hr/:screen" element={
          <RequireAuth>
            <HrWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/kontrolling" element={
          <RequireAuth>
            <ControllingWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/kontrolling/:screen" element={
          <RequireAuth>
            <ControllingWorldPage />
          </RequireAuth>
        } />

        <Route path="/w/service" element={
          <RequireAuth>
            <ServiceWorldPage />
          </RequireAuth>
        } />
        <Route path="/w/service/:screen" element={
          <RequireAuth>
            <ServiceWorldPage />
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </AuthProvider>
    </QueryClientProvider>
  )
}
