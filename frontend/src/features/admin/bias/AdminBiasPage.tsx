/** Panel admin: gestión de fuentes por sesgo */
import { useEffect, useState } from 'react'
import { useAuth } from '../../../app/providers/AuthProvider'
import { AdminBiasProgressiveList } from './AdminBiasProgressiveList'
import { AdminBiasCentristList } from './AdminBiasCentristList'
import { AdminBiasConservativeList } from './AdminBiasConservativeList'
import type { BiasSource } from './AdminBiasProgressiveList'

interface SourcesByBias {
  progressive: BiasSource[]
  centrist: BiasSource[]
  conservative: BiasSource[]
}

export function AdminBiasPage() {
  const { token } = useAuth()
  const [data, setData] = useState<SourcesByBias | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSources() {
      try {
        if (!token) return

        const res = await fetch('/api/news/sources-by-bias', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Error al cargar fuentes por sesgo')

        const json: SourcesByBias = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSources()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="app-page-section">
        <p>Cargando fuentes por sesgo…</p>
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

  return (
    <div className="app-page-section">
      <h2 className="app-page-title">Fuentes por sesgo</h2>
      <p className="app-comparador-cell-source app-form-intro">
        Fuentes clasificadas según su orientación editorial. Las fuentes se
        cargan desde los archivos JSON: progresistas, centristas y
        conservadoras.
      </p>
      <div className="admin-bias-grid">
        <AdminBiasProgressiveList sources={data?.progressive ?? []} />
        <AdminBiasCentristList sources={data?.centrist ?? []} />
        <AdminBiasConservativeList sources={data?.conservative ?? []} />
      </div>
    </div>
  )
}
