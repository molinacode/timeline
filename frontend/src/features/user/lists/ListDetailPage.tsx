import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

type ListDetail = {
  id: number
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  sources: ListSource[]
}

type CatalogSource = { id: number; name: string }
type CustomSource = { id: number; name: string; rssUrl: string }

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState<ListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPublic, setEditPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addSourceOpen, setAddSourceOpen] = useState(false)
  const [catalogSources, setCatalogSources] = useState<CatalogSource[]>([])
  const [customSources, setCustomSources] = useState<CustomSource[]>([])
  const [addType, setAddType] = useState<'sourceId' | 'customSourceId'>('sourceId')
  const [addSourceId, setAddSourceId] = useState('')
  const [addCustomId, setAddCustomId] = useState('')
  const [adding, setAdding] = useState(false)

  const listId = id ? Number(id) : NaN

  useEffect(() => {
    if (!token || !Number.isFinite(listId)) return
    let cancelled = false
    fetch(apiUrl(`/api/me/lists/${listId}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Lista no encontrada')
        return res.json()
      })
      .then((data: ListDetail) => {
        if (!cancelled) {
          setList(data)
          setEditName(data.name)
          setEditDescription(data.description || '')
          setEditPublic(data.isPublic)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Error al cargar la lista')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token, listId])

  useEffect(() => {
    if (!token || !addSourceOpen) return
    Promise.all([
      fetch(apiUrl('/api/sources'), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .then((arr: { id: number; name: string }[]) => arr.map((s) => ({ id: s.id, name: s.name }))),
      fetch(apiUrl('/api/me/sources'), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .then((arr: { id: number; name: string; rssUrl: string }[]) =>
          arr.map((s) => ({ id: s.id, name: s.name, rssUrl: s.rssUrl || '' }))
        ),
    ]).then(([cat, custom]) => {
      setCatalogSources(Array.isArray(cat) ? cat : [])
      setCustomSources(Array.isArray(custom) ? custom : [])
    })
  }, [token, addSourceOpen])

  async function handleUpdateList(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !list) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/me/lists/${list.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          isPublic: editPublic,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Error al guardar')
        return
      }
      const data = await res.json()
      setList((prev) => (prev ? { ...prev, ...data, description: data.description ?? prev.description } : null))
      setEditMode(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteList() {
    if (!token || !list) return
    if (!confirm(`¿Eliminar la lista "${list.name}"?`)) return
    try {
      const res = await fetch(apiUrl(`/api/me/lists/${list.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) navigate('/me/lists', { replace: true })
      else setError('No se pudo eliminar la lista')
    } catch {
      setError('Error de conexión')
    }
  }

  async function handleRemoveSource(itemId: number) {
    if (!token || removingId != null) return
    setRemovingId(itemId)
    try {
      const res = await fetch(apiUrl(`/api/me/lists/${listId}/sources/${itemId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok && list) {
        setList({
          ...list,
          sources: list.sources.filter((s) => s.id !== itemId),
        })
      }
    } finally {
      setRemovingId(null)
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault()
    if (!token || adding) return
    const body =
      addType === 'sourceId'
        ? { sourceId: Number(addSourceId) }
        : { customSourceId: Number(addCustomId) }
    if (addType === 'sourceId' && !Number.isFinite(body.sourceId)) return
    if (addType === 'customSourceId' && !Number.isFinite(body.customSourceId)) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/me/lists/${listId}/sources`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'Error al añadir')
        return
      }
      if (list) {
        const name =
          data.sourceName ??
          (addType === 'sourceId'
            ? catalogSources.find((s) => s.id === Number(addSourceId))?.name
            : customSources.find((s) => s.id === Number(addCustomId))?.name) ??
          null
        setList({
          ...list,
          sources: [
            ...list.sources,
            {
              id: data.id,
              sourceId: data.sourceId ?? null,
              customSourceId: data.customSourceId ?? null,
              sourceName: name,
              type: addType === 'sourceId' ? 'source' : 'custom',
              createdAt: data.createdAt,
            },
          ],
        })
      }
      setAddSourceOpen(false)
      setAddSourceId('')
      setAddCustomId('')
    } catch {
      setError('Error de conexión')
    } finally {
      setAdding(false)
    }
  }

  if (loading || !list) {
    return (
      <BasePage title="Lista">
        <div className="app-page-section">
          {error ? (
            <p className="app-form-message app-form-message--error">{error}</p>
          ) : (
            <div className="app-empty-state">
              <p className="app-empty-state-message">Cargando…</p>
            </div>
          )}
        </div>
      </BasePage>
    )
  }

  return (
    <BasePage title={list.name} subtitle={list.description || undefined}>
      <div className="app-page-section">
        <p className="app-list-detail-back">
          <Link to="/me/lists" className="app-btn-link">
            ← Volver a Mis listas
          </Link>
        </p>
        {error && (
          <p className="app-form-message app-form-message--error">{error}</p>
        )}

        {editMode ? (
          <form onSubmit={handleUpdateList} className="app-form">
            <div className="app-form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="app-input"
                required
              />
            </div>
            <div className="app-form-group">
              <label>Descripción</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="app-input"
                rows={2}
              />
            </div>
            <div className="app-form-group">
              <label className="app-checkbox-label">
                <input
                  type="checkbox"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                />
                Lista pública
              </label>
            </div>
            <div className="app-form-actions">
              <button type="submit" className="app-button app-btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="app-button app-btn-secondary"
                onClick={() => setEditMode(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="app-list-detail-meta">
            <p className="app-muted-inline">
              {list.sources.length} fuente{list.sources.length !== 1 ? 's' : ''}
              {list.isPublic && ' · Pública'}
            </p>
            <div className="app-list-detail-actions">
              <button
                type="button"
                className="app-button app-btn-secondary"
                onClick={() => setEditMode(true)}
              >
                Editar
              </button>
              <button
                type="button"
                className="app-button app-button--danger"
                onClick={handleDeleteList}
              >
                Eliminar lista
              </button>
            </div>
          </div>
        )}

        <h2 className="app-card-title">Fuentes en esta lista</h2>
        <button
          type="button"
          className="app-button app-btn-secondary app-list-add-btn"
          onClick={() => setAddSourceOpen((o) => !o)}
        >
          {addSourceOpen ? 'Cerrar' : 'Añadir fuente'}
        </button>

        {addSourceOpen && (
          <form onSubmit={handleAddSource} className="app-card app-form app-list-add-form">
            <div className="app-form-group">
              <label>Tipo</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as 'sourceId' | 'customSourceId')}
                className="app-input"
              >
                <option value="sourceId">Fuente del catálogo</option>
                <option value="customSourceId">Mi fuente RSS</option>
              </select>
            </div>
            {addType === 'sourceId' && (
              <div className="app-form-group">
                <label>Fuente</label>
                <select
                  value={addSourceId}
                  onChange={(e) => setAddSourceId(e.target.value)}
                  className="app-input"
                  required
                >
                  <option value="">Seleccionar…</option>
                  {catalogSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {addType === 'customSourceId' && (
              <div className="app-form-group">
                <label>Mi fuente RSS</label>
                <select
                  value={addCustomId}
                  onChange={(e) => setAddCustomId(e.target.value)}
                  className="app-input"
                  required
                >
                  <option value="">Seleccionar…</option>
                  {customSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" className="app-button app-btn-primary" disabled={adding}>
              {adding ? 'Añadiendo…' : 'Añadir'}
            </button>
          </form>
        )}

        {list.sources.length === 0 ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">No hay fuentes en esta lista.</p>
          </div>
        ) : (
          <ul className="app-list-sources">
            {list.sources.map((s) => (
              <li key={s.id} className="app-list-source-item">
                <span className="app-list-source-name">{s.sourceName || 'Sin nombre'}</span>
                <button
                  type="button"
                  className="app-button app-button--sm app-button--danger"
                  onClick={() => handleRemoveSource(s.id)}
                  disabled={removingId === s.id}
                  title="Quitar de la lista"
                >
                  {removingId === s.id ? '…' : 'Quitar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BasePage>
  )
}
