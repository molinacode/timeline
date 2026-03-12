import { BasePage } from '@/components/layout/BasePage'
import { TimelineArticleCard } from '@/components/TimelineArticleCard'
import { useSavedArticles } from '@/hooks/useSavedArticles'
import { useNavigate } from 'react-router-dom'

export function SavedNewsPage() {
  const { saved, toggleSaved, isSaved } = useSavedArticles()
  const navigate = useNavigate()

  return (
    <BasePage title="Noticias guardadas">
      <div className="app-page-section">
        {saved.length === 0 ? (
          <p className="app-muted-inline">
            Aún no has guardado ninguna noticia. Usa el icono 💾 en las tarjetas para guardarlas aquí.
          </p>
        ) : (
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

