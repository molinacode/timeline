/** Card compartida para artículos del comparador por sesgo */
import type { BiasArticle } from '@/types/news'

type BiasSide = 'left' | 'center' | 'right'

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
    <a
      href={article.link}
      target="_blank"
      rel="noreferrer"
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
    </a>
  )
}
