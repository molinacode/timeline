import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'
import type { Category } from '../../types/category'

const STORAGE_KEY = 'timeline_interests_categories'

export function InterestsOnboardingPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as number[]
        if (Array.isArray(parsed)) {
          setSelectedIds(parsed)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        }

        const [categoriesRes, interestsRes] = await Promise.all([
          fetch(apiUrl('/api/categories'), { headers }),
          fetch(apiUrl('/api/me/interests'), { headers }),
        ])

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(Array.isArray(data) ? data : [])
        } else {
          setCategories([])
        }

        if (interestsRes.ok) {
          const json = await interestsRes.json()
          const idsFromBackend = Array.isArray(json.categories)
            ? (json.categories as (number | string)[])
                .map((c) => Number(c))
                .filter((n) => Number.isFinite(n) && n > 0)
            : []
          if (idsFromBackend.length > 0) {
            setSelectedIds(idsFromBackend)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(idsFromBackend))
          }
        }
      } catch {
        setCategories([])
        setError('No se pudieron cargar tus intereses. Inténtalo de nuevo más tarde.')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  function toggleCategory(id: number) {
    setSelectedIds((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  async function handleContinue() {
    if (!token) {
      navigate('/login')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const selectedCategories = selectedIds.map((id) => id.toString())

      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds))

      const res = await fetch(apiUrl('/api/me/interests'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: selectedCategories }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setError(
          json?.message || 'No se pudieron guardar tus intereses. Inténtalo de nuevo.'
        )
        setSaving(false)
        return
      }

      navigate('/me/timeline', { replace: true })
    } catch {
      setError('Error de conexión al guardar tus intereses.')
      setSaving(false)
    }
  }

  return (
    <BasePage
      title="¿Qué te interesa?"
      subtitle="Selecciona las categorías y temas que más te interesan para personalizar tu TimeLine."
    >
      <div className="app-page-section">
        {loading ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">Cargando categorías…</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">
              Todavía no hay categorías configuradas. Pídele al administrador que cree algunas desde el panel de
              administración.
            </p>
          </div>
        ) : (
          <>
            {error && <p className="app-form-message app-form-message--error">{error}</p>}
            <div className="app-interests-grid">
              {categories.map((cat) => {
                const selected = selectedIds.includes(cat.id)
                const isSpecial = !!cat.isSpecial
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`app-interest-chip ${
                      selected ? 'app-interest-chip--selected' : ''
                    } ${isSpecial ? 'app-interest-chip--special' : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.icon && <span className="app-interest-chip-icon">{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="app-interests-actions">
              <button
                type="button"
                className="app-btn-primary"
                onClick={handleContinue}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar y continuar'}
              </button>
            </div>
          </>
        )}
      </div>
    </BasePage>
  )
}

