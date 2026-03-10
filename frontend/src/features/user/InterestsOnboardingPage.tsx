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
        const res = await fetch(apiUrl('/api/categories'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(Array.isArray(data) ? data : [])
        } else {
          setCategories([])
        }
      } catch {
        setCategories([])
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

  function handleContinue() {
    setSaving(true)
    // En esta primera versión solo persistimos en localStorage.
    // Más adelante podemos enviar al backend (user_preferences).
    setTimeout(() => {
      setSaving(false)
      navigate('/me/timeline', { replace: true })
    }, 300)
  }

  return (
    <BasePage
      title="¿Qué te interesa?"
      subtitle="Selecciona las categorías y temas que más te interesan para personalizar tu TimeLine."
    >
      <div className="app-page-section">
        {loading ? (
          <p className="app-muted-inline">Cargando categorías…</p>
        ) : categories.length === 0 ? (
          <p className="app-muted-inline">
            Todavía no hay categorías configuradas. Pídele al administrador que cree algunas desde el panel de
            administración.
          </p>
        ) : (
          <>
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

