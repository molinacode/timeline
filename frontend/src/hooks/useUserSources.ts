import { useState, useCallback } from 'react'
import type { UserCustomSource } from '@/types/source'
import { apiUrl } from '@/config/api'

export function useUserSources(token: string | null) {
  const [sources, setSources] = useState<UserCustomSource[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/me/sources'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSources(Array.isArray(data) ? data : [])
      }
    } catch {
      setSources([])
    } finally {
      setLoading(false)
    }
  }, [token])

  return { sources, loading, reload: load }
}
