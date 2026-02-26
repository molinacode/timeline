import type { NewsItem } from '../types/news'
import { NewsImage } from './NewsImage'

interface TimelineArticleCardProps {
  item: NewsItem
  formatDate?: boolean
  onLinkClick?: (source: string, link: string) => void
}

export function TimelineArticleCard({
  item,
  formatDate,
  onLinkClick,
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
        <p className="app-comparador-cell-source app-timeline-meta">
          {item.source}
          {item.programName ? ` · ${item.programName}` : ''}
          {dateStr ? ` · ${dateStr}` : ''}
        </p>
      </div>
    </article>
  )
}
