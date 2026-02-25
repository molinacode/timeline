import { useEffect, useState } from 'react'
import type { ByBiasMatchedResponse } from '../types/news'
import { apiUrl } from '@/config/api'

export function useBiasComparator(token: string | null) {
  const [data, setData] = useState<ByBiasMatchedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchNews() {
      try {
        if (!token) {
          setError('Debes iniciar sesión para ver el comparador')
          setLoading(false)
          return
        }

        const res = await fetch(apiUrl('/api/news/by-bias-matched?limit=15'), {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error(
            res.status === 401 ? 'Sesión expirada' : 'Error al cargar noticias'
          )
        }

        const json: ByBiasMatchedResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNews()
    return () => {
      cancelled = true
    }
  }, [token])

  return { data, loading, error }
}
