import { useEffect, useState } from 'react'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'
import { useAuth } from '../../app/providers/AuthProvider'

type SearchResultItem = {
  id: number
  title: string
  description: string
  link: string
  image: string | null
  pubDate: string | null
  category: string | null
  sourceName: string | null
  bias: string | null
}

type SearchResponse = {
  q: string
  total: number
  items: SearchResultItem[]
}

type CategoryOption = { id: number; name: string }

const BIAS_OPTIONS = [
  { value: '', label: 'Cualquier sesgo' },
  { value: 'progressive', label: 'Progresista' },
  { value: 'centrist', label: 'Centrista' },
  { value: 'conservative', label: 'Conservador' },
]

export function SearchPage() {
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [biasFilter, setBiasFilter] = useState<string>('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (!token) return
    setCategoriesLoading(true)
    fetch(apiUrl('/api/categories'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name: string }[]) => {
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [token])

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setHasSearched(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        setHasSearched(true)

        const params = new URLSearchParams({ q: query.trim() })
        if (categoryId) params.set('category', categoryId)
        if (biasFilter) params.set('bias', biasFilter)
        const url = apiUrl(`/api/search?${params.toString()}`)
        const res = await fetch(url, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => null)
          setError(json?.message || 'No se pudo realizar la búsqueda.')
          setResults([])
          setLoading(false)
          return
        }

        const json: SearchResponse = await res.json()
        let items = Array.isArray(json.items) ? json.items : []
        if (categoryId && !url.includes('category=')) {
          const catName = categories.find((c) => String(c.id) === categoryId)?.name
          if (catName) items = items.filter((i) => i.category === catName)
        }
        if (biasFilter && !url.includes('bias=')) {
          const biasLabel = BIAS_OPTIONS.find((o) => o.value === biasFilter)?.label
          if (biasLabel) items = items.filter((i) => (i.bias || '').toLowerCase() === biasLabel.toLowerCase())
        }
        setResults(items)
      } catch (err) {
        if ((err as any).name === 'AbortError') return
        setError('Error de conexión al buscar noticias.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, categoryId, biasFilter, categories])

  return (
    <BasePage
      title="Buscar noticias"
      subtitle="Encuentra noticias por palabra clave en el contenido agregado por TimeLine."
      className="app-search-page"
    >
      <div className="app-page-section">
        <div className="app-search-input-wrapper">
          <input
            type="search"
            className="app-input app-input-search"
            placeholder="Buscar por título o descripción…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="app-search-filters">
          <label className="app-search-filter-label">
            <span>Categoría</span>
            <select
              className="app-input app-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="app-search-filter-label">
            <span>Sesgo</span>
            <select
              className="app-input app-select"
              value={biasFilter}
              onChange={(e) => setBiasFilter(e.target.value)}
              aria-label="Filtrar por sesgo"
            >
              {BIAS_OPTIONS.map((o) => (
                <option key={o.value || 'any'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="app-form-message app-form-message--error app-search-message">
            {error}
          </p>
        )}

        {!error && !loading && hasSearched && results.length === 0 && (
          <div className="app-empty-state">
            <p className="app-empty-state-message">No se han encontrado resultados.</p>
          </div>
        )}

        {loading && (
          <p className="app-search-message">Buscando noticias…</p>
        )}

        {!loading && results.length > 0 && (
          <ul className="app-search-results">
            {results.map((item) => (
              <li key={item.id} className="app-search-result-item">
                <article className="app-card app-search-card">
                  <header className="app-search-card-header">
                    {item.sourceName && (
                      <span className="app-search-card-source">{item.sourceName}</span>
                    )}
                    {item.category && (
                      <span className="app-search-card-category">{item.category}</span>
                    )}
                    {item.bias && (
                      <span className="app-search-card-bias-badge">{item.bias}</span>
                    )}
                  </header>
                  <div className="app-search-card-body">
                    <h2 className="app-search-card-title">{item.title}</h2>
                    {item.description && (
                      <p className="app-search-card-description">{item.description}</p>
                    )}
                  </div>
                  <footer className="app-search-card-footer">
                    <button
                      type="button"
                      className="app-btn-link"
                      onClick={() => window.open(item.link, '_blank')}
                    >
                      Abrir en la web original
                    </button>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BasePage>
  )
}
