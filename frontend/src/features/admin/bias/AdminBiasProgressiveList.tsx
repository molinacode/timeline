/** Lista de fuentes progresistas en el panel admin */
export interface BiasSource {
  id: string
  name: string
  url: string
  rssUrl: string
  bias: string
}

interface AdminBiasProgressiveListProps {
  sources: BiasSource[]
}

export function AdminBiasProgressiveList({
  sources,
}: AdminBiasProgressiveListProps) {
  return (
    <div className="admin-bias-section admin-bias-section--progressive">
      <h3 className="admin-bias-section-title">Progresista</h3>
      <p className="admin-bias-section-count">{sources.length} fuentes</p>
      <ul className="admin-bias-source-list">
        {sources.map((s) => (
          <li key={s.id} className="admin-bias-source-item">
            <span className="admin-bias-source-name">{s.name}</span>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="admin-bias-source-link"
            >
              {s.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
