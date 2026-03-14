import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { BasePage } from '../../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

export function ListCreatePage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !name.trim()) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/me/lists'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.message || 'Error al crear la lista')
        return
      }
      navigate(`/me/lists/${data.id}`, { replace: true })
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BasePage
      title="Nueva lista"
      subtitle="Crea una lista para agrupar fuentes."
    >
      <div className="app-page-section">
        <form onSubmit={handleSubmit} className="app-form">
          <div className="app-form-group">
            <label htmlFor="list-name">Nombre *</label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-input"
              required
              placeholder="Ej: Medios favoritos"
            />
          </div>
          <div className="app-form-group">
            <label htmlFor="list-desc">Descripción</label>
            <textarea
              id="list-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="app-input"
              rows={2}
              placeholder="Opcional"
            />
          </div>
          <div className="app-form-group">
            <label className="app-checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Lista pública
            </label>
          </div>
          {error && (
            <p className="app-form-message app-form-message--error">{error}</p>
          )}
          <div className="app-form-actions">
            <button
              type="submit"
              className="app-button app-btn-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Creando…' : 'Crear lista'}
            </button>
            <button
              type="button"
              className="app-button app-btn-secondary"
              onClick={() => navigate('/me/lists')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </BasePage>
  )
}
