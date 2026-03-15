/** Comparador: 15 noticias, 3 cards principales + lista otras fuentes (estilo ground.news) */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { BiasArticleCard } from './BiasArticleCard'
import { BiasDistributionBlock } from './BiasDistributionBlock'
import { useNewsClickTracker } from '../../../hooks/useNewsClickTracker'
import { useBiasComparator } from '../../../hooks/useBiasComparator'
import type { BiasGroup, BiasArticle, NewsItem } from '@/types/news'

function biasArticleToNewsItem(a: BiasArticle): NewsItem {
  return {
    title: a.title || 'Noticia',
    link: a.link,
    description: a.description ?? '',
    source: a.source,
    pubDate: a.pubDate,
    image: a.image,
  }
}

const COMPARATOR_MOBILE_BREAKPOINT = 768

function getFaviconFromLink(link: string | null | undefined): string | null {
  if (!link) return null
  try {
    const url = new URL(link)
    return `${url.origin}/favicon.ico`
  } catch {
    return null
  }
}

function getGroupBiasCounts(group: BiasGroup) {
  const others = group.otherSources ?? []
  const progressive =
    (group.progressive ? 1 : 0) + others.filter((a) => a.sourceBias === 'progressive').length
  const centrist =
    (group.centrist ? 1 : 0) + others.filter((a) => a.sourceBias === 'centrist').length
  const conservative =
    (group.conservative ? 1 : 0) + others.filter((a) => a.sourceBias === 'conservative').length
  return { progressive, centrist, conservative }
}

type BiasCounts = { progressive: number; centrist: number; conservative: number }

function getMajorityBias(counts: BiasCounts): 'progressive' | 'centrist' | 'conservative' {
  const { progressive, centrist, conservative } = counts
  if (progressive >= centrist && progressive >= conservative) return 'progressive'
  if (centrist >= conservative) return 'centrist'
  return 'conservative'
}

function getMajorityArticle(group: BiasGroup): BiasArticle | null {
  const counts = getGroupBiasCounts(group)
  const majority = getMajorityBias(counts)
  return group[majority]
}

export function BiasComparatorPage() {
  const { token } = useAuth()
  const { trackClick } = useNewsClickTracker()
  const { data, loading, error } = useBiasComparator(token)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < COMPARATOR_MOBILE_BREAKPOINT : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < COMPARATOR_MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (loading) {
    return (
      <div className="app-page-section">
        <p className="comparator-loading">Cargando noticias por sesgo…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page-section">
        <div className="app-card app-card--spaced">
          <p className="comparator-error">{error}</p>
        </div>
      </div>
    )
  }

  const groups = data?.groups ?? []

  return (
    <div className="comparador-layout">
      <div className="app-page-section comparador-bias-distribution-wrap">
        <BiasDistributionBlock />
      </div>

      <div id="panel" className="app-page-section">
        {groups.length === 0 ? (
          <p className="comparator-column-empty">
            No se encontraron noticias coincidentes en las tres fuentes. Intenta
            más tarde.
          </p>
        ) : (
          <div className="comparador-stories">
            {groups.map((group, idx) => {
              const counts = getGroupBiasCounts(group)
              const total =
                counts.progressive + counts.centrist + counts.conservative
              const pctP = total > 0 ? Math.round((counts.progressive / total) * 100) : 0
              const pctC = total > 0 ? Math.round((counts.centrist / total) * 100) : 0
              const pctCons = total > 0 ? Math.round((counts.conservative / total) * 100) : 0
              const majorityArticle = getMajorityArticle(group)
              const majorityBias = majorityArticle
                ? (majorityArticle.sourceBias === 'progressive'
                    ? 'left'
                    : majorityArticle.sourceBias === 'conservative'
                      ? 'right'
                      : 'center') as 'left' | 'center' | 'right'
                : 'center'

              const othersContent = (
                <>
                  <div className="comparador-story-bar-wrap">
                    <div
                      className="comparador-story-bar"
                      role="img"
                      aria-label={`Progresista ${pctP}%, Centrista ${pctC}%, Conservador ${pctCons}%`}
                    >
                      {pctP > 0 && (
                        <span
                          className="bias-distribution-segment bias-distribution-segment--progressive"
                          style={{
                            width: `${pctP}%`,
                            background: 'var(--accent-crimson)',
                          }}
                          title={`Progresista: ${counts.progressive} fuentes`}
                        />
                      )}
                      {pctC > 0 && (
                        <span
                          className="bias-distribution-segment bias-distribution-segment--centrist"
                          style={{
                            width: `${pctC}%`,
                            background: 'var(--accent-cerulean)',
                          }}
                          title={`Centrista: ${counts.centrist} fuentes`}
                        />
                      )}
                      {pctCons > 0 && (
                        <span
                          className="bias-distribution-segment bias-distribution-segment--conservative"
                          style={{
                            width: `${pctCons}%`,
                            background: 'var(--accent-mint)',
                          }}
                          title={`Conservador: ${counts.conservative} fuentes`}
                        />
                      )}
                    </div>
                  </div>
                  {group.otherSources && group.otherSources.length > 0 && (
                    <div className="comparador-story-others">
                      <span className="comparador-others-label">
                        Otras fuentes que cubren esta noticia:
                      </span>
                      <div className="comparador-others-links">
                        {Array.from(
                          new Map(group.otherSources.map((a) => [a.source, a])).values()
                        ).map((a, i) => {
                          const bias = a.sourceBias || 'centrist'
                          const biasClass = `comparador-others-link--${bias}`
                          const altText = `Abrir noticia en ${a.source}`
                          const initial =
                            a.source && a.source.length > 0
                              ? a.source.charAt(0).toUpperCase()
                              : '?'
                          const logoSrc = getFaviconFromLink(a.link)

                          return (
                            <Link
                              key={i}
                              to={ROUTES.ARTICLE}
                              state={{ item: biasArticleToNewsItem(a) }}
                              className={`comparador-others-link ${biasClass}`}
                              onClick={() => trackClick(a.source, a.link)}
                              aria-label={altText}
                            >
                              <span className="comparador-others-logo" aria-hidden="true">
                                {logoSrc ? (
                                  <img
                                    src={logoSrc}
                                    alt={a.source}
                                    className="comparador-others-logo-img"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <span className="comparador-others-logo-initial">
                                    {initial}
                                  </span>
                                )}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )

              if (isMobile) {
                return (
                  <article
                    key={idx}
                    className="comparador-story-card app-card app-card--spaced comparador-story-card--mobile"
                  >
                    {group.tags && group.tags.length > 0 && (
                      <div className="comparador-story-tags">
                        {group.tags.map((tag: string, i: number) => (
                          <span key={i} className="comparador-story-tag">
                            ⚡ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {majorityArticle ? (
                      <>
                        <div className="comparador-story-mobile-single">
                          <BiasArticleCard
                            article={majorityArticle}
                            side={majorityBias}
                            onLinkClick={() =>
                              trackClick(majorityArticle.source, majorityArticle.link)
                            }
                          />
                        </div>
                        {othersContent}
                      </>
                    ) : (
                      <span className="comparator-column-empty">No hay artículo para esta noticia.</span>
                    )}
                  </article>
                )
              }

              return (
                <article
                  key={idx}
                  className="comparador-story-card app-card app-card--spaced"
                >
                  {group.tags && group.tags.length > 0 && (
                    <div className="comparador-story-tags">
                      {group.tags.map((tag: string, i: number) => (
                        <span key={i} className="comparador-story-tag">
                          ⚡ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="comparador-story-main">
                    <div className="text-left comparador-story-col">
                      <span className="comparador-bias-label comparador-bias-label--progressive">
                        Progresista
                      </span>
                      {group.progressive ? (
                        <BiasArticleCard
                          article={group.progressive}
                          side="left"
                          onLinkClick={() =>
                            trackClick(
                              group.progressive!.source,
                              group.progressive!.link
                            )
                          }
                        />
                      ) : (
                        <span className="comparator-column-empty">—</span>
                      )}
                    </div>
                    <div className="text-center comparador-story-col">
                      <span className="comparador-bias-label comparador-bias-label--centrist">
                        Centrista
                      </span>
                      {group.centrist ? (
                        <BiasArticleCard
                          article={group.centrist}
                          side="center"
                          onLinkClick={() =>
                            trackClick(
                              group.centrist!.source,
                              group.centrist!.link
                            )
                          }
                        />
                      ) : (
                        <span className="comparator-column-empty">—</span>
                      )}
                    </div>
                    <div className="text-right comparador-story-col">
                      <span className="comparador-bias-label comparador-bias-label--conservative">
                        Conservadora
                      </span>
                      {group.conservative ? (
                        <BiasArticleCard
                          article={group.conservative}
                          side="right"
                          onLinkClick={() =>
                            trackClick(
                              group.conservative!.source,
                              group.conservative!.link
                            )
                          }
                        />
                      ) : (
                        <span className="comparator-column-empty">—</span>
                      )}
                    </div>
                  </div>
                  {othersContent}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
