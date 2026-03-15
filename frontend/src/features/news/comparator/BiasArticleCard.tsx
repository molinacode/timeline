/** Card compartida para artículos del comparador por sesgo. Al hacer clic abre la vista /article. */
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import type { BiasArticle, NewsItem } from '@/types/news'

type BiasSide = 'left' | 'center' | 'right'

function biasArticleToNewsItem(article: BiasArticle): NewsItem {
  return {
    title: article.title,
    link: article.link,
    description: article.description ?? '',
    source: article.source,
    pubDate: article.pubDate,
    image: article.image,
  }
}

interface BiasArticleCardProps {
  article: BiasArticle
  side: BiasSide
  onLinkClick?: () => void
}

export function BiasArticleCard({
  article,
  side,
  onLinkClick,
}: BiasArticleCardProps) {
  const headlineClass =
    side === 'left'
      ? 'comparador-card__headline comparador-card__headline--left'
      : side === 'center'
        ? 'comparador-card__headline comparador-card__headline--center'
        : 'comparador-card__headline comparador-card__headline--right'

  return (
    <Link
      to={ROUTES.ARTICLE}
      state={{ item: biasArticleToNewsItem(article) }}
      className={`comparador-card comparador-card--${side}`}
      onClick={onLinkClick}
    >
      {article.image && (
        <img
          src={article.image}
          alt=""
          className="comparador-card__image"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="comparador-card__body">
        <span className="comparador-card__source">{article.source}</span>
        <span className={headlineClass}>{article.title}</span>
      </div>
    </Link>
  )
}
