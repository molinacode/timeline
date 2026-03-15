import { useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { BasePage } from '../../components/layout/BasePage';
import { TimelineArticleCard } from '../../components/TimelineArticleCard';
import { Link } from 'react-router-dom';
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker';
import { apiUrl } from '@/config/api';
import type { NewsItem } from '@/types/news';

type ApiNewsItem = {
  id: number;
  sourceId: number;
  title: string;
  description: string | null;
  link: string;
  imageUrl: string | null;
  pubDate: string | null;
  createdAt: string;
  sourceName: string;
};

function toNewsItem(item: ApiNewsItem): NewsItem {
  return {
    id: item.id,
    title: item.title,
    link: item.link,
    description: item.description ?? '',
    pubDate: item.pubDate ?? undefined,
    image: item.imageUrl ?? undefined,
    source: item.sourceName,
  };
}

export function TimelinePage() {
  const { user } = useAuth();
  const { trackClick } = useNewsClickTracker();
  const [items, setItems] = useState<ApiNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl('/api/news?limit=80'));
        if (!res.ok) throw new Error('Error al cargar noticias');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user) {
    return (
      <BasePage
        centered
        title="Mi TimeLine"
        subtitle="Inicia sesión para ver tu timeline con noticias de las fuentes que sigues."
      >
        <Link to="/login" className="app-btn-primary">
          Iniciar sesión
        </Link>
      </BasePage>
    );
  }

  if (loading) {
    return (
      <BasePage title="Mi TimeLine" subtitle="Cargando noticias…">
        <div className="app-page-section" />
      </BasePage>
    );
  }

  return (
    <BasePage
      title="Mi TimeLine"
      subtitle="Noticias de las fuentes RSS configuradas. Se actualizan automáticamente."
    >
      <div className="app-page-section">
        {items.length === 0 ? (
          <p className="app-page-subtitle">
            Aún no hay noticias. Añade fuentes RSS en el panel de Admin y espera
            unos minutos a que se carguen.
          </p>
        ) : (
          <div className="app-flex-col">
            {items.map((item) => (
              <TimelineArticleCard
                key={item.id}
                item={toNewsItem(item)}
                formatDate
                onLinkClick={(source, link) =>
                  trackClick(source, link || item.link)
                }
              />
            ))}
          </div>
        )}
      </div>
    </BasePage>
  );
}
