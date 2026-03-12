import type { NewsItem } from '../types/news'
import { NewsImage } from './NewsImage'

interface TimelineArticleCardProps {
  item: NewsItem
  formatDate?: boolean
  onLinkClick?: (source: string, link: string) => void
  // API clásica basada en id
  onSave?: (newsId: number) => void
  saving?: boolean
  onOpenReader?: (item: NewsItem) => void
  // API nueva basada en item completo
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
      ? getRelativeTimeFromNow(item.pubDate)
      : item.pubDate
    : ''

  return (
    <article className="app-card app-article-card">
      <NewsImage src={item.image} />
      <div className="app-article-card-body">
        <div className="app-article-card-header">
          <span className="app-article-card-source">{item.source}</span>
          {item.programName && (
            <span className="app-article-card-program">{item.programName}</span>
          )}
        </div>
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
          {dateStr && <span className="app-article-card-date">{dateStr}</span>}
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

function getRelativeTimeFromNow(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Hace un momento'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `Hace ${diffDays} días`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `Hace ${diffMonths} meses`

  const diffYears = Math.floor(diffMonths / 12)
  return `Hace ${diffYears} años`
}
