import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './features/news/HomePage'
import { DemoClusterPage } from './features/news/DemoClusterPage'
import { TimelineBiasPage } from './features/news/TimelineBiasPage'
import { SourcesPage } from './features/sources/SourcesPage'
import { TimelinePage } from './features/news/TimelinePage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { VerifyEmailPage } from './features/auth/VerifyEmailPage'
import { Layout } from './components/layout/Layout'
import { UserTimeline } from './features/user/UserTimeline'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { SourcesAdminPage } from './features/admin/SourcesAdminPage'
import { CategoriesAdminPage } from './features/admin/CategoriesAdminPage'
import { RssMetricsPage } from './features/admin/RssMetricsPage'
import { RequireRole } from './app/routing/RequireRole'
import { RequireAuth } from './app/routing/RequireAuth'
import { AdminLogsPage } from './features/admin/AdminLogsPage'
import { AdminUsersPage } from './features/admin/AdminUsersPage'
import { AdminBiasPage } from './features/admin/bias/AdminBiasPage'
import { BiasComparatorPage } from './features/news/comparator/BiasComparatorPage'
import { UserProfilePage } from './features/user/UserProfilePage'
import { CookieBanner } from './components/CookieBanner'
import { Analytics } from '@vercel/analytics/react'
import { SessionExpiredHandler } from './app/SessionExpiredHandler'

export function App() {
  return (
    <>
      <SessionExpiredHandler />
      <Layout>
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
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="/admin/sources" replace />} />
            <Route path="sources" element={<SourcesAdminPage />} />
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
      </Layout>
      <CookieBanner />
      <Analytics />
    </>
  )
}
