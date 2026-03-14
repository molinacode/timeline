import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { BasePage } from '../../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

type ListSource = {
  id: number
  sourceId: number | null
  customSourceId: number | null
  sourceName: string | null
  type: string
  createdAt: string
}

type ListItem = {
  id: number
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  sources: ListSource[]
}

export function ListsListPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(apiUrl('/api/me/lists?withSources=1'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar listas')
        return res.json()
      })
      .then((data: ListItem[]) => {
        if (!cancelled) setLists(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'No se pudieron cargar las listas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  return (
    <BasePage
      title="Mis listas"
      subtitle="Organiza tus fuentes en listas personalizadas."
    >
      <div className="app-page-section">
        <div className="app-lists-actions">
          <Link to="/me/lists/new" className="app-button app-btn-primary">
            Nueva lista
          </Link>
        </div>

        {error && (
          <p className="app-form-message app-form-message--error">{error}</p>
        )}

        {loading ? (
          <p className="app-muted-inline">Cargando listas…</p>
        ) : lists.length === 0 ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">
              Aún no tienes listas. Crea una para agrupar fuentes.
            </p>
          </div>
        ) : (
          <ul className="app-lists-list">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  to={`/me/lists/${list.id}`}
                  className="app-card app-list-card"
                >
                  <div className="app-list-card-header">
                    <h2 className="app-card-title">{list.name}</h2>
                    <span className="app-list-card-count">
                      {list.sources.length} fuente{list.sources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {list.description && (
                    <p className="app-card-subtitle app-list-card-desc">
                      {list.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BasePage>
  )
}
