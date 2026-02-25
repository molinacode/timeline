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

const ZERO_SUMMARY: AdminSummary = {
  sourcesTotal: 0,
  sourcesActive: 0,
  categoriesTotal: 0,
}

export function AdminDashboard() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<AdminSummary>(ZERO_SUMMARY)
  const [loading, setLoading] = useState(true)

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
        </div>
        <nav className="app-nav-pills">
          <NavLink
            to="/admin/sources"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Fuentes
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
