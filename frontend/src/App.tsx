import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './features/news/HomePage'
import { SourcesPage } from './features/sources/SourcesPage'
import { TimelinePage } from './features/news/TimelinePage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { VerifyEmailPage } from './features/auth/VerifyEmailPage'
import { Layout } from './components/layout/Layout'
import { UserTimeline } from './features/user/UserTimeline'
import { RequireRole } from './app/routing/RequireRole'
import { RequireAuth } from './app/routing/RequireAuth'
import { BiasComparatorPage } from './features/news/comparator/BiasComparatorPage'
import { UserProfilePage } from './features/user/UserProfilePage'
import { CookieBanner } from './components/CookieBanner'
import { Analytics } from '@vercel/analytics/react'
import { SessionExpiredHandler } from './app/SessionExpiredHandler'
import { UserAgreementPage } from './features/legal/UserAgreementPage'

const DemoClusterPage = lazy(() =>
  import('./features/news/DemoClusterPage').then((m) => ({ default: m.DemoClusterPage }))
)
const TimelineBiasPage = lazy(() =>
  import('./features/news/TimelineBiasPage').then((m) => ({ default: m.TimelineBiasPage }))
)
const ReaderPage = lazy(() =>
  import('./features/news/reader/ReaderPage').then((m) => ({ default: m.ReaderPage }))
)
const AdminDashboard = lazy(() =>
  import('./features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
)
const SourcesAdminPage = lazy(() =>
  import('./features/admin/SourcesAdminPage').then((m) => ({ default: m.SourcesAdminPage }))
)
const LocalSourcesAdminPage = lazy(() =>
  import('./features/admin/LocalSourcesAdminPage').then((m) => ({ default: m.LocalSourcesAdminPage }))
)
const CategoriesAdminPage = lazy(() =>
  import('./features/admin/CategoriesAdminPage').then((m) => ({ default: m.CategoriesAdminPage }))
)
const RssMetricsPage = lazy(() =>
  import('./features/admin/RssMetricsPage').then((m) => ({ default: m.RssMetricsPage }))
)
const AdminBiasPage = lazy(() =>
  import('./features/admin/bias/AdminBiasPage').then((m) => ({ default: m.AdminBiasPage }))
)
const AdminLogsPage = lazy(() =>
  import('./features/admin/AdminLogsPage').then((m) => ({ default: m.AdminLogsPage }))
)
const AdminUsersPage = lazy(() =>
  import('./features/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
)

function LazyFallback() {
  return (
    <div className="app-empty-state">
      <p className="app-empty-state-message">Cargando…</p>
    </div>
  )
}

export function App() {
  return (
    <>
      <SessionExpiredHandler />
      <Layout>
        <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route
            path="/me/timeline"
            element={
              <RequireRole role="user">
                <UserTimeline />
              </RequireRole>
            }
          />
          <Route
            path="/me/comparator"
            element={
              <RequireAuth>
                <BiasComparatorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/me/profile"
            element={
              <RequireAuth>
                <UserProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/user-agreement"
            element={
              <RequireAuth>
                <UserAgreementPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reader"
            element={
              <RequireAuth>
                <ReaderPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="/admin/sources" replace />} />
            <Route path="sources" element={<SourcesAdminPage />} />
            <Route path="local-sources" element={<LocalSourcesAdminPage />} />
            <Route path="categories" element={<CategoriesAdminPage />} />
            <Route path="metrics" element={<RssMetricsPage />} />
            <Route path="bias" element={<AdminBiasPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
          <Route path="/demo/clusters" element={<DemoClusterPage />} />
          <Route path="/demo/bias" element={<TimelineBiasPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Layout>
      <CookieBanner />
      <Analytics />
    </>
  )
}
