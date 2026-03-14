import type { NewsItem } from '../types/news'
import { NewsImage } from './NewsImage'

interface TimelineArticleCardProps {
  item: NewsItem
  formatDate?: boolean
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

  return (
    <article className="app-card app-article-card">
      <NewsImage src={item.image} />
      <div className="app-article-card-body">
        <h2 className="app-page-title app-headline-link">
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="app-link-inherit"
            onClick={() => onLinkClick?.(item.source, item.link)}
          >
            {item.title}
          </a>
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
          <div className="app-article-card-actions">
            {(onReaderClick || onOpenReader) && (
              <button
                type="button"
                className="app-header-button"
                onClick={() =>
                  onReaderClick ? onReaderClick() : onOpenReader?.(item)
                }
              >
                Ver en lector
              </button>
            )}
            {(onSaveClick || (onSave && item.id != null)) && (
              <button
                type="button"
                className="app-header-button"
                disabled={saving}
                onClick={() =>
                  onSaveClick ? onSaveClick() : onSave?.(item.id as number)
                }
                aria-label="Guardar noticia"
              >
                {saving
                  ? 'Guardando…'
                  : isSaved
                    ? 'Guardada'
                    : 'Guardar'}
              </button>
            )}
            {onShareClick && (
              <button
                type="button"
                className="app-header-button"
                onClick={onShareClick}
              >
                Compartir
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
