/**
 * Bloque "Distribución de sesgo" (estilo Ground News):
 * barra apilada L / C / R con porcentajes y resumen de fuentes por sesgo.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../../app/providers/AuthProvider'
import { apiUrl } from '@/config/api'

type SourceByBias = {
  id: string
  name: string
  url?: string
  rssUrl?: string
  bias: string
}

type SourcesByBiasResponse = {
  progressive: SourceByBias[]
  centrist: SourceByBias[]
  conservative: SourceByBias[]
}

const BIAS_LABELS: Record<string, string> = {
  progressive: 'Progresista',
  centrist: 'Centrista',
  conservative: 'Conservador',
}

const BIAS_COLORS = {
  progressive: 'var(--accent-crimson)',
  centrist: 'var(--accent-cerulean)',
  conservative: 'var(--accent-mint)',
}

export function BiasDistributionBlock() {
  const { token } = useAuth()
  const [data, setData] = useState<SourcesByBiasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setLoading(false)
      return
    }
    fetch(apiUrl('/api/news/sources-by-bias'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Error'))))
      .then((json: SourcesByBiasResponse) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las fuentes por sesgo')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <section className="bias-distribution" aria-label="Distribución de fuentes por sesgo">
        <p className="app-muted-inline">Cargando distribución…</p>
      </section>
    )
  }

  if (error || !data) {
    return null
  }

  const progressive = data.progressive?.length ?? 0
  const centrist = data.centrist?.length ?? 0
  const conservative = data.conservative?.length ?? 0
  const total = progressive + centrist + conservative
  if (total === 0) return null

  const pctP = Math.round((progressive / total) * 100)
  const pctC = Math.round((centrist / total) * 100)
  const pctCons = Math.round((conservative / total) * 100)

  return (
    <section
      className="bias-distribution"
      aria-label="Distribución de fuentes por sesgo"
    >
      <h2 className="bias-distribution-title">Distribución de fuentes por sesgo</h2>
      <p className="bias-distribution-subtitle">
        {total} fuentes en el comparador · Progresista / Centrista / Conservador
      </p>
      <div className="bias-distribution-bar-wrap" role="img" aria-label={`Progresista ${pctP}%, Centrista ${pctC}%, Conservador ${pctCons}%`}>
        <div
          className="bias-distribution-bar"
          style={{
            display: 'flex',
            height: '1.5rem',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: 'var(--surface-alt)',
          }}
        >
          {pctP > 0 && (
            <span
              className="bias-distribution-segment bias-distribution-segment--progressive"
              style={{
                width: `${pctP}%`,
                background: BIAS_COLORS.progressive,
              }}
              title={`Progresista: ${progressive} fuentes`}
            />
          )}
          {pctC > 0 && (
            <span
              className="bias-distribution-segment bias-distribution-segment--centrist"
              style={{
                width: `${pctC}%`,
                background: BIAS_COLORS.centrist,
              }}
              title={`Centrista: ${centrist} fuentes`}
            />
          )}
          {pctCons > 0 && (
            <span
              className="bias-distribution-segment bias-distribution-segment--conservative"
              style={{
                width: `${pctCons}%`,
                background: BIAS_COLORS.conservative,
              }}
              title={`Conservador: ${conservative} fuentes`}
            />
          )}
        </div>
      </div>
      <div className="bias-distribution-legend">
        <span className="bias-distribution-legend-item" style={{ color: BIAS_COLORS.progressive }}>
          Progresista {pctP}% ({progressive})
        </span>
        <span className="bias-distribution-legend-item" style={{ color: BIAS_COLORS.centrist }}>
          Centrista {pctC}% ({centrist})
        </span>
        <span className="bias-distribution-legend-item" style={{ color: BIAS_COLORS.conservative }}>
          Conservador {pctCons}% ({conservative})
        </span>
      </div>
      <div className="bias-distribution-sources">
        {(['progressive', 'centrist', 'conservative'] as const).map((key) => {
          const sources = data[key] || []
          if (sources.length === 0) return null
          const label = BIAS_LABELS[key] || key
          return (
            <div key={key} className="bias-distribution-source-group">
              <h3 className="bias-distribution-source-group-title" style={{ color: BIAS_COLORS[key] }}>
                {label}
              </h3>
              <ul className="bias-distribution-source-list">
                {sources.slice(0, 8).map((s) => (
                  <li key={s.id || s.name}>
                    <span className="bias-distribution-source-name">{s.name}</span>
                  </li>
                ))}
                {sources.length > 8 && (
                  <li className="app-muted-inline">+{sources.length - 8} más</li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
