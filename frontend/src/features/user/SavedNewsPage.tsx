import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker'
import { apiUrl } from '@/config/api'
import { BasePage } from '../../components/layout/BasePage'
import { TimelineArticleCard } from '../../components/TimelineArticleCard'
import type { NewsItem } from '../../types/news'

interface SavedItem extends NewsItem {
  savedId: number
  savedAt: string
  notes?: string | null
}

export function SavedNewsPage() {
  const { token } = useAuth()
  const { trackClick } = useNewsClickTracker()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(apiUrl('/api/me/saved'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar noticias guardadas')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  function handleRemove(savedId: number) {
    if (!token || removingId != null) return
    setRemovingId(savedId)
    fetch(apiUrl(`/api/me/saved/${savedId}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al quitar')
        setItems((prev) => prev.filter((i) => i.savedId !== savedId))
      })
      .catch(() => setError('No se pudo quitar la noticia'))
      .finally(() => setRemovingId(null))
  }

  return (
    <BasePage
      title="Noticias guardadas"
      subtitle="Noticias que has guardado para leer más tarde."
    >
      <div className="app-page-section">
        {error && (
          <p className="app-muted-inline" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="app-muted-inline">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="app-muted-inline">
            Aún no has guardado ninguna noticia. En el timeline o el comparador puedes guardar
            noticias para verlas aquí.
          </p>
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
                  onLinkClick={(source, link) => trackClick(source, link || item.link)}
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
