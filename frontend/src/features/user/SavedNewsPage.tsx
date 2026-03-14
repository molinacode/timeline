import { BasePage } from '@/components/layout/BasePage'
import { TimelineArticleCard } from '@/components/TimelineArticleCard'
import { useSavedArticles } from '@/hooks/useSavedArticles'
import { useNavigate } from 'react-router-dom'
<<<<<<< HEAD
=======
import { useAuth } from '../../app/providers/AuthProvider'
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker'
import { BasePage } from '../../components/layout/BasePage'
import { TimelineArticleCard } from '../../components/TimelineArticleCard'
import { apiUrl } from '@/config/api'
import type { NewsItem } from '../../types/news'

interface SavedItem extends NewsItem {
  savedId: number
  savedAt?: string | null
  notes?: string | null
}
>>>>>>> feature/frontend-mobile-ui

export function SavedNewsPage() {
  const { saved, toggleSaved, isSaved } = useSavedArticles()
  const navigate = useNavigate()
<<<<<<< HEAD
=======

  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(apiUrl('/api/me/saved'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          throw new Error('Error al cargar noticias guardadas')
        }
        const data = await res.json()
        if (!cancelled) {
          setItems(Array.isArray(data) ? (data as SavedItem[]) : [])
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'No se pudieron cargar las noticias guardadas')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleRemove(savedId: number) {
    if (!token || removingId != null) return
    setRemovingId(savedId)
    try {
      const res = await fetch(apiUrl(`/api/me/saved/${savedId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Error al quitar la noticia guardada')
      }
      setItems((prev) => prev.filter((i) => i.savedId !== savedId))
    } catch {
      setError('No se pudo quitar la noticia')
    } finally {
      setRemovingId(null)
    }
  }
>>>>>>> feature/frontend-mobile-ui

  return (
    <BasePage title="Noticias guardadas">
      <div className="app-page-section">
        {saved.length === 0 ? (
          <p className="app-muted-inline">
            Aún no has guardado ninguna noticia. Usa el icono 💾 en las tarjetas para guardarlas aquí.
          </p>
        ) : (
<<<<<<< HEAD
          <div className="app-flex-col app-grid-responsive">
            {saved.map((item, idx) => (
              <TimelineArticleCard
                key={`${item.link}-${idx}`}
                item={item}
                formatDate
                isSaved={isSaved(item)}
                onSaveClick={() => toggleSaved(item)}
                onReaderClick={() =>
                  navigate(`/me/reader?url=${encodeURIComponent(item.link)}`)
                }
                onShareClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: item.title,
                        text: item.description || item.title,
                        url: item.link,
                      })
                    } else {
                      await navigator.clipboard.writeText(item.link)
                      // eslint-disable-next-line no-alert
                      alert('Enlace copiado al portapapeles')
                    }
                  } catch {
                    // usuario canceló o error silencioso
=======
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
                    navigate('/reader', {
                      state: { item: article, fromTab: 'Guardadas' },
                    })
>>>>>>> feature/frontend-mobile-ui
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </BasePage>
  )
}

