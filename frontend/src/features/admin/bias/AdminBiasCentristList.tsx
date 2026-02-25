/** Lista de fuentes centristas en el panel admin */
import type { BiasSource } from './AdminBiasProgressiveList'

interface AdminBiasCentristListProps {
  sources: BiasSource[]
}

export function AdminBiasCentristList({ sources }: AdminBiasCentristListProps) {
  return (
    <div className="admin-bias-section admin-bias-section--centrist">
      <h3 className="admin-bias-section-title">Centrista</h3>
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
