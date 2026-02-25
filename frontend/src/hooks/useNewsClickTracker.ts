import { useAuth } from '../app/providers/AuthProvider'
import { apiUrl } from '@/config/api'

/**
 * Registra un clic en una noticia para métricas de admin.
 */
export function useNewsClickTracker() {
  const { token } = useAuth()

  function trackClick(source: string, link?: string) {
    if (!token) return
    try {
      fetch(apiUrl('/api/news/click'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ source, link }),
      }).catch(() => {})
    } catch {
      // Ignorar errores
    }
  }

  return { trackClick }
}
