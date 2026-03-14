import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BasePage } from '../../components/layout/BasePage'
import { TimelineArticleCard } from '../../components/TimelineArticleCard'
import { useAuth } from '../../app/providers/AuthProvider'
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker'
import { apiUrl } from '@/config/api'

type SavedItem = {
  savedId: number
  newsId: number
  title: string
  link: string
  description: string | null
  source: string
  pubDate: string | null
  image: string | null
}

export function SavedNewsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { trackClick } = useNewsClickTracker()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(apiUrl('/api/me/saved-news'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar guardadas')
        return res.json()
      })
      .then((data: SavedItem[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'No se pudieron cargar las noticias guardadas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  async function handleRemove(savedId: number) {
    if (!token) return
    setRemovingId(savedId)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/me/saved-news/${savedId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Error al quitar')
        return
      }
      setItems((prev) => prev.filter((i) => i.savedId !== savedId))
    } catch {
      setError('Error de conexión')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <BasePage
      title="Noticias guardadas"
      subtitle="Noticias que has guardado para leer más tarde."
    >
      <div className="app-page-section">
        {error && (
          <p className="app-form-message app-form-message--error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">Cargando…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">
              Aún no has guardado ninguna noticia. En el timeline o el comparador puedes guardar
              noticias para verlas aquí.
            </p>
          </div>
        ) : (
          <div className="app-flex-col">
            {items.map((item) => (
              <div key={item.savedId} className="app-card app-article-card-wrapper">
                <TimelineArticleCard
                  item={{
                    title: item.title,
                    link: item.link,
                    description: item.description,
                    source: item.source,
                    pubDate: item.pubDate,
                    image: item.image,
                  }}
                  formatDate
                  onLinkClick={(source, link) =>
                    trackClick(source, link || item.link)
                  }
                  onOpenReader={(article) =>
                    navigate(`/reader?url=${encodeURIComponent(article.link)}`, {
                      state: { item: article, fromTab: 'Guardadas' },
                    })
                  }
                />
                <div className="app-article-card-actions">
                  <button
                    type="button"
                    className="app-header-button"
                    disabled={removingId === item.savedId}
                    onClick={() => handleRemove(item.savedId)}
                    aria-label="Quitar de guardadas"
                  >
                    {removingId === item.savedId ? 'Quitando…' : 'Quitar de guardadas'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BasePage>
  )
}
