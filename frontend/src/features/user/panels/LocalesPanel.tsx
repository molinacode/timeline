import { TimelineArticleCard } from '@/components/TimelineArticleCard'
import type { NewsItem } from '@/types/news'

interface LocalesPanelProps {
  items: NewsItem[]
  loading: boolean
  geoLoading: boolean
  regionName: string
  isDefaultMadrid: boolean
  onLinkClick: (source: string, link: string) => void
}

export function LocalesPanel({
  items,
  loading,
  geoLoading,
  regionName,
  isDefaultMadrid,
  onLinkClick,
}: LocalesPanelProps) {
  return (
    <section
      id="panel-locales"
      role="tabpanel"
      aria-labelledby="tab-locales"
      className="app-timeline-panel"
    >
      <h2 className="app-card-title">Noticias locales</h2>
      <p className="app-card-subtitle app-page-subtitle--tight">
        {isDefaultMadrid
          ? 'Madrid por defecto (activa la geolocalización para ver noticias de tu región).'
          : `Noticias de ${regionName}.`}
      </p>
      {geoLoading ? (
        <div className="app-empty-state">
          <p className="app-empty-state-message">Detectando ubicación…</p>
        </div>
      ) : loading ? (
        <div className="app-empty-state">
          <p className="app-empty-state-message">Cargando noticias…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="app-empty-state">
          <p className="app-empty-state-message">No hay noticias disponibles para {regionName}.</p>
        </div>
      ) : (
        <div className="app-flex-col">
          {items.map((item, idx) => (
            <TimelineArticleCard
              key={`${item.link}-${idx}`}
              item={item}
              formatDate
              onLinkClick={() => onLinkClick(item.source, item.link)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
