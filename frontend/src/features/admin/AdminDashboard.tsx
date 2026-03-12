import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

type AdminSummary = {
  sourcesTotal: number
  sourcesActive: number
  categoriesTotal: number
}

type SyncResult = {
  updated: number
  inserted: number
  deactivated: number
  activeCount: number
} | null

const ZERO_SUMMARY: AdminSummary = {
  sourcesTotal: 0,
  sourcesActive: 0,
  categoriesTotal: 0,
}

export function AdminDashboard() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<AdminSummary>(ZERO_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }

        const [sourcesRes, categoriesRes] = await Promise.all([
          fetch(apiUrl('/api/sources'), { headers }),
          fetch(apiUrl('/api/categories'), { headers }),
        ])

        if (!sourcesRes.ok || !categoriesRes.ok) {
          setSummary(ZERO_SUMMARY)
          return
        }

        const sources = await sourcesRes.json()
        const categories = await categoriesRes.json()

        const sourcesTotal = Array.isArray(sources) ? sources.length : 0
        const sourcesActive = Array.isArray(sources)
          ? sources.filter((s: { isActive?: boolean }) => s.isActive).length
          : 0
        const categoriesTotal = Array.isArray(categories)
          ? categories.length
          : 0

        setSummary({ sourcesTotal, sourcesActive, categoriesTotal })
      } catch {
        setSummary(ZERO_SUMMARY)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const runSyncNewsSources = async () => {
    if (!token || syncing) return
    setSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const res = await fetch(apiUrl('/api/admin/sync-news-sources'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSyncError(data.error || data.detail || 'Error al sincronizar')
        return
      }
      setSyncResult({
        updated: data.updated ?? 0,
        inserted: data.inserted ?? 0,
        deactivated: data.deactivated ?? 0,
        activeCount: data.activeCount ?? 0,
      })
      setSummary((prev) => ({
        ...prev,
        sourcesTotal: data.activeCount ?? prev.sourcesTotal,
        sourcesActive: data.activeCount ?? prev.sourcesActive,
      }))
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Error de conexión')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <BasePage
      title="Panel de administración"
      subtitle="Gestiona usuarios, categorías, fuentes RSS y supervisa el estado de los feeds."
    >
      <div className="app-page-section">
        <div className="app-admin-metrics">
          <p className="app-page-label app-page-label--normal">
            {loading && 'Cargando métricas…'}
            {!loading && (
              <>
                Fuentes: {summary.sourcesTotal} totales ({summary.sourcesActive}{' '}
                activas) · Categorías: {summary.categoriesTotal}
              </>
            )}
          </p>
          <div className="app-admin-sync-row">
            <button
              type="button"
              onClick={runSyncNewsSources}
              disabled={syncing || !token}
              className="app-button"
            >
              {syncing ? 'Sincronizando…' : 'Sincronizar fuentes con JSON'}
            </button>
            {syncResult && (
              <span className="app-page-label app-page-label--normal">
                {syncResult.updated} actualizadas, {syncResult.inserted} nuevas, {syncResult.deactivated} desactivadas. Activas: {syncResult.activeCount}
              </span>
            )}
            {syncError && <span className="app-admin-sync-error">{syncError}</span>}
          </div>
        </div>
        <nav className="app-nav-pills">
          <NavLink
            to="/admin/sources"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Fuentes
          </NavLink>
          <NavLink
            to="/admin/local-sources"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Fuentes locales
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Categorías
          </NavLink>
          <NavLink
            to="/admin/metrics"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Métricas RSS
          </NavLink>
          <NavLink
            to="/admin/bias"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Fuentes por sesgo
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </BasePage>
  )
}
