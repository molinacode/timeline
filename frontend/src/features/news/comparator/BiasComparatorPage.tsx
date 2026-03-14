/** Comparador: 15 noticias, 3 cards principales + lista otras fuentes (estilo ground.news) */
import { useState, useMemo } from 'react'
import { useAuth } from '../../../app/providers/AuthProvider'
import { BiasArticleCard } from './BiasArticleCard'
import { useNewsClickTracker } from '../../../hooks/useNewsClickTracker'
import { useBiasComparator } from '../../../hooks/useBiasComparator'

type BiasTab = 'all' | 'progressive' | 'centrist' | 'conservative'

export function BiasComparatorPage() {
  const { token } = useAuth()
  const { trackClick } = useNewsClickTracker()
  const { data, loading, error } = useBiasComparator(token)
  const [biasTab, setBiasTab] = useState<BiasTab>('all')

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
  const filteredGroups = useMemo(() => {
    if (biasTab === 'all') return groups
    return groups.filter((g) => g[biasTab] != null)
  }, [groups, biasTab])

  const tabs: { id: BiasTab; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'progressive', label: 'Progresista' },
    { id: 'centrist', label: 'Centrista' },
    { id: 'conservative', label: 'Conservador' },
  ]

  return (
    <div className="comparador-layout">
      <section
        className="comparador-copy"
        aria-labelledby="comparador-real-heading"
      >
        <div className="comparador-copy-inner">
          <h1 id="comparador-real-heading" className="comparador-headline">
            Comparador de sesgos
          </h1>
          <h2 className="comparador-subhead">
            Las 15 noticias más importantes. Una fuente progresista, centrista y
            conservadora por historia.
          </h2>
          <p className="comparador-desc">
            Compara cómo distintos medios cubren la misma historia política.
            Debajo de cada bloque, más fuentes que la cubren.
          </p>
        </div>
      </section>

      <div id="panel" className="app-page-section">
        <h2 className="comparador-section-title">
          Panel comparativo (estilo ground.news)
        </h2>
        <div className="comparador-tabs" role="tablist" aria-label="Filtrar por sesgo">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={biasTab === t.id}
              className={`comparador-tab ${biasTab === t.id ? 'comparador-tab--active' : ''}`}
              onClick={() => setBiasTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {filteredGroups.length === 0 ? (
          <div className="app-empty-state">
            <p className="app-empty-state-message">
              {groups.length === 0
                ? 'No se encontraron noticias coincidentes en las tres fuentes. Intenta más tarde.'
                : 'No hay historias en esta pestaña.'}
            </p>
          </div>
        ) : (
          <div className="comparador-stories">
            {filteredGroups.map((group, idx) => (
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
                {group.otherSources && group.otherSources.length > 0 && (
                  <div className="comparador-story-others">
                    <span className="comparador-others-label">
                      Otras fuentes que cubren esta noticia:
                    </span>
                    <div className="comparador-others-links">
                      {Array.from(
                        new Map(
                          group.otherSources.map((a) => [a.source, a])
                        ).values()
                      ).map((a, i) => (
                        <a
                          key={i}
                          href={a.link}
                          target="_blank"
                          rel="noreferrer"
                          className={`comparador-others-link comparador-others-link--${a.sourceBias || 'centrist'}`}
                          onClick={() => trackClick(a.source, a.link)}
                        >
                          {a.source}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
