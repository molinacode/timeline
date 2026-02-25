import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'

type LogData = {
  errors: Array<{
    id: number
    method: string
    path: string
    status_code: number
    error_message: string | null
    created_at: string
  }>
  sessions: Array<{
    id: number
    user_id: number
    email: string
    name: string
    created_at: string
    expires_at: string
  }>
  fetch_logs: Array<{
    id: number
    source_id: number
    source_name: string | null
    source_rss_url?: string | null
    status: string
    items_fetched: number
    error_message: string | null
    created_at: string
  }>
  server_status?: string
}

export function AdminLogsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<LogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'errors' | 'sessions' | 'fetch' | 'server'>('errors')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/logs', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading) {
    return (
      <BasePage title="Logs" subtitle="Registro de actividad de la aplicación">
        <p>Cargando logs…</p>
      </BasePage>
    )
  }

  if (!data) {
    return (
      <BasePage title="Logs" subtitle="Registro de actividad de la aplicación">
        <p>No se pudieron cargar los logs.</p>
      </BasePage>
    )
  }

  const fetchErrors = data.fetch_logs.filter((f) => f.status !== 'ok' || f.error_message)

  return (
    <BasePage
      title="Logs"
      subtitle="Errores de la aplicación, fuentes, acceso y estado del servidor"
    >
      <div className="app-page-section">
        <nav className="app-nav-pills">
          <button
            type="button"
            className={tab === 'errors' ? 'active' : ''}
            onClick={() => setTab('errors')}
          >
            Errores app ({data.errors.length})
          </button>
          <button
            type="button"
            className={tab === 'fetch' ? 'active' : ''}
            onClick={() => setTab('fetch')}
          >
            Errores fuentes ({fetchErrors.length})
          </button>
          <button
            type="button"
            className={tab === 'sessions' ? 'active' : ''}
            onClick={() => setTab('sessions')}
          >
            Conexiones ({data.sessions.length})
          </button>
          <button
            type="button"
            className={tab === 'server' ? 'active' : ''}
            onClick={() => setTab('server')}
          >
            Estado servidor
          </button>
        </nav>

        {tab === 'errors' && (
          <div className="app-logs-table-wrapper">
            <p className="app-card-subtitle app-page-subtitle--tight">
              Errores HTTP de la aplicación (acceso denegado, rutas no encontradas, errores del servidor, etc.).
            </p>
            <table className="app-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {data.errors.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No hay errores registrados</td>
                  </tr>
                ) : (
                  data.errors.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.created_at).toLocaleString('es-ES')}</td>
                      <td>{e.method}</td>
                      <td>
                        <code>{e.path}</code>
                      </td>
                      <td>
                        <span
                          className={`app-status-badge app-status-badge--${
                            e.status_code >= 500
                              ? 'error'
                              : e.status_code >= 400
                              ? 'warn'
                              : 'ok'
                          }`}
                        >
                          {e.status_code}
                        </span>
                      </td>
                      <td className="app-logs-message">
                        {e.error_message || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="app-logs-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Conectado desde</th>
                  <th>Expira</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No hay sesiones activas</td>
                  </tr>
                ) : (
                  data.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
                      <td>{new Date(s.expires_at).toLocaleString('es-ES')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'fetch' && (
          <div className="app-logs-table-wrapper">
            <p className="app-card-subtitle app-page-subtitle--tight">
              Fuentes que no cargan, URLs mal configuradas, timeouts y errores de agregación RSS.
            </p>
            <table className="app-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Fuente</th>
                  <th>URL RSS</th>
                  <th>Estado</th>
                  <th>Items</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {fetchErrors.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay errores de fuentes registrados</td>
                  </tr>
                ) : (
                  fetchErrors.map((f) => (
                    <tr key={f.id}>
                      <td>{new Date(f.created_at).toLocaleString('es-ES')}</td>
                      <td>{f.source_name || `ID ${f.source_id}`}</td>
                      <td className="app-table-cell-break">
                        <code>{f.source_rss_url || '-'}</code>
                      </td>
                      <td>
                        <span
                          className={`app-status-badge app-status-badge--${
                            f.status === 'ok' ? 'ok' : 'error'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td>{f.items_fetched}</td>
                      <td className="app-logs-message">
                        {f.error_message || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'server' && (
          <div className="app-card app-card--spaced">
            <h3 className="app-page-title app-page-title--sm">Estado del servidor</h3>
            <p className="app-card-subtitle app-page-subtitle--tight">
              Estado general de la aplicación.
            </p>
            <div className="app-server-status">
              <span className="app-status-badge app-status-badge--ok">
                {data.server_status === 'ok' ? 'Operativo' : data.server_status || 'OK'}
              </span>
              <p className="app-muted-inline app-server-status-note">
                Los logs se actualizan en tiempo real. Revisa las pestañas de errores para diagnosticar problemas.
              </p>
            </div>
          </div>
        )}
      </div>
    </BasePage>
  )
}
