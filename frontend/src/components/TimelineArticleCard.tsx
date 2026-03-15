import { Link } from 'react-router-dom'
import { ROUTES } from '../app/routes'
import type { NewsItem } from '../types/news'
import { NewsImage } from './NewsImage'

interface TimelineArticleCardProps {
  item: NewsItem
  formatDate?: boolean
  /** Etiqueta de categoría (pill tipo Squid) */
  categoryLabel?: string | null
  onLinkClick?: (source: string, link: string) => void
  onSave?: (newsId: number) => void
  saving?: boolean
  onOpenReader?: (item: NewsItem) => void
  isSaved?: boolean
  onSaveClick?: () => void
  onReaderClick?: () => void
  onShareClick?: () => void
}

export function TimelineArticleCard({
  item,
  formatDate,
  categoryLabel,
  onLinkClick,
  onSave,
  saving,
  onOpenReader,
  isSaved,
  onSaveClick,
  onReaderClick,
  onShareClick,
}: TimelineArticleCardProps) {
  const dateStr = item.pubDate
    ? formatDate
      ? new Date(item.pubDate).toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : item.pubDate
    : ''

  const cardContent = (
    <>
      <div className="app-article-card-media-wrap">
        {categoryLabel && (
          <span className="app-article-card-pill">{categoryLabel}</span>
        )}
        <NewsImage src={item.image} />
      </div>
      <div className="app-article-card-body">
        <h2 className="app-page-title app-headline-link">
          <span className="app-link-inherit">{item.title}</span>
        </h2>
        {item.description && (
          <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight app-article-description-clamp">
            {item.description}
          </p>
        )}
        <div className="app-article-card-footer">
          {(item.source || dateStr) && (
            <p className="app-comparador-cell-source app-timeline-meta">
              {item.source}
              {item.programName ? ` · ${item.programName}` : ''}
              {dateStr ? ` · ${dateStr}` : ''}
            </p>
          )}
          {(onReaderClick || onOpenReader || onSaveClick || (onSave && item.id != null) || onShareClick) && (
            <div
              className="app-article-card-actions"
              onClick={(e) => e.preventDefault()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              {(onReaderClick || onOpenReader) && (
                <button
                  type="button"
                  className="app-header-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onReaderClick ? onReaderClick() : onOpenReader?.(item)
                  }}
                >
                  Ver en lector
                </button>
              )}
              {(onSaveClick || (onSave && item.id != null)) && (
                <button
                  type="button"
                  className="app-header-button"
                  disabled={saving}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSaveClick ? onSaveClick() : onSave?.(item.id as number)
                  }}
                  aria-label="Guardar noticia"
                >
                  {saving ? 'Guardando…' : isSaved ? 'Guardada' : 'Guardar'}
                </button>
              )}
              {onShareClick && (
                <button
                  type="button"
                  className="app-header-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onShareClick()
                  }}
                >
                  Compartir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <article className="app-card app-article-card app-article-card--mobile-hero">
      <Link
        to={ROUTES.ARTICLE}
        state={{ item }}
        className="app-article-card-link"
        onClick={() => onLinkClick?.(item.source, item.link)}
        aria-label={`Abrir noticia: ${item.title}`}
      >
        {cardContent}
      </Link>
    </article>
  )
}
