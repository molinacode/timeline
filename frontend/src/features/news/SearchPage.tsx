import { useEffect, useState } from 'react'
import { BasePage } from '../../components/layout/BasePage'
import { TimelineArticleCard } from '../../components/TimelineArticleCard'
import { apiUrl } from '@/config/api'
import { useAuth } from '../../app/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'

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

const BIAS_OPTIONS = [
  { value: '', label: 'Cualquier sesgo' },
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
  { value: 'progressive', label: 'Progresista' },
  { value: 'centrist', label: 'Centrista' },
  { value: 'conservative', label: 'Conservador' },
]

function formatDateRange(from: string, to: string): string {
  if (!from && !to) return ''
  const fromStr = from ? new Date(from).toISOString().slice(0, 10) : ''
  const toStr = to ? new Date(to).toISOString().slice(0, 10) : ''
  if (fromStr && toStr) return `${fromStr} — ${toStr}`
  return fromStr || toStr
}

export function SearchPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [category, setCategory] = useState('')
  const [bias, setBias] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  function buildSearchUrl(): string {
    const params = new URLSearchParams()
    params.set('q', query.trim())
    if (from.trim()) params.set('from', from.trim())
    if (to.trim()) params.set('to', to.trim())
    if (category.trim()) params.set('category', category.trim())
    if (bias.trim()) params.set('bias', bias.trim())
    return `${apiUrl('/api/search')}?${params.toString()}`
  }

  async function doSearch() {
    if (!query.trim() || query.trim().length < 2) {
      setError('Escribe al menos 2 caracteres para buscar.')
      return
    }
    setError(null)
    setLoading(true)
    setHasSearched(true)
    try {
      const res = await fetch(buildSearchUrl())
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json?.message || 'Error en la búsqueda')
        setResults([])
        return
      }
      const data: SearchResponse = await res.json()
      setResults(data.items || [])
    } catch {
      setError('Error de conexión')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch()
  }

  const resultToNewsItem = (item: SearchResultItem) => ({
    title: item.title,
    link: item.link,
    description: item.description,
    pubDate: item.pubDate || undefined,
    image: item.image,
    source: item.sourceName || '',
  })

  return (
    <BasePage
      title="Buscar noticias"
      subtitle="Búsqueda con filtros por fecha, categoría y sesgo."
    >
      <div className="app-page-section">
        <form onSubmit={handleSubmit} className="app-search-form">
          <div className="app-search-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Palabra clave (mín. 2 caracteres)"
              className="app-input app-search-input"
              autoFocus
              minLength={2}
            />
            <button type="submit" className="app-button app-btn-primary" disabled={loading}>
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          <div className="app-search-filters">
            <label className="app-search-filter">
              <span>Desde (fecha)</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="app-input app-input--sm"
              />
            </label>
            <label className="app-search-filter">
              <span>Hasta (fecha)</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="app-input app-input--sm"
              />
            </label>
            <label className="app-search-filter">
              <span>Categoría</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Politica"
                className="app-input app-input--sm"
              />
            </label>
            <label className="app-search-filter">
              <span>Sesgo</span>
              <select
                value={bias}
                onChange={(e) => setBias(e.target.value)}
                className="app-input app-input--sm"
              >
                {BIAS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'any'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(from || to) && (
            <p className="app-muted-inline app-search-filter-hint">
              Rango: {formatDateRange(from, to)}
            </p>
          )}
        </form>

        {error && (
          <p className="app-form-message app-form-message--error">{error}</p>
        )}

        {hasSearched && !loading && (
          <>
            {results.length === 0 ? (
              <p className="app-muted-inline">
                No se encontraron resultados para &quot;{query}&quot;.
                Prueba otros términos o filtros.
              </p>
            ) : (
              <p className="app-muted-inline app-search-result-count">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </p>
            )}
            <div className="app-flex-col app-grid-responsive">
              {results.map((item) => (
                <TimelineArticleCard
                  key={item.id}
                  item={resultToNewsItem(item)}
                  formatDate
                  categoryLabel={item.category}
                  onReaderClick={
                    token
                      ? () =>
                          navigate(
                            `/me/reader?url=${encodeURIComponent(item.link)}`
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </BasePage>
  )
}
