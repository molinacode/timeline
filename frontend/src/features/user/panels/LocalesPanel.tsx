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
        <p className="app-muted-inline">Detectando ubicación…</p>
      ) : loading ? (
        <p className="app-muted-inline">Cargando noticias…</p>
      ) : items.length === 0 ? (
        <p className="app-muted-inline">No hay noticias disponibles para {regionName}.</p>
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
