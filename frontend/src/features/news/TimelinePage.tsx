import { useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { BasePage } from '../../components/layout/BasePage';
import { Link } from 'react-router-dom';
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker';

type NewsItem = {
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

export function TimelinePage() {
  const { user } = useAuth();
  const { trackClick } = useNewsClickTracker();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/news?limit=80');
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
              <article key={item.id} className="app-card app-article-card">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="user-timeline-img app-article-card-media"
                  />
                )}
                <div className="app-article-card-body">
                  <h2 className="app-page-title app-headline-link">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="app-link-inherit"
                      onClick={() => trackClick(item.sourceName, item.link)}
                    >
                      {item.title}
                    </a>
                  </h2>
                  {item.description && (
                    <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight">
                      {item.description}
                    </p>
                  )}
                  <p className="app-comparador-cell-source app-timeline-meta">
                    {item.sourceName}
                    {item.pubDate
                      ? ` · ${new Date(item.pubDate).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}`
                      : ''}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </BasePage>
  );
}
