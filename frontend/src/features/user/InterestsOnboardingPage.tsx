import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

type Category = {
  id: number
  name: string
  description?: string | null
  icon?: string | null
  isSpecial?: boolean
}

export function InterestsOnboardingPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [catRes, intRes] = await Promise.all([
          fetch(apiUrl('/api/categories'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(apiUrl('/api/me/interests'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (cancelled) return
        if (catRes.ok) {
          const data = await catRes.json()
          setCategories(Array.isArray(data) ? data : [])
        }
        if (intRes.ok) {
          const json = await intRes.json()
          const ids = Array.isArray(json?.categories)
            ? (json.categories as (number | string)[]).map((c) => Number(c)).filter((n) => Number.isFinite(n))
            : []
          setSelectedIds(ids)
        }
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setMessage(null)
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/me/interests'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: selectedIds }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setMessage(json?.message || 'Error al guardar intereses')
        return
      }
      setMessage('Intereses guardados.')
      setTimeout(() => navigate('/me/timeline', { replace: true }), 800)
    } catch {
      setMessage('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BasePage
      title="¿Qué te interesa?"
      subtitle="Elige categorías para personalizar tu TimeLine."
    >
      <div className="app-page-section">
        {loading ? (
          <p className="app-muted-inline">Cargando categorías…</p>
        ) : categories.length === 0 ? (
          <p className="app-muted-inline">
            No hay categorías disponibles. El administrador puede crearlas en el panel de Admin.
          </p>
        ) : (
          <form onSubmit={handleSave}>
            <div className="app-interests-grid" role="group" aria-label="Categorías de interés">
              {categories.map((c) => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`app-category-chip app-interests-chip ${isSelected ? 'active' : ''} ${c.isSpecial ? 'app-category-chip--special' : ''}`}
                    onClick={() => toggle(c.id)}
                    title={c.description || undefined}
                  >
                    {c.icon && <span className="app-category-chip-icon">{c.icon}</span>}
                    <span>{c.name}</span>
                  </button>
                )
              })}
            </div>
            {message && (
              <p
                className={`app-form-message ${message.includes('guardados') ? 'app-form-message--success' : 'app-form-message--error'}`}
              >
                {message}
              </p>
            )}
            <div className="app-interests-actions">
              <button
                type="submit"
                className="app-button app-btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Continuar'}
              </button>
              <button
                type="button"
                className="app-button app-btn-secondary"
                onClick={() => navigate('/me/profile')}
              >
                Volver al perfil
              </button>
            </div>
          </form>
        )}
      </div>
    </BasePage>
  )
}
