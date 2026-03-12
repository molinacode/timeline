import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { BasePage } from '@/components/layout/BasePage'
import { apiUrl } from '@/config/api'

type LocalSourceRow = {
  id: number
  regionId: string
  regionName: string | null
  name: string
  websiteUrl: string | null
  rssUrl: string | null
  isActive: boolean
  lastFetched: string | null
  lastStatus: string | null
  lastErrorMessage: string | null
}

export function LocalSourcesAdminPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<LocalSourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(apiUrl('/api/admin/local-sources-with-status'), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          throw new Error('Error al cargar fuentes locales')
        }
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Error al cargar fuentes locales'
        )
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const regions = Array.from(
    new Map(
      rows.map((r) => [r.regionId, r.regionName || r.regionId])
    ).entries()
  )

  const filtered = rows.filter((r) => {
    if (regionFilter !== 'all' && r.regionId !== regionFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      (r.websiteUrl || '').toLowerCase().includes(q) ||
      (r.rssUrl || '').toLowerCase().includes(q)
    )
  })

  return (
    <BasePage
      title="Fuentes locales"
      subtitle="Monitorea las fuentes locales por región, su RSS y el estado del último fetch."
    >
      <div className="app-page-section">
        <div className="app-admin-filters-row">
          <label className="auth-label">
            Región
            <select
              className="app-input"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              {regions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-label auth-label-flex">
            Buscar
            <input
              className="app-input"
              placeholder="Nombre, web o RSS…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <p className="app-page-subtitle app-page-subtitle--tight">
            Cargando fuentes locales…
          </p>
        ) : error ? (
          <p className="auth-error app-message">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="app-page-subtitle app-page-subtitle--tight">
            No hay fuentes locales que coincidan con los filtros.
          </p>
        ) : (
          <div className="app-logs-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Región</th>
                  <th>Fuente</th>
                  <th>Web</th>
                  <th>RSS</th>
                  <th>Activo</th>
                  <th>Último estado</th>
                  <th>Último error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.regionName || r.regionId}</td>
                    <td>{r.name}</td>
                    <td className="app-table-cell-break">
                      {r.websiteUrl ? <code>{r.websiteUrl}</code> : '-'}
                    </td>
                    <td className="app-table-cell-break">
                      {r.rssUrl ? <code>{r.rssUrl}</code> : '-'}
                    </td>
                    <td>{r.isActive ? 'Sí' : 'No'}</td>
                    <td>
                      {r.lastStatus ? (
                        <span
                          className={`app-status-badge app-status-badge--${
                            r.lastStatus === 'ok'
                              ? 'ok'
                              : r.lastStatus === 'empty'
                              ? 'warn'
                              : 'error'
                          }`}
                        >
                          {r.lastStatus}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="app-logs-message">
                      {r.lastErrorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BasePage>
  )
}

