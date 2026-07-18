import { lazy, Suspense, type ComponentType } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui'
import { CallbackPage } from './auth/CallbackPage'
import { RequireAuth } from './auth/RequireAuth'
import { HomeScreen } from './components/layout/HomeScreen'
import { WorldShell } from './components/layout/WorldShell'
import { RouteFallback } from './components/layout/RouteFallback'

/**
 * Route-level code splitting (UI_GAP_ANALYSIS §1 / Fázis 1.3).
 *
 * Every page below is its own lazy chunk — Vite splits on the dynamic
 * import()s, so the initial bundle only carries the shell (auth, layout,
 * providers). Pages use named exports, hence the `lazyPage` picker helper.
 * The single <Suspense> around <Routes> shows RouteFallback while a page
 * chunk loads; multi-screen world wrappers add a nested inline fallback so
 * the shell stays visible during screen switches.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint only; props stay fully typed per component
function lazyPage<M, C extends ComponentType<any>>(load: () => Promise<M>, pick: (m: M) => C) {
  return lazy(async () => ({ default: pick(await load()) }))
}

const LandingPage = lazyPage(() => import('./pages/LandingPage'), (m) => m.LandingPage)
const LoginPage = lazyPage(() => import('./pages/LoginPage'), (m) => m.LoginPage)
// Production world — MODULE-FOLDERS diszpécser-precedens (mint CrmPage/EhsPage):
// a képernyők ./modules/production alatt élnek, egyetlen lazy chunk mögött.
const ProductionWorldPage = lazyPage(() => import('./pages/ProductionPage'), (m) => m.ProductionWorldPage)
const MovementsPage = lazyPage(() => import('./pages/warehouse/MovementsPage'), (m) => m.MovementsPage)
const SalesWorldPage = lazyPage(() => import('./pages/SalesPage'), (m) => m.SalesWorldPage)
const DesignWorldPage = lazyPage(() => import('./pages/DesignPage'), (m) => m.DesignWorldPage)
const InventoryPage = lazyPage(() => import('./pages/InventoryPage'), (m) => m.InventoryPage)
const ProcurementPage = lazyPage(() => import('./pages/ProcurementPage'), (m) => m.ProcurementPage)
const SettingsPage = lazyPage(() => import('./pages/SettingsPage'), (m) => m.SettingsPage)
const ShopFloorPage = lazyPage(() => import('./pages/ShopFloorPage'), (m) => m.ShopFloorPage)
const ShopFloorKioskPage = lazyPage(() => import('./pages/ShopFloorKioskPage'), (m) => m.ShopFloorKioskPage)
const CrmWorldPage = lazyPage(() => import('./pages/CrmPage'), (m) => m.CrmWorldPage)
const FinanceWorldPage = lazyPage(() => import('./pages/FinancePage'), (m) => m.FinanceWorldPage)
const ProjectsWorldPage = lazyPage(() => import('./pages/ProjectsPage'), (m) => m.ProjectsWorldPage)
const LogisticsWorldPage = lazyPage(() => import('./pages/LogisticsPage'), (m) => m.LogisticsWorldPage)
const MfgPrepWorldPage = lazyPage(() => import('./pages/MfgPrepPage'), (m) => m.MfgPrepWorldPage)
const SupervisorWorldPage = lazyPage(() => import('./pages/SupervisorPage'), (m) => m.SupervisorWorldPage)
const MasterdataWorldPage = lazyPage(() => import('./pages/MasterdataPage'), (m) => m.MasterdataWorldPage)
const TradeWorld = lazyPage(() => import('./pages/TradeWorld'), (m) => m.TradeWorld)
const InteriorWorldPage = lazyPage(() => import('./pages/InteriorPage'), (m) => m.InteriorWorldPage)
const MaintenanceWorldPage = lazyPage(() => import('./pages/MaintenancePage'), (m) => m.MaintenanceWorldPage)
const QualityWorldPage = lazyPage(() => import('./pages/QualityPage'), (m) => m.QualityWorldPage)
const EhsWorldPage = lazyPage(() => import('./pages/EhsPage'), (m) => m.EhsWorldPage)
const AttendanceWorldPage = lazyPage(() => import('./pages/AttendancePage'), (m) => m.AttendanceWorldPage)
const TasksWorldPage = lazyPage(() => import('./pages/TasksPage'), (m) => m.TasksWorldPage)
const DocsWorldPage = lazyPage(() => import('./pages/DocsPage'), (m) => m.DocsWorldPage)
const AiWorldPage = lazyPage(() => import('./pages/AiPage'), (m) => m.AiWorldPage)
const ExecBiWorldPage = lazyPage(() => import('./pages/ExecBiPage'), (m) => m.ExecBiWorldPage)
const ShopWorldPage = lazyPage(() => import('./pages/ShopPage'), (m) => m.ShopWorldPage)
const HrWorldPage = lazyPage(() => import('./pages/HrPage'), (m) => m.HrWorldPage)
const ControllingWorldPage = lazyPage(() => import('./pages/ControllingPage'), (m) => m.ControllingWorldPage)
const ServiceWorldPage = lazyPage(() => import('./pages/ServicePage'), (m) => m.ServiceWorldPage)
const LotsPage = lazyPage(() => import('./pages/warehouse/LotsPage'), (m) => m.LotsPage)
const ZoneMapPage = lazyPage(() => import('./pages/warehouse/LotsPage'), (m) => m.ZoneMapPage)
const MovementLogPage = lazyPage(() => import('./pages/warehouse/LotsPage'), (m) => m.MovementLogPage)
const ProductConfiguratorWizard = lazyPage(() => import('./pages/ProductConfiguratorWizard'), (m) => m.ProductConfiguratorWizard)
const BOMPreviewPage = lazyPage(() => import('./pages/BOMPreviewPage'), (m) => m.BOMPreviewPage)
const WorkOrderSummary = lazyPage(() => import('./pages/WorkOrderSummary'), (m) => m.WorkOrderSummary)
const SupplierPortalPage = lazyPage(() => import('./pages/SupplierPortalPage'), (m) => m.SupplierPortalPage)
const PublicQuoteRequestPage = lazy(() => import('./pages/PublicQuoteRequestPage'))

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
      <Suspense fallback={<RouteFallback fullscreen={false} />}>
        <div key={currentScreen} className="contents">
          <SettingsPage
            initialTab={currentScreen}
            onTabChange={(tab) => navigate(`/w/settings/${tab}`)}
          />
        </div>
      </Suspense>
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
      <Suspense fallback={<RouteFallback fullscreen={false} />}>
        <div key={currentScreen} className="contents">{renderContent()}</div>
      </Suspense>
    </WorldShell>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        {/* Root Suspense: shows a token-styled full-page fallback while a lazy route chunk loads */}
        <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
      </ToastProvider>
    </AuthProvider>
    </QueryClientProvider>
  )
}
