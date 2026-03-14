import { useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { apiUrl } from '@/config/api';

type ClickByUser = {
  user_name: string;
  email: string;
  source_name: string;
  clicks: number;
};

type ClickBySource = {
  source_name: string;
  total_clicks: number;
  unique_users: number;
};

type ClicksData = {
  byUser: ClickByUser[];
  bySource: ClickBySource[];
};

export function RssMetricsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<ClicksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiUrl('/api/admin/metrics/clicks'), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('Error al obtener métricas');
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Error al obtener métricas');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const maxClicks = data?.bySource?.[0]?.total_clicks ?? 1;

  return (
    <div className="app-page-section">
      <p className="app-page-subtitle app-form-intro">
        Noticias que los usuarios han clicado por fuente. Ejemplo: usuario X ha clicado Y noticias de esta fuente.
      </p>

      {loading && <p className="app-page-subtitle app-page-subtitle--tight">Cargando…</p>}
      {error && <p className="auth-error app-message-inline">{error}</p>}

      {!loading && !error && data && (
        <>
          <h3 className="app-page-title app-page-title--sm">Clics por fuente</h3>
          {data.bySource.length === 0 ? (
            <p className="app-muted-inline">Aún no hay clics registrados.</p>
          ) : (
            <div className="app-metrics-chart">
              {data.bySource.map((s) => (
                <div key={s.source_name} className="app-metrics-bar-row">
                  <span className="app-metrics-bar-label">{s.source_name}</span>
                  <div className="app-metrics-bar-track">
                    <div
                      className="app-metrics-bar-fill"
                      style={{ width: `${(s.total_clicks / maxClicks) * 100}%` }}
                    />
                  </div>
                  <span className="app-metrics-bar-value">
                    {s.total_clicks} clics ({s.unique_users} usuarios)
                  </span>
                </div>
              ))}
            </div>
          )}

          <h3 className="app-page-title app-page-title--sm app-metrics-detail-title">
            Detalle por usuario y fuente
          </h3>
          {data.byUser.length === 0 ? (
            <p className="app-muted-inline">No hay datos.</p>
          ) : (
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Fuente</th>
                    <th>Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byUser.map((r, i) => (
                    <tr key={`${r.user_name}-${r.source_name}-${i}`}>
                      <td>{r.user_name}</td>
                      <td>{r.email}</td>
                      <td>{r.source_name}</td>
                      <td>{r.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

